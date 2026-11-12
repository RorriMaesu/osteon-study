import osteon from './curriculum-syllabus.json' with {type:'json'};
import foundations from './foundations-syllabus.json' with {type:'json'};
import chapter11 from './chapter11-source.json' with {type:'json'};

export const syllabus={...osteon,chapters:[...foundations.chapters,...osteon.chapters,{id:11,title:chapter11.title,pdfStart:chapter11.pdfStart,pdfEnd:chapter11.pdfEnd,examLength:50}],sections:[...foundations.sections,...osteon.sections,...chapter11.sections]};
export const publishedChapterIds=syllabus.chapters.filter(c=>c.status!=='pilot').map(c=>c.id);
export const legacyChapterGroups={all:[6,7,8,9],all10:[6,7,8,9,10],foundations12:[1,2],foundations35:[3,4,5],course1to10:[1,2,3,4,5,6,7,8,9,10],course1to11:[1,2,3,4,5,6,7,8,9,10,11]};
