import {syllabus} from './course-catalog.js';

// Chapter identifiers are whole numbers, never the first character of a lesson ID.
export const chapterOf = value => /^(\d+)\./.exec(String(value))?.[1] || '';
const lessonIds=new Set(syllabus.sections.map(s=>s.id));
export function isLessonId(value){return lessonIds.has(String(value));}
export const chapterDetails={
  1:{short:'Human body',route:'The human body',description:'Organization, homeostasis and the language of location'},
  2:{short:'Chemistry',route:'Chemistry of life',description:'Atoms, reactions, water and biomolecules'},
  3:{short:'Cells',route:'Inside the cell',description:'Membranes, organelles, DNA, proteins and cell division'},
  4:{short:'Tissues',route:'Tissue architecture',description:'Histology, tissue membranes and repair'},
  5:{short:'Skin',route:'The integumentary system',description:'Skin layers, accessories, protection and repair'},
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
