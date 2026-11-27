import {mountNeuralStationPicker} from './ap2-neural-labs.js';
import {renderNeuralCases,mountNeuralCases} from './ap2-neural-cases.js';
import * as neural from './ap2-neural.js';
import * as regulation from './ap2-regulation.js';
import * as cardiovascular from './ap2-cardio.js';

const collections = [neural, regulation, cardiovascular];
export const chapters = collections.flatMap(group => group.chapters);
export const sections = chapters.flatMap(chapter => chapter.sections);
export const sectionById = new Map(sections.map(section => [section.id, section]));
const labs = new Map(collections.flatMap(group => group.chapters.map(chapter => [chapter.id, group])));

const examinationLabs = {
  renderLab(id) {
    const lab=regulation.renderLab(id);
    return (lab?'<div data-regulation-station>'+lab+'</div>':'')+'<div data-examination-cases>'+renderNeuralCases(id)+'</div>';
  },
  mountLab(root,id) {
    const base=root.querySelector('[data-regulation-station]');
    if(base)regulation.mountLab(base,id);
    mountNeuralCases(root.querySelector('[data-examination-cases]'),id);
    mountNeuralStationPicker(root);
  }
};
export function labFor(sectionId) {
  const ch=Number(sectionId.split('.')[0]);
  return ch===15||ch===16?examinationLabs:labs.get(ch);
}
export const units = [
  {id:'neural', title:'Neural foundations and somatic pathways', chapters:[12,13,14]},
  {id:'autonomic',title:'Autonomic control and neurological assessment',chapters:[15,16]},
  {id:'endocrine',title:'Endocrine regulation',chapters:[17]},
  {id:'circulation',title:'Blood, heart, and circulation',chapters:[18,19,20]}
];
