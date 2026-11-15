import * as THREE from 'three';

export const walkScopes={
 all:'Whole body',
 'head-neck':'Head & neck',
 trunk:'Chest, abdomen & back',
 'right-arm':'Right arm',
 'left-arm':'Left arm',
 'right-leg':'Right leg',
 'left-leg':'Left leg',
};

export function walkScopeMatches(scope,region,side,segments){
 if(scope==='all')return true;
 if(scope==='head-neck')return region==='head-neck';
 if(segments?.length)return segments.includes(scope==='trunk'?'trunk':scope);
 if(scope==='trunk')return region==='trunk-back';
 const [wantedSide,limb]=scope.split('-');
 if(side!==wantedSide)return false;
 return limb==='arm'?region==='shoulder-arm'||region==='forearm-hand':
  limb==='leg'&&region==='pelvis-leg-foot';
}

export function walkBoneRegion(mesh){
 const native=mesh.userData.zname||mesh.userData.motionBone||mesh.name;
 const side=native.match(/\.(l|r)$/i)?.[1].toLowerCase();
 const inLeg=mesh.userData.motionKind==='bone';
 if(inLeg)return {region:'pelvis-leg-foot',side:side==='r'?'right':side==='l'?'left':'midline'};
 let region='trunk-back',parent=mesh.parent;
 while(parent){
  if(parent.name==='MotionWalkHead'){region='head-neck';break;}
  if(/^MotionWalk(Shoulder|Elbow)/.test(parent.name)){region='shoulder-arm';break;}
  if(parent.name==='MotionTorso'){
   if(/cervical vertebrae/i.test(mesh.userData.zgroup||''))region='head-neck';
   break;
  }
  parent=parent.parent;
 }
 return {region,side:side==='r'?'right':side==='l'?'left':'midline'};
}

// Each receiver retains its own resting position and orientation. The walking
// driver contributes the change from its neutral pose in the shared atlas frame.
export function mountWalkPack(specimen,scene,driverNames,drivers){
 specimen.model.add(scene);
 scene.updateWorldMatrix(true,true);
 const bindings=[];
 for(const [driverName,receiverName] of Object.entries(driverNames)){
  const node=scene.getObjectByName(receiverName);
  if(!node)continue;
  const driver=drivers.get(driverName);
  if(!driver)throw new Error('A walking surface has no matching joint.');
  bindings.push({
   node,
   driver:driver.node,
   relative:driver.inverse.clone().multiply(node.matrixWorld),
   parentInverse:node.parent.matrixWorld.clone().invert(),
  });
  node.matrixAutoUpdate=false;
 }
 if(!bindings.length)throw new Error('The walking muscle pack has no joint bindings.');
 return {scene,bindings};
}

export function captureWalkDrivers(model,names){
 model.updateWorldMatrix(true,true);
 return new Map(names.map(name=>{
  const node=model.getObjectByName(name);
  if(!node)throw new Error('One of the walking joints could not be found.');
  return [name,{node,inverse:node.matrixWorld.clone().invert()}];
 }));
}

export function updateWalkPacks(packs){
 const drivers=new Set(packs.flatMap(pack=>pack.bindings.map(binding=>binding.driver)));
 for(const driver of drivers)driver.updateWorldMatrix(true,false);
 for(const pack of packs){
  for(const {node,driver,relative,parentInverse} of pack.bindings){
   node.matrix.copy(parentInverse).multiply(driver.matrixWorld).multiply(relative);
   node.matrixWorldNeedsUpdate=true;
  }
 }
}

export function walkScopeBounds(parts,bones,scope){
 const bounds=new THREE.Box3();
 for(const part of [...parts,...bones]){
  if(walkScopeMatches(scope,part.region,part.side,part.walkSegments)){
   const mesh=part.mesh;
   if(mesh.isSkinnedMesh){
    if(!mesh.boundingBox)mesh.computeBoundingBox();
    if(mesh.boundingBox)bounds.union(mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
   }else bounds.expandByObject(mesh);
  }
 }
 return bounds;
}
