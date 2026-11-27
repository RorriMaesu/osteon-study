import * as THREE from 'three';

// The regional GLBs and this skeleton already share the main atlas frame.
// Screen-size dots sit on original mesh vertices, so tiny node groups can be picked.
export function mountNodeContext(instance,spec,meshes,targetFor,panel){
  const info=panel.querySelector('[data-ap3-node-context]');
  const landmarks=panel.querySelector('[data-ap3-landmarks]');
  const dots=panel.querySelector('[data-ap3-dots]');
  const bounds=new THREE.Box3().setFromObject(instance.model).expandByScalar(.035);
  const marks=[];
  const uv=document.createElement('canvas');uv.width=uv.height=32;
  const ctx=uv.getContext('2d');ctx.fillStyle='white';ctx.beginPath();ctx.arc(16,16,12,0,2*Math.PI);ctx.fill();
  const texture=new THREE.CanvasTexture(uv);
  const geo=new THREE.BufferGeometry(),positions=[],colors=[];
  const pos=new THREE.Vector3();
  for(const m of meshes){
    const target=targetFor.get(m);if(!target)continue;
    const center=new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());
    let best=Infinity,nearest;
    const attr=m.geometry.attributes.position;
    for(let i=0;i<attr.count;i++){
      pos.fromBufferAttribute(attr,i).applyMatrix4(m.matrixWorld);
      const d=pos.distanceToSquared(center);
      if(d<best){best=d;nearest=pos.clone();}
    }
    if(!nearest)continue;
    marks.push({point:nearest,target});positions.push(...nearest.toArray());colors.push(.22,.62,.31);
  }
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const cloud=new THREE.Points(geo,new THREE.PointsMaterial({size:9,sizeAttenuation:false,map:texture,alphaTest:.3,vertexColors:true,depthTest:false,depthWrite:false}));
  cloud.renderOrder=5;
  instance.scene.add(cloud);
  let skeleton,selected,isolate,closed=false;
  const update=(focus,alone)=>{
    selected=focus;isolate=alone;
    cloud.visible=dots.checked&&!isolate;
    if(skeleton)skeleton.visible=landmarks.checked&&!isolate;
    marks.forEach((mark,i)=>{const c=mark.target===selected?[1,.60,.055]:[.08,.41,.17];geo.attributes.color.setXYZ(i,...c);});
    geo.attributes.color.needsUpdate=true;instance.invalidate();
  };
  dots.onchange=landmarks.onchange=()=>update(selected,isolate);
  const pick=(e,box)=>{
    if(!cloud.visible)return null;
    let best=9,result=null;
    for(const mark of marks){
      pos.copy(mark.point).project(instance.camera);
      const x=box.left+(pos.x+1)*box.width/2,y=box.top+(1-pos.y)*box.height/2;
      const dist=Math.hypot(x-e.clientX,y-e.clientY);
      if(dist<best){best=dist;result=mark.target;}
    }
    return result;
  };
  info.textContent='Loading skeletal landmarks…';
  instance.loadLayer('assets/skeleton.glb').then(layer=>{
    if(closed)return;
    skeleton=layer;
    const bones=new THREE.MeshStandardMaterial({color:'#a9957e',roughness:.9,metalness:0,
      transparent:true,opacity:.30,depthWrite:false});
    const previous=new Set();
    layer.traverse(obj=>{
      if(!obj.isMesh)return;
      for(const material of [].concat(obj.material))previous.add(material);
      obj.material=bones;
      const name=obj.userData.zname||obj.name;
      obj.visible=spec.id==='nodes-overview'||(spec.id==='nodes-neck'?/Vertebra C|Atlas|Axis|Mandible|Hyoid|Clavicle|First rib/i.test(name):bounds.intersectsBox(new THREE.Box3().setFromObject(obj)));
    });
    for(const material of previous)material.dispose();
    update(selected,isolate);if(!selected)instance.fit();
    info.textContent='Green dots mark representative node groups. The bones share their atlas coordinates.';
  }).catch(()=>{if(!closed)info.textContent='Skeletal context could not load. The node surfaces and the body atlas link are available.';});
  instance.addCleanup(()=>{closed=true;});
  update(null,false);
  return {update,pick};
}

