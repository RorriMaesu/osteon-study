import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {allTerms} from '../src/data.js';
import '../src/representations.js';
import {clarityTargets} from '../src/clarity-practical.js';
import {drawerProgress,drawerDisplacement,drawerElapsed,DRAWER_AMPLITUDE} from '../src/drawer-kinematics.js';
import evidence from '../src/exam-clarity-evidence.json' with {type:'json'};
const b=fs.readFileSync(new URL('../assets/landmark-details.glb',import.meta.url)),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len)),offset=28+len;
function accessor(index){const a=j.accessors[index],v=j.bufferViews[a.bufferView],size={5126:4,5125:4,5123:2}[a.componentType],components=a.type==='VEC3'?3:1,start=offset+(v.byteOffset||0)+(a.byteOffset||0),read=a.componentType===5126?'readFloatLE':a.componentType===5125?'readUInt32LE':'readUInt16LE';return Array.from({length:a.count},(_,i)=>Array.from({length:components},(_,k)=>b[read](start+i*(v.byteStride||size*components)+k*size)));}
function geo(n){assert.ok(!n.matrix&&!n.translation&&!n.rotation&&!n.scale,'Use baked coordinates');const p=j.meshes[n.mesh].primitives[0],v=accessor(p.attributes.POSITION),ids=accessor(p.indices).flat();return {v,tri:Array.from({length:ids.length/3},(_,i)=>ids.slice(i*3,i*3+3).map(k=>v[k]))};}
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function blocked(tri,a,b){const d=sub(b,a),len=Math.hypot(...d),direction=d.map(x=>x/len);return tri.some(([v0,v1,v2])=>{const e1=sub(v1,v0),e2=sub(v2,v0),h=cross(direction,e2),det=dot(e1,h);if(Math.abs(det)<1e-12)return false;const inv=1/det,s=sub(a,v0),u=inv*dot(s,h);if(u<0||u>1)return false;const q=cross(s,e1),v=inv*dot(direction,q);if(v<0||u+v>1)return false;const t=inv*dot(e2,q);return t>1e-6&&t<len-1e-6;});}
const term=id=>allTerms.find(t=>t.id===id);
test('focused practical includes all sixteen reported targets without releasing existing holds',()=>{
 assert.equal(clarityTargets.length,16);assert.equal(new Set(clarityTargets).size,16);
 for(const id of clarityTargets){assert.ok(term(id),id);assert.notEqual(term(id).representation.assessment,'learn-only',id);}
 for(const id of ['fontanelles','ethmoid-drainage']){const t=term(id);if(t)assert.equal(t.representation.assessment,'learn-only');}
});
test('jugular reconstruction has a continuous lumen through both contributing bones',()=>{
 const {path,radiusMm}=evidence.changes['jugular-foramen'];assert.equal(radiusMm,3.2);assert.match(term('jugular-foramen').representation.note,/teaching|explanatory/);
 for(const name of ['Temporal bone.r','Occipital bone']){const n=j.nodes.find(n=>n.extras?.zname===name),g=geo(n);for(let i=1;i<path.length;i++)assert.equal(blocked(g.tri,path[i-1],path[i]),false,name+' blocks jugular segment '+i);}
});
test('surface and length guides target named anatomy and stay out of unrelated model groups',()=>{
 for(const id of clarityTargets.filter(id=>!['jugular-foramen','mandibular-foramina','anterior-drawer','posterior-drawer'].includes(id))){const guides=j.nodes.filter(n=>n.extras?.focusFor?.includes(id));assert.ok(guides.length,id);for(const n of guides){assert.equal(n.extras.guideOnly,true,id);assert.equal(n.extras.detailGroup,'landmark-focus');assert.ok(n.extras.focusParent);assert.ok(geo(n).tri.length);}}
 const r=term('costal-facets').representation;assert.equal(r.points.length,3);assert.equal(r.presentAllPoints,true);assert.deepEqual(new Set(r.points.map(p=>p.label)),new Set(['Superior costal facet','Inferior costal facet','Transverse costal facet']));
});
test('ethmoid conchae use explicitly reconstructed connected lamellae and exposed label vertices',()=>{
 const r=term('superior-and-middle-nasal-conchae').representation;assert.equal(r.kind,'teaching-pin');assert.equal(r.detailGroup,'ethmoid-conchae');assert.equal(r.teachingMorphology,true);assert.equal(r.presentAllPoints,true);assert.match(r.note,/inferior concha is a separate bone/);
 for(const p of r.points){const n=j.nodes.find(n=>n.extras?.zname===p.parent);assert.ok(n.extras.teachingMorphology);const {v}=geo(n);assert.ok(Math.min(...v.map(v=>Math.hypot(...sub(v,p.point))))<1e-6,p.label);}
 assert.ok(j.nodes.some(n=>n.extras?.zname==='Ethmoid bone'&&n.extras?.replacementAnatomy));
});
test('drawer uses capped native bones, a fixed flexed femur, and AP-only opposite translations',()=>{
 const n=j.nodes.filter(n=>n.extras?.detailGroup==='drawer-knee');assert.equal(n.length,3);assert.equal(n.filter(n=>n.extras.motionRole==='fixed').length,1);assert.equal(n.filter(n=>n.extras.motionRole==='moving').length,2);
 for(const info of Object.values(evidence.drawer))assert.equal(info.croppedAndCapped,true);
 assert.equal(evidence.drawer['Femur.r'].poseDegrees,90);assert.equal(evidence.drawer['Tibia.r'].poseDegrees,0);
 assert.deepEqual(drawerDisplacement(1,true),[0,0,DRAWER_AMPLITUDE]);assert.deepEqual(drawerDisplacement(1,false),[0,0,-DRAWER_AMPLITUDE]);
 let last=0;for(let t=0;t<10;t+=.05){const frame=drawerProgress(t);assert.ok(frame.progress>=last&&frame.progress<=1);last=frame.progress;}assert.equal(drawerProgress(10).complete,true);assert.equal(drawerProgress(10).progress,1);
 for(const p of [0,.1,.4,.7,.99,1])assert.ok(Math.abs(drawerProgress(drawerElapsed(p)).progress-p)<1e-10,'Scrubbing must resume at the inspected displacement');
});
test('native resolution and pre-edit backup evidence remain auditable',()=>{
 assert.match(evidence.blenderVersion,/4\.5/);assert.match(evidence.backup,/^\d{3}-/);assert.match(evidence.installation.beforeProject,/^\d{3}-/);assert.match(evidence.installation.beforeExport,/^\d{3}-/);assert.notEqual(evidence.installation.beforeProject,evidence.installation.beforeExport);
 for(const name of ['Humerus.r','Scapula.r','Tibia.r','Hip bone.r','Vertebra T6','Mandible']){const g=geo(j.nodes.find(n=>n.extras?.zname===name)),omitted=evidence.after[name].exportOmittedTriangles;assert.equal(g.tri.length,evidence.after[name].exportTriangleCount);assert.ok(omitted.every(t=>t.identicalExportedFaceRetained||t.areaSquareMeters<2e-11),'Only audited duplicates/negligible triangles may be omitted');assert.ok(g.tri.length>=evidence.before[name].faces-omitted.length,name+' lost source resolution');}
});
