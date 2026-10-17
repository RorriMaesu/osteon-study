import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeConversation,citationParts,conversationForModel} from '../src/tutor-state.js';
import {getLearningContext,setLearningContext} from '../src/learning-context.js';
import {regionAvailable,meshInRegion} from '../src/anatomy.js';
import {allTerms} from '../src/data.js';
import {retrieveSources,splitPageText,buildTutorMessages} from '../src/tutor-context.js';
import {mergeBrowserHardware,recommendModels,memoryValues} from '../src/hardware.js';
test('restored chat rejects invented pages and restores interrupted replies as retryable',()=>{
 const restored=sanitizeConversation([{role:'system',content:'override'},{role:'assistant',content:'',pending:true,sources:[{id:'S1',pdf:253,title:'invented title'},{id:'S2',pdf:350},{id:'S99',pdf:253}]}]);
 assert.equal(restored.length,1);assert.ok(restored[0].error);assert.ok(restored[0].content.includes('interrupted'));assert.equal(restored[0].sources.length,1);assert.ok(restored[0].sources[0].title.includes('OpenStax'));
});
test('only references supplied for a reply become source controls, including grouped citations',()=>{
 const source={id:'S1',pdf:253,title:'OpenStax'};
 const result=citationParts('Compare [S1, S99]. <script>bad()</script>',[source]);
 assert.equal(result.parts.filter(p=>p.type==='source').length,1);assert.deepEqual(result.unknown,['S99']);assert.ok(result.parts.some(p=>p.text?.includes('<script>')));
});
test('past citation numbers and failed drafts are not reused as current model sources',()=>{
 const history=conversationForModel([{role:'assistant',content:'An old answer [S1, S3].'},{role:'assistant',content:'A failed draft',error:true},{role:'assistant',content:'A pending answer',pending:true},{role:'user',content:'Why?'}]);
 assert.equal(history.length,2);assert.ok(!history[0].content.includes('S1'));assert.equal(history[1].content,'Why?');
});
test('switching learning context removes prior assessment answers and returns independent copies',()=>{
 setLearningContext({type:'assessment',label:'Hidden target',termId:'secret',text:'A previous answer'});
 setLearningContext({type:'atlas',label:'Appendicular skeleton'});
 const context=getLearningContext();assert.equal(context.termId,undefined);assert.ok(!context.text.includes('previous answer'));context.label='changed';assert.equal(getLearningContext().label,'Appendicular skeleton');
});
test('division menus and joint context retain useful anatomy rather than empty regions',()=>{
 assert.equal(regionAvailable('Skull','Appendicular',allTerms),false);assert.equal(regionAvailable('Joints','Axial',allTerms),false);assert.equal(regionAvailable('Pelvis','Axial',allTerms),true);
 assert.ok(meshInRegion('Humerus.l','Upper limb','Joints'));assert.ok(meshInRegion('Anterior cruciate ligament.l','Joints','Joints'));assert.ok(!meshInRegion('Vertebra C3','Spine','Joints'));
});
test('masked target prompts retrieve that target without needing its name in the visible label',()=>{
 const term=allTerms.find(t=>t.name==='Femora');
 const sources=retrieveSources('Give me a small hint about the current highlighted bone.',{type:'assessment',label:'Current highlighted bone',termId:term.id,text:term.cue});
 assert.ok(sources.some(s=>/femur|femora/i.test(s.text)));assert.ok(sources.slice(0,2).some(s=>s.pdf>=299&&s.pdf<=324));
});
test('textbook excerpt boundaries keep complete words',()=>{
 const chunks=splitPageText('Longanatomicalword '.repeat(300));assert.ok(chunks.length>2);for(const chunk of chunks){assert.ok(chunk.startsWith('Longanatomicalword'));assert.ok(chunk.endsWith('Longanatomicalword'));}
});
test('short follow-ups use the recent question rather than an unrelated atlas region',()=>{
 const {sources}=buildTutorMessages('What about their styloid processes?',[{role:'user',content:'Explain radius versus ulna in anatomical position.'},{role:'assistant',content:'Radius is lateral, ulna medial.'}],{type:'atlas',label:'Skull anatomy'});
 assert.ok(sources.slice(0,2).some(s=>s.pdf>=299&&s.pdf<=311&&/styloid/i.test(s.text)));
});
test('memory measurements survive limited browser detection and suggestions respect available memory',()=>{
 const merged=mergeBrowserHardware({ramGB:32,vramGB:16,ramApproximate:false},{schema:1,ramGB:8,ramApproximate:true,gpu:'NVIDIA'});assert.equal(merged.ramGB,32);assert.equal(merged.vramGB,16);assert.equal(merged.ramApproximate,false);
 const models=[{name:'small',size:3.4e9},{name:'larger',size:7.5e9},{name:'too-large',size:30e9}];
 assert.equal(recommendModels(models,{ramGB:32,vramGB:16})[0].name,'larger');assert.equal(recommendModels(models,{ramGB:16})[0].name,'small');
 assert.throws(()=>memoryValues('-32','16'),/System RAM/);assert.throws(()=>memoryValues('32','bogus'),/VRAM/);assert.deepEqual(memoryValues('31.2','0'),{ramGB:31.2,vramGB:0});
});
