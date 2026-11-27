import test from 'node:test';
import assert from 'node:assert/strict';
import {bank,grade} from '../src/ap2-exam-core.js';
import {checkQuantity} from '../src/ap2-quantities.js';
test('cardiac output accepts dimensionally equivalent responses and explains unit errors',()=>{
 const output=bank.find(row=>row.id==='ap2-19.4-cardiac-output');
 for(const answer of ['5.46','5.46 L/min','5.46 litres per minute','5,460 mL/min','5460 mL/min','.091 L/s'])
   assert.equal(grade(output,answer),'correct',answer);
 for(const answer of ['5.46 mL','5.46 mL/min','5460','5.46 to 6 L/min','5..46','5,46'])
   assert.equal(grade(output,answer),'incorrect',answer);
 assert.match(checkQuantity(output,'5.46 mL').reason,/units/);
 assert.match(checkQuantity(output,'5460').reason,/1,000/);
});
test('optional units preserve time, speed, count and oxygen content dimensions',()=>{
 const byId=id=>bank.find(row=>row.id.endsWith(id));
 for(const [id,answer] of [['reflex-latency','0.024 s'],['axon-speed','4000 cm/s'],['spinal-inventory','31 pairs'],['oxygen-capacity','201 mL O₂/L'],['reflex-rate','100 bpm']])
   assert.equal(grade(byId(id),answer),'correct',id);
 assert.equal(grade(byId('reflex-latency'),'24 m/s'),'incorrect');
});
