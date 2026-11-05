import osteon from './curriculum-syllabus.json' with {type:'json'};
import foundations from './foundations-syllabus.json' with {type:'json'};

export const syllabus={...osteon,chapters:[...foundations.chapters,...osteon.chapters],sections:[...foundations.sections,...osteon.sections]};
export const publishedChapterIds=syllabus.chapters.filter(c=>c.status!=='pilot').map(c=>c.id);
export const legacyChapterGroups={all:[6,7,8,9],all10:[6,7,8,9,10]};
