import fs from 'node:fs';
import {syllabus,selectExam} from '../src/exam-core.js';
import {examBank} from '../src/exam-bank.js';
import {interactiveSections,newVisualSections,diagramSourceKeys} from '../src/section-diagrams.js';
import {plates} from '../src/representations.js';
import {lessons,questions,glossary} from '../src/learning-data.js';
import {matchingReaderPages,sectionPages} from '../src/reader.js';
import {legacyChapterGroups} from '../src/course-catalog.js';
import {validMuscleBlueprint,muscleQuestionPoints} from '../src/muscle-exam-blueprint.js';
const pages=matchingReaderPages();
const root=new URL('../',import.meta.url),rows=[['Objective','Source learning objective','Section','Printed source pages','Chapter exam items in section','Questions explicitly testing objective','Formats']];
for(const s of syllabus.sections){if(!lessons.some(l=>l.id===s.id))throw new Error('Missing lesson '+s.id);if(!interactiveSections.has(s.id))throw new Error('Missing interactive visual '+s.id);for(const o of s.objectives){const qs=examBank.filter(q=>q.objectives.includes(o.id));if(qs.length<2)throw new Error('Insufficient objective coverage '+o.id);rows.push([o.id,o.text,s.id,`${s.pdfStart-16}-${s.pdfEnd-16}`,s.examWeight,qs.map(q=>q.id).join('; '),[...new Set(qs.map(q=>q.type))].join('; ')]);}}
if(new Set(pages.map(p=>p.pdf)).size!==pages.length)throw new Error('Duplicate source reader pages');
for(const chapter of syllabus.chapters)for(let n=chapter.pdfStart;n<=chapter.pdfEnd;n++)if(!pages.some(p=>p.pdf===n&&p.chapter===chapter.id)||!fs.existsSync(new URL(`assets/reader/p${n}.jpg`,root)))throw new Error('Missing source page '+n);
for(const section of syllabus.sections){const page=pages.find(p=>p.pdf===sectionPages[section.id]);if(!page||!page.text.includes(section.id))throw new Error('Missing section reader destination '+section.id);}
for(const key of diagramSourceKeys()){
 const plate=plates[key];
 if(!plate||!fs.existsSync(new URL(`assets/figures/${plate.image||key}.jpg`,root)))throw new Error('Missing diagram source '+key);
}
const examLengths={...Object.fromEntries(syllabus.chapters.map(c=>[c.id,c.examLength])),foundations12:50,foundations35:90,all:100,all10:150,course1to10:300,course1to11:330,muscles1011:60,'muscles1011-b':60};
for(const [scope,length] of Object.entries(examLengths)){
 const selected=selectExam(scope);if(selected.length!==length||new Set(selected.map(q=>q.id)).size!==length)throw new Error('Wrong exam length or duplicate items '+scope);
 const expectedChapters=scope.startsWith('muscles1011')?[10,11]:legacyChapterGroups[scope]||[Number(scope)],actualChapters=[...new Set(selected.map(q=>Number(q.lesson.split('.')[0])))];
 if(actualChapters.length!==expectedChapters.length||actualChapters.some(chapter=>!expectedChapters.includes(chapter)))throw new Error('Incorrect chapter scope '+scope);
 if(scope.startsWith('muscles1011')&&(!validMuscleBlueprint(selected)||selected.reduce((sum,q)=>sum+muscleQuestionPoints(q),0)!==100))throw new Error('Incorrect combined muscle exam blueprint '+scope);
}
const cell=x=>'"'+String(x).replaceAll('"','""')+'"';fs.writeFileSync(new URL('CURRICULUM-COVERAGE.csv',root),'\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\n')+'\n');
const publishedChapters=new Set(syllabus.chapters.map(chapter=>chapter.id));
const summary={chapters:syllabus.chapters.length,sections:lessons.length,interactiveSections:interactiveSections.size,addedVisualSections:newVisualSections.length,interactiveSourceViews:diagramSourceKeys().length,sourceObjectives:rows.length-1,examBank:examBank.length,supplementaryQuestions:questions.length-examBank.length,glossaryTerms:glossary.length,completeChapterPages:pages.filter(p=>publishedChapters.has(p.chapter)).length,supplementalReadingPages:pages.filter(p=>!publishedChapters.has(p.chapter)).length,chapterExamLength:50,cumulativeExamLength:100,comprehensiveExamLength:300,expandedComprehensiveExamLength:330,combinedMuscleExamLength:60,combinedMuscleExamPoints:100,examLengths};
fs.writeFileSync(new URL('curriculum-summary.json',root),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
