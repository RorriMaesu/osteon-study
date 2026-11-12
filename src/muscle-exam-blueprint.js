export const MUSCLE_EXAM_BLUEPRINT_VERSION='10-11-v1';
export const muscleExamBlueprint=[{kind:'choice',count:15,points:1},{kind:'visual',count:6,points:2},{kind:'structured',count:4,points:2},{kind:'text',count:3,points:3},{kind:'written',count:2,points:3}];
export const muscleExamSectionCounts={10:[2,4,6,5,3,2,3,3,2],11:[5,2,6,5,6,6]};
export const isMuscleCombinedScope=scope=>['muscles1011','muscles1011-b'].includes(scope);
export const muscleExamKind=q=>q.type==='written'?'written':q.figure?'visual':['match','order'].includes(q.type)?'structured':q.type==='text'?'text':q.type==='choice'?'choice':'other';
export const muscleQuestionPoints=q=>muscleExamBlueprint.find(k=>k.kind===muscleExamKind(q))?.points||1;
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
// Fixed forms make the blueprint reviewable. Form B prefers different rows;
// shared foundational concepts are legitimate, not presented as a new test bank.
export function selectMuscleExam(scope,bank){
 const form=scope==='muscles1011-b'?'B':'A',selected=[];
 for(const chapter of [10,11]){
  const all=bank.filter(q=>Number(q.lesson.split('.')[0])===chapter),chosen=[],sections=[...new Set(all.map(q=>q.lesson))];
  for(const group of [...muscleExamBlueprint].sort((a,b)=>['visual','written','structured','text','choice'].indexOf(a.kind)-['visual','written','structured','text','choice'].indexOf(b.kind))){
   const pool=all.filter(q=>muscleExamKind(q)===group.kind&&(!q.examForm||q.examForm===form));
   const usedVisuals=new Set();
   for(let i=0;i<group.count;i++){
    const coverage=new Map(sections.map(s=>[s,chosen.filter(q=>q.lesson===s).length]));
    const quota=q=>muscleExamSectionCounts[chapter][Number(q.lesson.split('.')[1])-1];
    const options=pool.filter(q=>!chosen.includes(q)&&coverage.get(q.lesson)<quota(q)&&(!q.visualGroup||!usedVisuals.has(q.visualGroup))).sort((a,b)=>
     (group.kind==='visual'?(Number(!a.examForm)-Number(!b.examForm)):0)||coverage.get(a.lesson)/quota(a)-coverage.get(b.lesson)/quota(b)||hash(form+a.id)-hash(form+b.id));
    if(!options.length)throw Error(`Chapter ${chapter} needs more ${group.kind} questions for its exam blueprint.`);
    const next=options[0];chosen.push(next);if(next.visualGroup)usedVisuals.add(next.visualGroup);
   }
  }
  if(sections.some(s=>!chosen.some(q=>q.lesson===s)))throw Error('The muscle exam must sample every chapter section.');
  selected.push(...chosen);
 }
 return selected.sort((a,b)=>hash(form+'order'+a.id)-hash(form+'order'+b.id));
}
export function validMuscleBlueprint(items){return items.length===60&&[10,11].every(chapter=>{
 const rows=items.filter(q=>Number(q.lesson.split('.')[0])===chapter);
 return rows.length===30&&muscleExamBlueprint.every(group=>rows.filter(q=>muscleExamKind(q)===group.kind).length===group.count)&&muscleExamSectionCounts[chapter].every((count,index)=>rows.filter(q=>q.lesson===chapter+'.'+(index+1)).length===count);
});}
