import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {meshDivision,termDivision,inDivision,skullFamilies,skullFamily} from '../src/anatomy.js';
import {terms} from '../src/data.js';
import '../src/representations.js';
const b=fs.readFileSync(new URL('../assets/skeleton.glb',import.meta.url));
const nodes=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString()).nodes;
test('22 skull bones share fourteen bilateral family colors, excluding teeth and sinus volumes',()=>{
 const skull=skullFamilies.filter(f=>f.group!=='Associated');
 assert.equal(skull.length,14);assert.equal(skull.reduce((n,f)=>n+f.count,0),22);
 for(const f of skull){assert.equal(nodes.filter(n=>skullFamily(n.extras.zname)===f).length,f.count);}
 assert.equal(skullFamily('Sinus of frontal bone'),undefined);assert.equal(skullFamily('Upper canine.r'),undefined);
 assert.equal(skullFamily('Parietal bone.l').color,skullFamily('Parietal bone.r').color);
});
test('division boundaries respect girdles, sacrum and associated tissues',()=>{
 for(const n of ['Sacrum','Coccyx','Hyoid bone','Stylohyoid ligament.l','Vertebral artery.r','Intervertebral disc L5-S1'])assert.equal(meshDivision(n),'Axial',n);
 for(const n of ['Hip bone.l','Clavicle.r','Pubic symphysis','Trapezoid ligament.l','Deep part of tibial collateral ligament.r'])assert.equal(meshDivision(n),'Appendicular',n);
 for(const t of terms){assert.ok(['Axial','Appendicular','Mixed'].includes(termDivision(t)));assert.ok(inDivision(t,'All'));}
 for(const name of ['Pelvis','Pelvic brim']){const t=terms.find(t=>t.name===name);assert.equal(inDivision(t,'Axial'),false);assert.equal(inDivision(t,'Appendicular'),false);}
 assert.equal(termDivision(terms.find(t=>t.name==='Sacral foramina')),'Axial');
});
