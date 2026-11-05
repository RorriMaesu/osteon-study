import fs from 'node:fs';
import {syllabus,selectExam} from '../src/exam-core.js';
import {examBank} from '../src/exam-bank.js';
import {lessons,questions,glossary} from '../src/learning-data.js';
import laterPages from '../src/reader-pages.json' with {type:'json'};
import earlierPages from '../src/foundations-reader.json' with {type:'json'};
const pages=[...earlierPages,...laterPages];
const root=new URL('../',import.meta.url),rows=[['Objective','Source learning objective','Section','Printed source pages','Chapter exam items in section','Questions explicitly testing objective','Formats']];
for(const s of syllabus.sections){if(!lessons.some(l=>l.id===s.id))throw new Error('Missing lesson '+s.id);for(const o of s.objectives){const qs=examBank.filter(q=>q.objectives.includes(o.id));if(qs.length<2)throw new Error('Insufficient objective coverage '+o.id);rows.push([o.id,o.text,s.id,`${s.pdfStart-16}-${s.pdfEnd-16}`,s.examWeight,qs.map(q=>q.id).join('; '),[...new Set(qs.map(q=>q.type))].join('; ')]);}}
for(let n=23;n<=424;n++)if(!pages.some(p=>p.pdf===n)||!fs.existsSync(new URL(`assets/reader/p${n}.jpg`,root)))throw new Error('Missing source page '+n);
const examLengths={...Object.fromEntries(syllabus.chapters.map(c=>[c.id,50])),foundations12:50,foundations35:90,all:100,all10:150,course1to10:300};
for(const [scope,length] of Object.entries(examLengths))if(selectExam(scope).length!==length)throw new Error('Wrong exam length '+scope);
const cell=x=>'"'+String(x).replaceAll('"','""')+'"';fs.writeFileSync(new URL('CURRICULUM-COVERAGE.csv',root),'\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\n')+'\n');
const summary={chapters:syllabus.chapters.length,sections:lessons.length,sourceObjectives:rows.length-1,examBank:examBank.length,supplementaryQuestions:questions.length-examBank.length,glossaryTerms:glossary.length,completeChapterPages:pages.filter(p=>p.chapter>=1&&p.chapter<=10).length,supplementalReadingPages:pages.filter(p=>p.chapter>10).length,chapterExamLength:50,cumulativeExamLength:100,comprehensiveExamLength:300,examLengths};
fs.writeFileSync(new URL('curriculum-summary.json',root),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
