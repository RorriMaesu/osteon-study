import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {areaForBone,areaLabel,inArea,boneFamily,boneId,isBone,navigationAction} from '../src/exploration.js';
const b=fs.readFileSync(new URL('../assets/skeleton.glb',import.meta.url));
const names=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString()).nodes.map(n=>n.extras.zname);

test('every actual skeleton bone has a regional destination and a bilateral palette identity',()=>{
 for(const name of names.filter(isBone)){
  assert.ok(boneFamily(name),'Missing color: '+name);
  const area=areaForBone(name);assert.ok(area,'Missing region: '+name);
  assert.ok(inArea(name,area,name.endsWith('.r')?'r':'l',{core:true}),name);
  if(name.endsWith('.l'))assert.deepEqual(boneFamily(name),boneFamily(name.replace(/\.l$/,'.r')));
 }
 for(const name of names.filter(n=>!isBone(n)))assert.equal(boneFamily(name),null,name);
});
test('double-click opens a region before a bone and repeated bone focus is stable',()=>{
 assert.equal(navigationAction({level:'overview'},'Scapula.r'),'region');
 const region={level:'region',areaId:'shoulder',side:'r'};
 assert.equal(navigationAction(region,'Scapula.r'),'bone');
 assert.equal(navigationAction(region,'Scapula.l'),'region');
 assert.equal(navigationAction({level:'bone',areaId:'shoulder',side:'r',boneId:'Scapula.r'},'Scapula.r'),null);
 assert.equal(navigationAction({level:'region',areaId:null},'Parietal bone.r'),'bone');
 assert.equal(navigationAction(region,'Scapula.r',true),null);
 assert.equal(navigationAction({level:'overview'},'Costal cartilage of first rib.r'),null);
});
test('regional scope retains neighbors on the correct side without confusing the target bounds',()=>{
 assert.ok(inArea('Humerus.r','shoulder','r'));
 assert.ok(!inArea('Humerus.r','shoulder','r',{core:true}));
 assert.ok(!inArea('Humerus.l','shoulder','r'));
 assert.ok(inArea('Sacrum','pelvis',null,{core:true}));
 assert.ok(inArea('Hip bone.l','pelvis','r',{core:true}));
 assert.equal(areaForBone('Hyoid bone'),'neck');
 assert.equal(areaForBone('Vertebra L4'),'lower-back');
 assert.equal(areaForBone('Scaphoid bone.l'),'hand');
 assert.equal(areaForBone('Talus.l'),'foot');
 assert.equal(areaLabel('hand','l'),'Left hand and wrist');
});
test('sternum parts focus as one adult bone while paired and serial bones retain their identities',()=>{
 assert.equal(boneId('Manubrium of sternum'),'Sternum');
 assert.equal(boneId('Xiphoid process'),'Sternum');
 assert.notEqual(boneId('Hip bone.l'),boneId('Hip bone.r'));
 assert.notEqual(boneId('Vertebra T1'),boneId('Vertebra T2'));
 assert.equal(boneFamily('Body of sternum').color,boneFamily('Manubrium of sternum').color);
 assert.notEqual(boneFamily('Radius.l').color,boneFamily('Ulna.l').color);
 assert.notEqual(boneFamily('Proximal phalanx of first finger of hand.l').color,boneFamily('Distal phalanx of first finger of hand.l').color);
});
