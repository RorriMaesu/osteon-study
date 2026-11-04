import syllabus from './curriculum-syllabus.json' with {type:'json'};

// Chapter identifiers are whole numbers, never the first character of a lesson ID.
export const chapterOf = value => /^(\d+)\./.exec(String(value))?.[1] || '';
const counts={6:7,7:5,8:5,9:7,10:9};
export function isLessonId(value){const match=/^(\d+)\.(\d+)$/.exec(String(value));return !!match&&+match[2]>=1&&+match[2]<=(counts[match[1]]||0);}
export const chapterDetails={
  6:{short:'Bone tissue',route:'Living bone',description:'Cells, matrix, growth, repair and calcium'},
  7:{short:'Axial skeleton',route:'Axial skeleton',description:'Skull, vertebral column and thoracic cage'},
  8:{short:'Appendicular skeleton',route:'Appendicular skeleton',description:'Girdles, limbs, hands and feet'},
  9:{short:'Joints',route:'Joints & movement',description:'Classification, motion and supporting tissues'},
  10:{short:'Muscle tissue',route:'Muscle tissue',description:'Organization, contraction, control, energy and repair'}
};
export const activeChapters=syllabus.chapters.map(c=>({...c,...chapterDetails[c.id]}));
export const objectiveCount=syllabus.sections.reduce((n,s)=>n+s.objectives.length,0);
export const chapterRange=activeChapters.map(c=>c.id).join(', ');
export const chapterCode=id=>String(id).padStart(2,'0');
