import test from 'node:test';
import assert from 'node:assert/strict';
import {examBank,LEGACY_EXAM_VERSION} from '../src/exam-bank.js';
import {answerPolicies} from '../src/exam-answer-policies.js';
import {assessTyped,outcomeCorrect,editDistance,fold,acceptedForms} from '../src/typed-answer.js';
import {assessQuestion,createSession,validSession,results,answeredCount,sessionOutcome} from '../src/exam-core.js';
import {interpretReview} from '../src/answer-judge.js';
import {resultExport} from '../src/exam-report.js';
import {spellingDiff,validSpellingState,spellingId} from '../src/spelling-data.js';
import {addSpellingNote,practiceSpelling,getProgress,resetProgress,recordAttempt,validProgress} from '../src/storage.js';
const byId=id=>examBank.find(q=>q.id==='ex-'+id),typed=examBank.filter(q=>['text','identify'].includes(q.type));
test('typed questions retain explicit policies, source forms, and distinct neighboring anatomy keys',()=>{
 assert.equal(typed.filter(q=>Number(q.lesson.split('.')[0])>=6&&Number(q.lesson.split('.')[0])<=10&&!q.id.startsWith('fracture-')&&!q.id.startsWith('mx-')&&!q.id.startsWith('ma-')).length,157);assert.deepEqual(new Set(Object.keys(answerPolicies)),new Set(typed.filter(q=>!q.answerPolicy).map(q=>q.id)));
 for(const q of typed){for(const a of [q.answer,...(q.aliases||[])])assert.ok(outcomeCorrect(assessTyped(q,a)),q.id+': '+a);const allowed=acceptedForms(q).map(fold),rival=typed.filter(x=>!allowed.includes(fold(x.answer))).sort((a,b)=>editDistance(fold(q.answer),fold(a.answer))-editDistance(fold(q.answer),fold(b.answer)))[0];assert.ok(!outcomeCorrect(assessTyped(q,rival.answer)),q.id+': '+rival.answer);}
});
test('clear omissions, extra letters and transpositions receive credit without a local model',()=>{
 for(const [id,input]of [['8.4-2','femurr'],['8.4-2','fmeur'],['6.3-2','diaphsis'],['9.4-3','synovial fliud'],['7.2-17','foramen ovlae'],['8.4-5','sevn'],['8.2-7','fourten']]){const o=assessTyped(byId(id),input);assert.equal(o.status,'spelling',input);assert.equal(assessQuestion(byId(id),input).strictCorrect,false);}
});
test('natural counts, harmless wording, British spelling and appropriate word forms are accepted distinctly from errors',()=>{
 for(const [id,input]of [['8.4-2','femur bone'],['8.4-2','right femur'],['8.4-5','there are seven bones in one foot'],['8.4-2','thighbone'],['8.4-5','seven tarsal bones'],['8.2-7','14 phalanges'],['6.3-2','diaphyses'],['6.1-5','Haematopoiesis'],['8.3-7','pubis, ilium and ischium']])assert.equal(assessTyped(byId(id),input).status,'equivalent',input);
});
test('formal-name prompts cannot be answered by repeating their description, including after AI approval',()=>{
 for(const [id,input]of [['8.4-7','great toe'],['8.2-15','thumb'],['6.3-2','shaft'],['8.4-7','the big toe on the foot']]){const q=byId(id),review=fixture(q,input,'equivalent');assert.equal(assessQuestion(q,input,review).correct,false,input);assert.equal(assessTyped(q,input).status,'incorrect');}
});
test('nearby real terms, sides, vitamins, counts and units are never automatic spelling corrections',()=>{
 for(const [q,input]of [[{id:'ilium',answer:'Ilium'},'ileum'],[{id:'cell',answer:'Osteoblast'},'osteoclast'],[byId('6.6-4'),'Vitamin D'],[byId('9.5-3'),'eversion'],[byId('8.4-2'),'left femur'],[byId('8.4-2'),'right or left femur'],[byId('8.4-5'),'6'],[byId('8.4-5'),'seven pairs'],[byId('8.4-5'),'sevn carpals'],[byId('8.2-7'),'14 or 15']])assert.equal(assessTyped(q,input).status,'incorrect',input);
});
test('sets require all distinct structures and tolerate a clear typo without accepting duplicates or an extra bone',()=>{
 const q=byId('8.3-7');assert.equal(assessTyped(q,'ilium, ischum and pubis').status,'spelling');for(const input of ['ilium, ilium and pubis','ilium and pubis','ilium, ischium, pubis and femur'])assert.ok(!outcomeCorrect(assessTyped(q,input)),input);
});
function fixture(q,response,verdict='equivalent',status='reviewed'){return{schema:1,target:q.id,answer:q.answer,response,strictCorrect:false,allowOverride:true,at:1,status,verdict,confidence:'high',model:'fixture:local',correctedAnswer:q.answer,explanation:'A controlled review fixture, not an actual model generation.',reference:q.lesson||''};}
test('unresolved meaning remains pending when AI is off, unavailable, unsure or bound to another response',()=>{
 const q=byId('8.4-2'),response='the long bone of my thigh';for(const review of [undefined,fixture(q,response,'uncertain','unavailable'),fixture(q,response,'uncertain','uncertain'),fixture(q,'different response')])assert.equal(assessQuestion(q,response,review).status,'pending');
 const accepted=assessQuestion(q,response,fixture(q,response));assert.equal(accepted.status,'equivalent');assert.ok(accepted.correct);assert.equal(assessQuestion(q,response,fixture(q,response,'incorrect')).status,'incorrect');assert.equal(assessQuestion(q,'tibia',fixture(q,'tibia')).correct,false);
});
test('the AI response validator applies the same formal-name and confusion rules',()=>{
 const q=byId('8.4-7'),review=interpretReview({verdict:'equivalent',confidence:'high',correctedAnswer:q.answer,explanation:'Fixture only.'},{target:q,response:'great toe',strictCorrect:false,allowOverride:true,model:'fixture'});assert.equal(review.correct,false);assert.equal(review.review.status,'guarded');
});
test('results and exports distinguish pending from wrong and retain the first submitted assessment',()=>{
 const qs=[byId('8.4-2'),byId('8.4-5'),byId('8.2-4')],s=createSession(qs);s.responses={[qs[0].id]:'fmeur',[qs[1].id]:'7',[qs[2].id]:'inside bone of my forearm'};const r=results(s);assert.equal(r.correct,2);assert.equal(r.spelling,1);assert.equal(r.pending,1);assert.equal(r.maxCorrect,3);s.status='submitted';s.submitted=10;s.initialOutcomes=Object.fromEntries(r.rows.map(x=>[x.q.id,x.outcome]));const before=JSON.stringify(s.initialOutcomes);s.aiReviews={[qs[2].id]:fixture(qs[2],s.responses[qs[2].id])};assert.equal(results(s).correct,3);assert.equal(JSON.stringify(s.initialOutcomes),before);assert.ok(validSession(JSON.parse(JSON.stringify(s))));const out=resultExport({...s,aiReviews:{}},'Test',examBank);assert.equal(out.answers[2].correct,null);assert.equal(out.summary.pending,1);
});
test('clearing a typed draft or leaving a matching task partial never inflates the answered count',()=>{
 const q=byId('8.4-2'),m=examBank.find(q=>q.type==='match'),s=createSession([q,m]);s.responses[q.id]='';s.responses[m.id]={[m.pairs[0].left]:m.pairs[0].right};assert.equal(answeredCount(s),0);s.responses[q.id]='fmeur';assert.equal(answeredCount(s),1);s.responses[q.id]='';assert.equal(answeredCount(s),0);
});
test('the identical-key earlier release keeps its original scores and rejects unrecognized versions',()=>{
 const q=byId('8.4-2'),old=createSession([q]);old.version=LEGACY_EXAM_VERSION;delete old.gradingVersion;old.responses[q.id]='femurr';assert.ok(validSession(old));assert.equal(results(old).correct,0);const fresh=createSession([q]);fresh.responses[q.id]='femurr';assert.equal(results(fresh).correct,1);assert.ok(!validSession({...fresh,version:'unknown'}));
});
test('spelling review preserves original responses, stays separate from anatomy attempts, and round-trips through backups',()=>{
 globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.document=new EventTarget();resetProgress();addSpellingNote({term:'Femur',sourceId:'ex-8.4-2',reference:'8.4',response:'fmeur',attemptKey:'session:q',now:1});addSpellingNote({term:'Femur',sourceId:'ex-8.4-2',reference:'8.4',response:'fmeur',attemptKey:'session:q',now:2});const id=spellingId('Femur');assert.equal(getProgress().spellings[id].seenAttempts.length,1);practiceSpelling(id,'Femur',true,{now:10});const card=getProgress().spellings[id];assert.equal(card.originalResponse,'fmeur');assert.equal(card.attempts.length,1);assert.equal(card.due,86400010);assert.equal(getProgress().attempts.length,0);assert.ok(validSpellingState(getProgress().spellings));assert.ok(validProgress(JSON.parse(JSON.stringify(getProgress()))));const bad=structuredClone(getProgress());bad.spellings[id].attempts[0].correct='yes';assert.ok(!validProgress(bad));
});
test('spelling comparison highlights changed letters without dropping text',()=>{
 const diff=spellingDiff('fmeur','Femur');assert.equal(diff.before.map(x=>x.text).join(''),'fmeur');assert.equal(diff.after.map(x=>x.text).join(''),'Femur');assert.ok(diff.before.some(x=>x.changed));assert.ok(diff.after.some(x=>x.changed));
});

test('pending answers never enter anatomy accuracy or missed-card scheduling',()=>{
 globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.document=new EventTarget();resetProgress();assert.equal(recordAttempt({id:'ex-8.4-2',topic:'8.4',correct:false,mode:'chapter-exam',answerStatus:'pending',attemptKey:'pending:q'}),null);assert.equal(getProgress().attempts.length,0);assert.equal(Object.keys(getProgress().cards).length,0);assert.ok(validProgress(getProgress()));
});

test('shared local AI keeps semantic and count-typo review in other practice modes',()=>{
 for(const [target,response,verdict] of [[{id:'legacy-flexion',answer:'Flexion'},'bending','equivalent'],[{id:'legacy-count',type:'count',answer:'7',aliases:['seven']},'sevn','spelling']]){const result=interpretReview({verdict,confidence:'high',correctedAnswer:target.answer,explanation:'Controlled legacy integration fixture.'},{target,response,strictCorrect:false,allowOverride:true,model:'fixture'});assert.equal(result.correct,true,response);}
});
