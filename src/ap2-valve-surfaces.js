import * as THREE from 'three';

// Centers follow the source HRA surfaces; the axes point into the downstream
// chamber or artery. Radii, geometry and travel are illustrative.
export const cardiacValves=[
  {key:'mitral',label:'Mitral',from:'la',to:'lv',range:1.2,center:[.0261,.4746,.0145],axis:[.47,-.39,.79],radius:.017,cusps:2,av:true},
  {key:'aortic',label:'Aortic',from:'lv',to:'ao',range:2,center:[.0089,.4971,.0279],axis:[-.40,.916,-.03],radius:.009,cusps:3,av:false},
  {key:'tricuspid',label:'Tricuspid',from:'ra',to:'rv',range:1.2,center:[-.0024,.4589,.0466],axis:[.77,-.13,.63],radius:.019,cusps:3,av:true},
  {key:'pulmonary',label:'Pulmonary',from:'rv',to:'pa',range:2,center:[.0179,.5086,.0432],axis:[-.22,.77,-.60],radius:.009,cusps:3,av:false}
];
export function openingFor(valve,state){
  const gradient=state[valve.from]-state[valve.to];
  return state[valve.key]?Math.min(1,Math.sqrt(Math.max(0,gradient)/valve.range)):0;
}
export function makeTeachingValve({center,axis,radius,cusps,av}) {
  const root=new THREE.Group(), axial=new THREE.Vector3(...axis).normalize();
  root.position.set(...center);
  root.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),axial);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,radius*.05,8,64),new THREE.MeshStandardMaterial({color:0xcdad75,roughness:.8}));
  root.add(ring);
  const sectors=18, layers=5;
  const leaves=[];
  for(let k=0;k<cusps;k++){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array((sectors+1)*(layers+1)*3),3));
    const indices=[];
    for(let i=0;i<sectors;i++)for(let j=0;j<layers;j++){
      const a=i*(layers+1)+j,b=a+layers+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
    geometry.setIndex(indices);
    const leaf=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,color:k%2?'#f0c782':'#f4d99f',roughness:.87}));
    leaf.frustumCulled=false;leaves.push(leaf);root.add(leaf);
  }
  let last=-1;
  function open(amount){
    if(Math.abs(last-amount)<.003)return;
    last=amount;
    leaves.forEach((leaf,k)=>{
      const attr=leaf.geometry.getAttribute('position');
      for(let i=0;i<=sectors;i++)for(let j=0;j<=layers;j++){
        const u=i/sectors,v=j/layers,theta=(k+u)*2*Math.PI/cusps,mid=Math.sin(Math.PI*u);
        const rimX=radius*Math.cos(theta),rimY=radius*Math.sin(theta);
        const edgeAngle=(k+(u<.5?0:1))*2*Math.PI/cusps;
        const edgeRadius=radius*Math.abs(2*u-1);
        const closedX=cusps===2?rimX:edgeRadius*Math.cos(edgeAngle);
        const closedY=cusps===2?0:edgeRadius*Math.sin(edgeAngle);
        const freeX=closedX+(rimX-closedX)*amount*.84;
        const freeY=closedY+(rimY-closedY)*amount*.84;
        const bulge=av?.15:.32;
        const z=radius*v*(amount*(av?1.05:.70)*mid-bulge*(1-amount)*mid);
        attr.setXYZ(i*(layers+1)+j,rimX+v*(freeX-rimX),rimY+v*(freeY-rimY),z);
      }
      attr.needsUpdate=true;leaf.geometry.computeVertexNormals();
    });
  }
  open(0);
  return {root,open};
}

