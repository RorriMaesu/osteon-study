import {skinLessons} from './foundations-skin.js';
import cellTissue from './foundations-celltissue-lessons.json' with {type:'json'};
import {earlyLessons} from './foundations-early-lessons.js';
export const foundationsLessons=[...earlyLessons,...cellTissue,...skinLessons,{
 id:'1.6',title:'Anatomical Terminology',short:'Give anatomy a common reference',objective:'Use anatomical position, region names, directional terms, planes, cavities and serous layers to communicate location precisely.',
 sections:[
  ['Anchor directions to the body','Anatomical position faces forward with palms forward. The subject’s right and left stay fixed when a viewer changes position. Supine means face up and prone means face down.'],
  ['Describe one structure relative to another','Superior and inferior compare height. Anterior and posterior compare front and back. Medial and lateral refer to distance from the midline. On an extremity, proximal and distal compare distance from attachment; superficial and deep compare distance from the surface.'],
  ['Name a region without naming its contents','Brachial refers to the arm and antebrachial to the forearm. The abdominal quadrants are four broad reference areas; the nine-region grid gives finer descriptions. Organs can cross boundaries.'],
  ['Predict a view from a plane','Sagittal divides right from left; only a midsagittal cut gives equal right and left portions. Frontal divides anterior from posterior. Transverse divides superior from inferior. An oblique plane cuts at an angle to these standard planes.'],
  ['Follow cavities and their linings','The posterior cavity includes the cranial and vertebral cavities. The anterior cavity includes the thoracic and abdominopelvic cavities, separated by the diaphragm. A serous membrane has a wall-facing parietal layer and an organ-facing visceral layer; fluid between them helps reduce friction.']
 ],compare:[['Subject / viewer','Directions are named for the body.'],['Medial / proximal','Toward the midline / toward the attachment of a limb.'],['Sagittal / midsagittal','Right versus left / equal right and left portions.'],['Region / cavity','A location on a map / a space and its boundaries.'],['Parietal / visceral','Lines the cavity wall / covers the organ.']],
 recall:['How do frontal, sagittal and transverse sections differ?','Frontal separates front and back, sagittal separates right and left, and transverse separates superior and inferior.'],
 application:['A structure lies on the outer surface of the left forearm near the wrist. Give its side and describe its position relative to the elbow.','It is on the subject’s left side, superficial and distal to the elbow.'],questions:[]
}];
