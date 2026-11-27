import {readFile,writeFile,readdir} from 'node:fs/promises';
const prefix='assets/ap3-models/';
const newPaths=(await readdir(prefix)).filter(n=>n.endsWith('.glb')).map(n=>prefix+n);
const reused=['ap2-neuro/nose','ap2-neuro/enteric-wall','ap2-glands/marrow-section','ap2-glands/ovarian-region','ap2-glands/placenta','ap2-fetal-flow','ap2-glands/skin-fat-section','ap2-blood/formed-elements',
  ...['overview','head','neck','thorax','abdomen','pelvis','upper-limb','lower-limb'].map(r=>'lymph-nodes-'+r)];
const inventory={};
for(const asset of [...newPaths,...reused.map(n=>'assets/'+n+'.glb')].sort()){
  const buf=await readFile(asset);
  const gltf=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
  const sceneNodes=new Set();
  function visit(index){if(sceneNodes.has(index))return;sceneNodes.add(index);for(const child of gltf.nodes[index].children||[])visit(child);}
  for(const index of gltf.scenes[gltf.scene||0].nodes)visit(index);
  inventory[asset]=[...sceneNodes].map(i=>gltf.nodes[i]).filter(n=>n.mesh!==undefined).map(n=>n.name);
}
await writeFile('src/ap3-specimens-meshes.json',JSON.stringify(inventory,null,2)+'\n');

