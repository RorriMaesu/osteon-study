import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describePoseAxis,poseMotionCycle,poseMotionOptions} from '../src/motion-pose-motions.js';
import {poseRoles} from '../src/motion-pose-core.js';

const meta=JSON.parse(readFileSync(new URL('../assets/motion-pose-body.json',import.meta.url),'utf8'));
const joint=id=>meta.joints.find(item=>item.id===id);

test('every authored motion has readable directional controls and a bounded demonstration',()=>{
 for(const descriptor of meta.joints)for(const axis of descriptor.axes){
  const text=describePoseAxis(descriptor,axis.id),cycle=poseMotionCycle(descriptor,axis.id),name=descriptor.id+':'+axis.id;
  assert.ok(text.source,name+' has a reviewed directional description');
  assert.notEqual(text.positive,text.negative,name+' directions differ');
  assert.ok(text.positiveHint.length<=16&&text.negativeHint.length<=16,name+' fits touch controls');
  assert.ok(cycle&&cycle.from>=axis.min&&cycle.to<=axis.max&&cycle.from<cycle.to,name+' demo is bounded');
  assert.ok(cycle.duration>=6,name+' demo remains slow enough to follow');
  assert.notEqual(poseRoles(descriptor,axis.id,1).label,'Joint adjustment',name+' has named muscle roles');
 }
});

test('left and right motion names describe anatomy rather than camera orientation',()=>{
 for(const side of ['right','left']){
  assert.equal(describePoseAxis(joint(side+'-wrist'),'deviation').positive,'Wrist ulnar deviation');
  assert.equal(describePoseAxis(joint(side+'-forearm'),'pronation').negative,'Forearm supination');
 }
 assert.equal(describePoseAxis(joint('neck'),'rotation').positive,'Neck rotation to the right');
 assert.match(describePoseAxis(joint('neck'),'rotation').label,/body’s right/);
});

test('a flexed elbow demo returns to straight without inventing hyperextension',()=>{
 const elbow=joint('right-elbow'),cycle=poseMotionCycle(elbow,'flexion');
 assert.equal(cycle.from,0);
 assert.equal(cycle.to,elbow.axes[0].max*.6);
 const options=poseMotionOptions(elbow,'flexion');
 assert.equal(options[0].label,'Elbow extension');
 assert.equal(options[0].target,0);
 assert.equal(options[1].label,'Elbow flexion');
});

test('unreviewed and malformed axes cannot quietly become demonstrations',()=>{
 assert.equal(poseMotionCycle({id:'unknown',axes:[{id:'spin',min:0,max:90}]},'spin'),null);
 assert.equal(poseMotionCycle({id:'right-elbow',axes:[{id:'flexion',min:NaN,max:90}]},'flexion'),null);
 assert.equal(poseMotionCycle({id:'right-elbow',axes:[{id:'flexion',min:9,max:9}]},'flexion'),null);
 assert.deepEqual(poseMotionOptions(null,'spin'),[]);
 assert.equal(describePoseAxis(null,'spin').source,null);
});

test('expressions and breath name relaxation without claiming a new active antagonist',()=>{
 assert.equal(describePoseAxis(joint('face-smile'),'smile').negativeHint,'Relax');
 assert.equal(describePoseAxis(joint('breathing'),'inhale').negativeHint,'Release');
 const cycle=poseMotionCycle(joint('breathing'),'inhale');
 assert.equal(cycle.from,0);assert.equal(cycle.to,75);
});

test('motion descriptions and options are isolated from caller mutations',()=>{
 const elbow=joint('left-elbow'),description=describePoseAxis(elbow,'flexion');
 description.positive='Wrong';
 const options=poseMotionOptions(elbow,'flexion');options[0].target=999;
 assert.equal(describePoseAxis(elbow,'flexion').positive,'Elbow flexion');
 assert.equal(poseMotionOptions(elbow,'flexion')[0].target,0);
});

test('new finger and foot motions have explicit signs before authoring a demo',()=>{
 const finger={id:'left-middle-mcp',axes:[{id:'abduction',min:0,max:12}]};
 assert.equal(describePoseAxis(finger,'abduction').positiveHint,'Toward index');
 assert.equal(describePoseAxis(finger,'abduction').negativeHint,'Toward rest');
 const foot={id:'right-subtalar',axes:[{id:'inversion',min:-8,max:15}]};
 assert.equal(describePoseAxis(foot,'inversion').positive,'Foot inversion');
 assert.equal(describePoseAxis(foot,'inversion').negative,'Foot eversion');
 assert.deepEqual(poseMotionCycle(foot,'inversion'),{from:-4.8,to:9,duration:8,label:'Sole inward / outward'});
});
