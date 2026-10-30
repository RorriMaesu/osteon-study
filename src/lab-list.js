import source from './lab-list-source.json' with {type:'json'};
import {terms} from './data.js';
import './representations.js';
import {validAnswerReview} from './answer-review-data.js';

export {source as labListSource};
export const labScopes=[['all','Entire document'],['lab6','Lab 6 · axial'],['lab7','Lab 7 · bone test'],['shoulder','Shoulder · muscle test']];
const shoulderIds=new Set(source.rows.filter(r=>r.section.startsWith('Shoulder')).flatMap(r=>r.termIds));
const byId=new Map(terms.map(t=>[t.id,t]));
const rowInScope=(r,scope)=>scope==='all'||scope==='lab6'&&r.lab==='Lab 6'||scope==='lab7'&&r.lab==='Lab 7'&&!r.section.startsWith('Shoulder')||scope==='shoulder'&&r.section.startsWith('Shoulder');

export function listEntries(scope='all'){
 const rows=source.rows.filter(r=>rowInScope(r,scope)),ids=[...new Set(rows.flatMap(r=>r.termIds))];
 return ids.map(id=>({term:byId.get(id),rows:source.rows.filter(r=>r.termIds.includes(id))}));
}
export function entryStatus(t){
 if(t.representation.assessment==='learn-only'||t.representation.kind==='reference')return 'Source recall · 3D hold';
 if(t.representation.kind==='concept')return 'Movement reasoning';
 return t.representation.kind==='mesh'?'Whole 3D structure':'3D reference label';
}
const countRows=[
 ['cervical','Cervical vertebrae','7','seven','How many cervical vertebrae are there?','There are seven cervical vertebrae, including the atlas and axis.'],
 ['thoracic','Thoracic vertebrae','12','twelve','How many thoracic vertebrae are there?','There are twelve thoracic vertebrae.'],
 ['lumbar','Lumbar vertebrae','5','five','How many lumbar vertebrae are there?','There are five lumbar vertebrae.'],
 ['sacral','Sacral vertebrae','5','five','How many sacral vertebrae fuse to form the usual adult sacrum?','Five sacral vertebrae fuse into one adult sacrum.'],
 ['coccygeal','Coccygeal vertebrae','4','four','What is the usual number of coccygeal vertebrae? Give the typical count.','Usually four; three to five is a normal range. This question asks for the typical count, not the range.']
];
export const countQuestions=countRows.map(([key,label,n,word,prompt,cue])=>({id:'lab-count-'+key,name:n+' '+label.toLowerCase(),testLabel:label+' · count',region:'Spine',type:'count',exact:false,aliases:[n,word,n+' vertebrae',word+' vertebrae',word+' '+label.toLowerCase()],cue,source:'BI 231 count blank · OpenStax 7.3',listRecall:{kind:'Count recall',prompt},representation:{kind:'list-recall',reference:'7.3'}}));
const recalls={
 'fontanelles':{prompt:'What are the fibrous gaps between incompletely ossified newborn skull bones called?',note:'Source recall. The withdrawn newborn model is not used for spatial grading. Compare the labeled newborn textbook illustration after answering.'},
 'ethmoidal-air-cells-and-sinus-openings':{prompt:'Name the grouped ethmoid structures on your list that form small paranasal air spaces and their drainage openings into the nasal cavity.',note:'Source recall. The adult 3D reference locates the air-cell region; individual drainage openings remain unverified.'}
};
export function listQuestions(scope='all'){
 const items=listEntries(scope).map(({term:t})=>recalls[t.id]?{...t,listRecall:{kind:'Source recall',...recalls[t.id]},representation:{kind:'list-recall',reference:t.representation.reference},aliases:[...t.aliases,...(t.id==='ethmoidal-air-cells-and-sinus-openings'?['ethmoid sinuses and their openings','ethmoidal sinuses and openings','sinus openings to sinuses']:[])]}:t);
 return [...items,...(scope==='all'||scope==='lab6'?countQuestions:[])];
}
export function listStats(scope='all'){
 const entries=listEntries(scope),questions=listQuestions(scope);
 return {entries:entries.length,questions:questions.length,spatial:entries.filter(({term:t})=>!recalls[t.id]&&t.representation.kind!=='concept').length,sourceRecall:entries.filter(({term:t})=>recalls[t.id]).length,movement:entries.filter(({term:t})=>t.representation.kind==='concept').length,counts:questions.filter(t=>t.type==='count').length,shoulder:entries.filter(({term:t})=>shoulderIds.has(t.id)).length};
}
export const listQuestionById=new Map(listQuestions().map(t=>[t.id,t]));
export const LAB_TEST_KEY='osteon-bone-list-test-v1';
export function validLabRun(run){
 if(!run||run.schema!==1||run.source!==source.source.sha256||!labScopes.some(([s])=>s===run.scope)||!Number.isFinite(run.startedAt)||typeof run.assisted!=='boolean'||(run.draft!==undefined&&(typeof run.draft!=='string'||run.draft.length>500)))return false;
 if(!Array.isArray(run.questionIds)||!run.questionIds.length||run.questionIds.length>182||new Set(run.questionIds).size!==run.questionIds.length)return false;
 const allowed=new Set(listQuestions(run.scope).map(t=>t.id));if(run.questionIds.some(id=>!allowed.has(id)))return false;
 if(!Array.isArray(run.results)||run.results.length>run.questionIds.length)return false;
 return run.results.every((r,i)=>r&&r.id===run.questionIds[i]&&typeof r.correct==='boolean'&&typeof r.assisted==='boolean'&&typeof r.response==='string'&&r.response.length<=500&&Number.isFinite(r.at)&&(r.review===undefined||validAnswerReview(r.review)));
}
export function makeLabRun(scope,questionIds,now=Date.now()){
 const run={schema:1,source:source.source.sha256,scope,questionIds:[...questionIds],startedAt:now,assisted:false,results:[]};
 if(!validLabRun(run))throw new Error('This bone-list selection is invalid.');return run;
}
export function labRunSummary(run){
 const independent=run.results.filter(r=>r.correct&&!r.assisted).length;
 return {answered:run.results.length,total:run.questionIds.length,independent,assisted:run.results.filter(r=>r.assisted).length,review:run.results.filter(r=>!r.correct||r.assisted).map(r=>r.id),complete:run.results.length===run.questionIds.length};
}
