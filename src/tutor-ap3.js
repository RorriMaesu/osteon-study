import {chapters} from './ap3-curriculum.js';

export const springSections = chapters.flatMap(chapter => chapter.sections);
export const springSectionById = new Map(springSections.map(section => [section.id,section]));
export function isAP3Context(context={}) {
  return ['3','ap3'].includes(String(context.course ?? context.courseId)) || springSectionById.has(context.reference);
}
export function ap3Reference(id) {
  const section=springSectionById.get(id);
  return section ? {course:'ap3',reference:id,title:'Osteon A&P III §'+id+' · '+section.title,url:section.source} : null;
}
export function activeSpringLab(context={}) {
  return isAP3Context(context) && context.diagram?.id?.startsWith('ap3-lab-');
}
export function ap3GuideLessons() {
  return springSections.map(s=>({id:s.id,title:s.title,course:'ap3',objective:s.objective,choices:s.options,
    recall:[s.question,s.options[s.answer]+' '+s.why],application:[s.objective,s.worked+' '+s.explanation]}));
}
