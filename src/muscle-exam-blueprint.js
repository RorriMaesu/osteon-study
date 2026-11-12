import {syllabus} from './course-catalog.js';
export const MUSCLE_EXAM_BLUEPRINT_VERSION='10-11-v3';
export const muscleExamBlueprintVersions=['10-11-v1','10-11-v2',MUSCLE_EXAM_BLUEPRINT_VERSION];
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
  const all=bank.filter(q=>!q.id.startsWith('ma-')&&!q.id.startsWith('mc11-')&&Number(q.lesson.split('.')[0])===chapter&&(includeAxial||!q.revisedAxial)),chosen=[],sections=[...new Set(all.map(q=>q.lesson))];
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
export function muscleExamCoverage(items){const sampled=objectivesOf(items),all=muscleExamObjectives();return {total:all.length,sampled:all.filter(o=>sampled.has(o.id)),notSampled:all.filter(o=>!sampled.has(o.id)),facets:[...new Set(items.flatMap(q=>q.assessmentFacets||[]))].sort()};}
// Explicit reviewed forms prevent a tag-optimization algorithm from substituting
// a name question for a required mechanism. IDs preserve earlier saved sessions.
export const muscleFormIds={
 A:[
 'mx-a-tissue','ex-10.1-8',
 'mx-a-wrap','mx-a-band','ex-10.2-22','ma-force-path',
 'ex-10.3-3','ex-10.3-21','ex-10.3-5','ex-10.3-1','ex-10.3-13','mx-written-calcium',
 'ma-phases-a','mx-a-unfused','ma-length-a','ex-10.4-2','mx-written-recruitment',
 'ex-10.5-1','ex-10.5-5','ex-10.5-6',
 'ex-10.6-4','ex-10.6-3',
 'ex-10.7-4','ma-cardiac-duration','ex-10.7-6',
 'ma-dense-anchor','ex-10.8-3','ex-10.8-10',
 'ex-10.9-2','ex-10.9-5',
 'ma-fascicle-excursion','ex-11.1-5','ma-moment-arm','ex-11.1-7','ex-11.1-4',
 'ex-11.2-1','ex-11.2-8',
 'mx-axial-masseter','ex-11.3-2','ma-tongue-position','ex-11.3-14','ex-11.3-6','ex-11.3-17',
 'mx-axial-internal-oblique','ex-11.4-7','ma-abdominal-rotation','ma-pelvic-support','ex-11.4-13',
 'mx-plate-infraspinatus','mx-plate-palmar-interossei','mx-written-scapula','ma-common-flexor','ex-11.5-10','ma-scapular-attachment',
 'mx-plate-rectus-femoris','mx-plate-flexor-digitorum-brevis','mx-written-knee','ex-11.6-3','ex-11.6-14','ma-short-head',
 ],
 B:[
 'mx-b-tissue','ma-stretch',
 'mx-b-wrap','mx-b-band','ma-depolarization','ma-force-links',
 'ex-10.3-4','ex-10.3-28','ex-10.3-18','ex-10.3-2','ex-10.3-23','mx-written-atp',
 'ma-phases-b','mx-b-fused','ma-length-b','ex-10.4-1','ma-length-explain',
 'ex-10.5-2','ex-10.5-5','ma-fast-oxidative',
 'ex-10.6-8','ma-exercise-adaptations',
 'ex-10.7-4','ex-10.7-7','ex-10.7-6',
 'ex-10.8-2','ex-10.8-4','ma-smooth-regulation',
 'ex-10.9-4','ma-repair-comparison',
 'ex-11.1-9','ex-11.1-1','ex-11.1-11','ex-11.1-12','ex-11.1-8',
 'ma-name-decode','ex-11.2-4',
 'mx-axial-superior-rectus','ex-11.3-4','ma-bilateral-neck','ex-11.3-16','ma-eye-position','ex-11.3-13',
 'mx-axial-pubococcygeus','mx-written-breathing','ma-diaphragms','ex-11.4-12','ex-11.4-1',
 'mx-plate-subscapularis','mx-plate-pronator-teres','mx-written-forearm','ex-11.5-5','ex-11.5-3','ex-11.5-9',
 'mx-plate-biceps-femoris','mx-plate-soleus','ex-11.6-9','ma-hip-attachment','ex-11.6-20','ex-11.6-23',
 ]
};
export function selectMuscleForms(bank){const byId=new Map(bank.map(q=>[q.id,q]));return ['A','B'].map(form=>{const rows=muscleFormIds[form].map(id=>{if(!byId.has(id))throw Error('Missing reviewed exam question: '+id);return byId.get(id);});if(!validMuscleBlueprint(rows))throw Error('The reviewed muscle form does not satisfy its format/section blueprint.');return rows.sort((a,b)=>hash(form+'order'+a.id)-hash(form+'order'+b.id));});}
export function selectMuscleExam(scope,bank){return selectMuscleForms(bank)[scope==='muscles1011-b'?1:0];}
export function validMuscleBlueprint(items){return items.length===60&&[10,11].every(chapter=>{
 const rows=items.filter(q=>Number(q.lesson.split('.')[0])===chapter);
 return rows.length===30&&muscleExamBlueprint.every(group=>rows.filter(q=>muscleExamKind(q)===group.kind).length===group.count)&&muscleExamSectionCounts[chapter].every((count,index)=>rows.filter(q=>q.lesson===chapter+'.'+(index+1)).length===count);
});}
