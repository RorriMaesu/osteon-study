import * as THREE from 'three';
import {isToothMesh,TOOTH_COLOR} from './dental-appearance.js';

// These maps show the skeleton as a single static reference. Batch its donor
// surfaces once, retaining their transforms and normals. A shared depth pass
// keeps the X-ray mode from stacking dozens of bone faces at different angles.
export function createBoneContext(parent,meshes,{omitTeeth=false}={}){
  const teeth=new Set(meshes.filter(isToothMesh));
  if(omitTeeth&&teeth.size){
    // The organ map supplies its own selectable, peelable dental arches.
    for(const mesh of teeth)mesh.visible=false;
    meshes=meshes.filter(mesh=>!teeth.has(mesh));
  }
  if(!meshes.length)return null;
  parent.updateWorldMatrix(true,true);
  const inverse=parent.matrixWorld.clone().invert();
  const vertices=meshes.reduce((n,m)=>n+m.geometry.attributes.position.count,0);
  const count=meshes.reduce((n,m)=>n+(m.geometry.index||m.geometry.attributes.position).count,0);
  const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3);
  const boneColor=new THREE.Color('#d9c4a6'),toothColor=new THREE.Color(TOOTH_COLOR);
  // Regional maps use the skeleton's teeth. Tint them within the same draw
  // call in solid view. The depth and X-ray passes ignore vertex colors.
  const colors=!omitTeeth&&teeth.size?new Uint8Array(vertices*3):null;
  const indices=vertices>65535?new Uint32Array(count):new Uint16Array(count);
  const transform=new THREE.Matrix4(),normalMatrix=new THREE.Matrix3(),point=new THREE.Vector3();
  let vertex=0,index=0;
  for(const mesh of meshes){
    const source=mesh.geometry,pos=source.attributes.position,normal=source.attributes.normal;
    transform.multiplyMatrices(inverse,mesh.matrixWorld);
    normalMatrix.getNormalMatrix(transform);
    const tint=colors?(teeth.has(mesh)?toothColor:boneColor).toArray().map(channel=>Math.round(channel*255)):null;
    for(let i=0;i<pos.count;i++){
      point.fromBufferAttribute(pos,i).applyMatrix4(transform).toArray(positions,(vertex+i)*3);
      if(normal)point.fromBufferAttribute(normal,i).applyNormalMatrix(normalMatrix).toArray(normals,(vertex+i)*3);
      if(tint)colors.set(tint,(vertex+i)*3);
    }
    const length=(source.index||pos).count,mirrored=transform.determinant()<0;
    for(let i=0;i<length;i+=3){
      for(let j=0;j<3;j++){
        const at=i+(mirrored&&j?3-j:j);
        indices[index++]=vertex+(source.index?source.index.getX(at):at);
      }
    }
    vertex+=pos.count;
    mesh.visible=false;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  if(colors)geometry.setAttribute('color',new THREE.BufferAttribute(colors,3,true));
  geometry.setIndex(new THREE.BufferAttribute(indices,1));
  if(meshes.every(mesh=>mesh.geometry.attributes.normal))geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
  else geometry.computeVertexNormals();
  const solid=new THREE.MeshStandardMaterial({color:colors?0xffffff:boneColor,vertexColors:Boolean(colors),roughness:.84,side:THREE.DoubleSide});
  const faint=new THREE.MeshStandardMaterial({color:'#d9c4a6',roughness:.84,side:THREE.DoubleSide,
    transparent:true,opacity:.24,depthWrite:false,depthFunc:THREE.EqualDepth});
  const depth=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,transparent:true,colorWrite:false,depthWrite:true});
  faint.forceSinglePass=true;depth.forceSinglePass=true;
  const surface=new THREE.Mesh(geometry,solid),nearest=new THREE.Mesh(geometry,depth);
  nearest.renderOrder=90;surface.renderOrder=91;
  parent.add(nearest,surface);
  return {surface,
    setMode(mode){
      nearest.visible=mode==='xray';surface.visible=mode!=='off';
      surface.material=mode==='xray'?faint:solid;
    },
    dispose(){
      parent.remove(nearest,surface);geometry.dispose();solid.dispose();faint.dispose();depth.dispose();
    }
  };
}
