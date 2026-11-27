import {renderBloodFoundations,mountBloodFoundations} from './ap2-blood-foundations.js';
import {renderVesselTissue,mountVesselTissue} from './ap2-vessel-tissue.js';
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
const introductoryBloodLabs={renderLab:renderBloodFoundations,mountLab:mountBloodFoundations};
const regionalCirculationLabs={
  renderLab(id){
    const wall=id==='20.1',name=wall?'Vessel wall slides and capillaries':'Placenta and fetal shunts';
    return '<label class="ap2-lab-switch">Choose a station <select data-circulation-station><option value="core">'+(wall?'Veins and the calf pump':'Trace fetal circulation')+'</option><option value="'+(wall?'tissue':'shunts')+'">'+name+'</option></select></label>'+
      '<div data-circulation-core>'+cardiovascular.renderLab(id)+'</div><div data-circulation-detail hidden></div>';
  },
  mountLab(root,id){
    const core=root.querySelector('[data-circulation-core]'),detail=root.querySelector('[data-circulation-detail]'),select=root.querySelector('[data-circulation-station]');
    cardiovascular.mountLab(core,id);
    select.onchange=()=>{
      core.hidden=select.value!=='core';detail.hidden=!core.hidden;
      if(core.hidden&&!detail.firstElementChild){detail.innerHTML=renderVesselTissue(id);mountVesselTissue(detail,id);}
    };
  }
};
export function labFor(sectionId) {
  if(sectionId==='20.1'||sectionId==='20.6')return regionalCirculationLabs;
  if(['18.1','18.2','18.3'].includes(sectionId))return introductoryBloodLabs;
  const ch=Number(sectionId.split('.')[0]);
  return ch===15||ch===16?examinationLabs:labs.get(ch);
}
export const units = [
  {id:'neural', title:'Neural foundations and somatic pathways', chapters:[12,13,14]},
  {id:'autonomic',title:'Autonomic control and neurological assessment',chapters:[15,16]},
  {id:'endocrine',title:'Endocrine regulation',chapters:[17]},
  {id:'circulation',title:'Blood, heart, and circulation',chapters:[18,19,20]}
];
