import fs from 'node:fs';
import {syllabus,selectExam} from '../src/exam-core.js';
import {examBank} from '../src/exam-bank.js';
import {lessons,questions,glossary} from '../src/learning-data.js';
import pages from '../src/reader-pages.json' with {type:'json'};
const root=new URL('../',import.meta.url),rows=[['Objective','Source learning objective','Section','Printed source pages','Chapter exam items in section','Questions explicitly testing objective','Formats']];
for(const s of syllabus.sections){if(!lessons.some(l=>l.id===s.id))throw new Error('Missing lesson '+s.id);for(const o of s.objectives){const qs=examBank.filter(q=>q.objectives.includes(o.id));if(qs.length<2)throw new Error('Insufficient objective coverage '+o.id);rows.push([o.id,o.text,s.id,`${s.pdfStart-16}-${s.pdfEnd-16}`,s.examWeight,qs.map(q=>q.id).join('; '),[...new Set(qs.map(q=>q.type))].join('; ')]);}}
for(let n=213;n<=384;n++)if(!pages.some(p=>p.pdf===n)||!fs.existsSync(new URL(`assets/reader/p${n}.jpg`,root)))throw new Error('Missing source page '+n);
for(const c of ['6','7','8','9','all']){const form=selectExam(c);if(form.length!==(c==='all'?100:50))throw new Error('Wrong exam length '+c);}
const cell=x=>'"'+String(x).replaceAll('"','""')+'"';fs.writeFileSync(new URL('CURRICULUM-COVERAGE.csv',root),'\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\n')+'\n');
const summary={chapters:4,sections:lessons.length,sourceObjectives:rows.length-1,examBank:examBank.length,supplementaryQuestions:questions.length-examBank.length,glossaryTerms:glossary.length,completeChapterPages:pages.filter(p=>[6,7,8,9].includes(p.chapter)).length,supplementalReadingPages:pages.filter(p=>![6,7,8,9].includes(p.chapter)).length,chapterExamLength:50,cumulativeExamLength:100};
fs.writeFileSync(new URL('curriculum-summary.json',root),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
