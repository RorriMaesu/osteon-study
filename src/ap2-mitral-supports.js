import {Group,Mesh,MeshStandardMaterial,TubeGeometry,Vector3,QuadraticBezierCurve3} from 'three';

export const papillaryGroups=['anterolateral','posteromedial'];
export const papillaryName=group=>'VH_M_papillary_muscle_of_heart_'+group;
const leaflet='VH_M_mitral_valve';
export const isMitralSupport=name=>name===leaflet||papillaryGroups.some(group=>name===papillaryName(group));

function nearestSurfaceVertex(mesh,goal){
  const positions=mesh.geometry.getAttribute('position'),candidate=new Vector3(),nearest=new Vector3();
  let min=Infinity;
  for(let i=0;i<positions.count;i++){
    candidate.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
    const distance=candidate.distanceToSquared(goal);
    if(distance<min){min=distance;nearest.copy(candidate);}
  }
  return nearest;
}

// Four illustrative strands attach to actual surface vertices. The segmentation
// does not separate individual chordae or the two leaflets.
export function makeMitralSupports(model){
  const group=new Group(),valve=model.getObjectByName(leaflet);
  if(!valve)return group;
  model.updateWorldMatrix(true,true);
  const center=new Vector3(.0261,.4746,.0145),normal=new Vector3(.47,-.39,.79).normalize();
  const aorticSide=new Vector3(.0089,.4971,.0279).sub(center).projectOnPlane(normal).normalize();
  const commissure=new Vector3().crossVectors(normal,aorticSide).normalize();
  for(const name of papillaryGroups){
    const muscle=model.getObjectByName(papillaryName(name));if(!muscle)continue;
    const origin=nearestSurfaceVertex(muscle,center);
    const side=Math.sign(origin.clone().sub(center).dot(commissure))||1;
    for(const offset of [-.0045,.0045]){
      const target=center.clone().addScaledVector(normal,.004).addScaledVector(commissure,side*.005).addScaledVector(aorticSide,offset);
      const end=nearestSurfaceVertex(valve,target);
      const bend=end.clone().lerp(origin,.5).addScaledVector(commissure,.0008*side);
      const strand=new Mesh(new TubeGeometry(new QuadraticBezierCurve3(origin,bend,end),12,.00045,8,false),new MeshStandardMaterial({color:'#68c5ce',roughness:.8}));
      strand.name='Teaching chord · '+name;
      strand.userData={papillary:name,origin:origin.toArray(),end:end.toArray()};
      group.add(strand);
    }
  }
  group.visible=false;
  return group;
}
