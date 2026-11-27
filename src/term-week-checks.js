import {termExamWeeks} from './term-exam-weeks.js';

// Keep the question, evidence, scoring rubric and source together as one snapshot.
export function makeWeekCheck(course,week,form,scopes,makeForm){
  const plan=termExamWeeks[course];
  const row=plan?.find(w=>w.week===week);
  if(!row?.sections.length)throw new RangeError('No weekly check for this week.');
  const current=new Set(row.sections);
  const learned=new Set(plan.filter(w=>w.week<=week).flatMap(w=>w.sections));
  const chapters=new Set([...learned].map(s=>Number(s.split('.')[0])));
  const candidates=makeForm('week-'+week,form);
  const pool=candidates
    .filter(q=>current.has(q.section)&&(q.relatedSections||[]).every(s=>learned.has(s))
      &&(q.relatedChapters||[]).every(ch=>chapters.has(ch)));
  const selected=[],stems=new Set();
  function add(q){
    if(!q||stems.has(q.prompt))return;
    selected.push(q);
    stems.add(q.prompt);
  }
  for(const section of row.sections){
    const items=pool.filter(q=>q.section===section&&!stems.has(q.prompt));
    const item=items.find(q=>q.type==='choice')||items[0];
    if(!item)throw new Error('No question is available for §'+section+'.');
    add(item);
  }
  // Add one evidence station and one explanation/recall task where the week has them.
  const preferWriting=(week+'ABC'.indexOf(form))%2===0;
  for(const types of [['evidence'],preferWriting?['written','short']:['short','written']]){
    for(const type of types){
      const candidates=pool.filter(q=>q.type===type&&!stems.has(q.prompt));
      if(!candidates.length)continue;
      add(candidates.find(q=>!selected.some(x=>x.type!=='choice'&&x.section===q.section))||candidates[0]);
      break;
    }
  }
  return selected;
}

export function chapterBreakdown(rows){
  const chapters=new Map();
  for(const {item,grade} of rows){
    const ch=item.chapter||Number(item.section.split('.')[0]);
    if(!chapters.has(ch))chapters.set(ch,{chapter:ch,questions:0,earned:0,possible:0,pending:0});
    const line=chapters.get(ch);
    line.questions++;
    for(const key of ['earned','possible','pending'])line[key]+=grade[key];
  }
  return [...chapters.values()].sort((a,b)=>a.chapter-b.chapter);
}
