import {syllabus} from './course-catalog.js';
export const MUSCLE_EXAM_BLUEPRINT_VERSION='10-11-v2';
export const muscleExamBlueprintVersions=['10-11-v1',MUSCLE_EXAM_BLUEPRINT_VERSION];
export const muscleExamBlueprint=[{kind:'choice',count:15,points:1},{kind:'visual',count:6,points:2},{kind:'structured',count:4,points:2},{kind:'text',count:3,points:3},{kind:'written',count:2,points:3}];
export const muscleExamSectionCounts={10:[2,4,6,5,3,2,3,3,2],11:[5,2,6,5,6,6]};
export const isMuscleCombinedScope=scope=>['muscles1011','muscles1011-b'].includes(scope);
export const muscleExamKind=q=>q.type==='written'?'written':q.figure?'visual':['match','order'].includes(q.type)?'structured':q.type==='text'?'text':q.type==='choice'?'choice':'other';
export const muscleQuestionPoints=q=>muscleExamBlueprint.find(k=>k.kind===muscleExamKind(q))?.points||1;
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
// Fixed forms make the blueprint reviewable. Form B prefers different rows;
// shared foundational concepts are legitimate, not presented as a new test bank.
function baseMuscleForm(scope,bank,includeAxial){
 const form=scope==='muscles1011-b'?'B':'A',selected=[];
 for(const chapter of [10,11]){
  const all=bank.filter(q=>Number(q.lesson.split('.')[0])===chapter&&(includeAxial||!q.revisedAxial)),chosen=[],sections=[...new Set(all.map(q=>q.lesson))];
  for(const group of [...muscleExamBlueprint].sort((a,b)=>['visual','written','structured','text','choice'].indexOf(a.kind)-['visual','written','structured','text','choice'].indexOf(b.kind))){
   const pool=all.filter(q=>muscleExamKind(q)===group.kind&&(!q.examForm||q.examForm===form));
   const usedVisuals=new Set();
   for(let i=0;i<group.count;i++){
    const coverage=new Map(sections.map(s=>[s,chosen.filter(q=>q.lesson===s).length]));
    const quota=q=>muscleExamSectionCounts[chapter][Number(q.lesson.split('.')[1])-1];
    const options=pool.filter(q=>!chosen.includes(q)&&coverage.get(q.lesson)<quota(q)&&(!q.visualGroup||!usedVisuals.has(q.visualGroup))).sort((a,b)=>
     (group.kind==='visual'?(Number(!!b.revisedAxial)-Number(!!a.revisedAxial)||Number(!a.examForm)-Number(!b.examForm)):0)||coverage.get(a.lesson)/quota(a)-coverage.get(b.lesson)/quota(b)||hash(form+a.id)-hash(form+b.id));
    if(!options.length)throw Error(`Chapter ${chapter} needs more ${group.kind} questions for its exam blueprint.`);
    const next=options[0];chosen.push(next);if(next.visualGroup)usedVisuals.add(next.visualGroup);
   }
  }
  if(sections.some(s=>!chosen.some(q=>q.lesson===s)))throw Error('The muscle exam must sample every chapter section.');
  selected.push(...chosen);
 }
 return selected.sort((a,b)=>hash(form+'order'+a.id)-hash(form+'order'+b.id));
}
export const selectLegacyMuscleExam=(scope,bank)=>baseMuscleForm(scope,bank,false);
const objectivesOf=items=>new Set(items.flatMap(q=>q.objectives||[]));
export const muscleExamObjectives=()=>syllabus.sections.filter(s=>[10,11].includes(s.chapter)).flatMap(s=>s.objectives);
export function muscleExamCoverage(items){const sampled=objectivesOf(items),all=muscleExamObjectives();return {total:all.length,sampled:all.filter(o=>sampled.has(o.id)),notSampled:all.filter(o=>!sampled.has(o.id))};}
export function selectMuscleForms(bank){
 const forms=[baseMuscleForm('muscles1011',bank,true),baseMuscleForm('muscles1011-b',bank,true)],all=muscleExamObjectives();
 // A swap keeps the question format, section count and point total identical.
 // First close gaps across both forms, then improve each individual sample.
 for(const phase of ['pair','individual'])for(let pass=0;pass<100;pass++){
  const union=objectivesOf(forms.flat()),individual=forms.map(objectivesOf),choices=[];
  forms.forEach((form,index)=>form.forEach((old,position)=>{
   if(['visual','written'].includes(muscleExamKind(old)))return;
   const otherIds=new Set(forms[1-index].map(q=>q.id));
   for(const replacement of bank){
    if(replacement.lesson!==old.lesson||muscleExamKind(replacement)!==muscleExamKind(old)||form.some(q=>q.id===replacement.id)||replacement.examForm&&replacement.examForm!==['A','B'][index])continue;
    const changed=form.map((q,i)=>i===position?replacement:q),next=objectivesOf(changed),nextUnion=objectivesOf([...changed,...forms[1-index]]);
    const unionGain=nextUnion.size-union.size,ownGain=next.size-individual[index].size;
    if(phase==='pair'?unionGain<=0:ownGain<=0||unionGain<0)continue;
    choices.push({index,position,replacement,unionGain,ownGain,duplicate:Number(otherIds.has(replacement.id)),tie:hash(phase+index+replacement.id+old.id)});
   }
  }));
  choices.sort((a,b)=>b.unionGain-a.unionGain||b.ownGain-a.ownGain||a.duplicate-b.duplicate||a.tie-b.tie);
  if(!choices.length)break;const best=choices[0];forms[best.index][best.position]=best.replacement;
 }
 const covered=objectivesOf(forms.flat());if(all.some(o=>!covered.has(o.id)))throw Error('The two muscle exam forms must cover all 47 source objectives together.');
 return forms;
}
export function selectMuscleExam(scope,bank){return selectMuscleForms(bank)[scope==='muscles1011-b'?1:0];}
export function validMuscleBlueprint(items){return items.length===60&&[10,11].every(chapter=>{
 const rows=items.filter(q=>Number(q.lesson.split('.')[0])===chapter);
 return rows.length===30&&muscleExamBlueprint.every(group=>rows.filter(q=>muscleExamKind(q)===group.kind).length===group.count)&&muscleExamSectionCounts[chapter].every((count,index)=>rows.filter(q=>q.lesson===chapter+'.'+(index+1)).length===count);
});}
