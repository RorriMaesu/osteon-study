import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {allTerms} from '../src/data.js';
import '../src/representations.js';
import evidence from '../src/blender-refinement-evidence.json' with {type:'json'};
const b=fs.readFileSync(new URL('../assets/landmark-details.glb',import.meta.url)),length=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+length)),binaryStart=28+length;
function accessor(index){const a=j.accessors[index],v=j.bufferViews[a.bufferView],size={5126:4,5125:4,5123:2}[a.componentType],components=a.type==='VEC3'?3:1,start=binaryStart+(v.byteOffset||0)+(a.byteOffset||0),read=a.componentType===5126?'readFloatLE':a.componentType===5125?'readUInt32LE':'readUInt16LE';return Array.from({length:a.count},(_,i)=>Array.from({length:components},(_,k)=>b[read](start+i*(v.byteStride||size*components)+k*size)));}
const cache=new Map();function geometry(name){if(cache.has(name))return cache.get(name);const node=j.nodes.find(n=>n.extras?.zname===name);assert.ok(node?.extras.replacementAnatomy,name);assert.ok(!node.matrix&&!node.translation&&!node.rotation&&!node.scale,'Test expects world-baked bone coordinates');const p=j.meshes[node.mesh].primitives[0],v=accessor(p.attributes.POSITION),ii=accessor(p.indices).flat(),tri=[];for(let k=0;k<ii.length;k+=3)tri.push([v[ii[k]],v[ii[k+1]],v[ii[k+2]]]);cache.set(name,{v,tri});return cache.get(name);}
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function blocked(tri,a,b){const d=sub(b,a),len=Math.hypot(...d),direction=d.map(x=>x/len);for(const [v0,v1,v2]of tri){const e1=sub(v1,v0),e2=sub(v2,v0),h=cross(direction,e2),det=dot(e1,h);if(Math.abs(det)<1e-12)continue;const inv=1/det,s=sub(a,v0),u=inv*dot(s,h);if(u<0||u>1)continue;const q=cross(s,e1),v=inv*dot(direction,q);if(v<0||u+v>1)continue;const t=inv*dot(e2,q);if(t>1e-6&&t<len-1e-6)return true;}return false;}
test('Blender reconstructions have actual bone lumina and labels on their generated rims',()=>{
 for(const [id,x]of Object.entries(evidence.features)){
  const t=allTerms.find(t=>t.feature?.id===id||t.id===id),r=t.representation;assert.equal(r.reviewStatus,'modeled-opening-verified');assert.equal(r.retiredModel,false);assert.notEqual(r.assessment,'learn-only');assert.equal(r.detailGroup,null);assert.equal(r.kind,'3d-landmark');
  const parents=x.parentPattern.split('||');for(const name of parents){const g=geometry(name);for(let i=0;i<x.path.length-1;i++)assert.equal(blocked(g.tri,x.path[i],x.path[i+1]),false,id+' blocked by '+name+' at segment '+i);}
  const rimDistance=Math.min(...parents.flatMap(name=>geometry(name).v.map(p=>Math.hypot(...sub(p,x.point)))));assert.ok(rimDistance<.000002,id+' label must be on a generated bone vertex');
 }
 for(const [name,s]of Object.entries(evidence.boneTopology)){assert.equal(s.after.boundaryEdges,s.before.boundaryEdges,name+' introduced a broken boundary');assert.equal(s.after.nonManifoldEdges,s.before.nonManifoldEdges,name+' introduced nonmanifold edges');}
 assert.ok(evidence.boneTopology['Temporal bone.r'].after.vertices>7000,'Preserve original inner temporal surfaces');
});
test('new terminal facial passage preserves the native carotid lumen',()=>{
 const r=allTerms.find(t=>t.name==='Carotid canal').representation,path=r.verification.route.path,g=geometry('Temporal bone.r');for(let i=0;i<path.length-1;i++)assert.equal(blocked(g.tri,path[i],path[i+1]),false,'Native carotid segment '+i);
});
