import {author} from './question-author.js';
const {items,m,t,x}=author();

m('1.6',1,'In an anterior view, a marker appears on the viewer’s left. Which side of the subject is marked?','The subject’s right',['The subject’s left','Always the midline','The posterior side'],'In an anterior view, the subject faces the observer, so the subject’s right appears on the observer’s left.');
t('1.6',1,'What is the anatomical term for lying face down?','Prone',['Prone position'],'Prone is face down. Anatomical position remains the fixed reference for directional terms.');
x('1.6',2,'Match the regional or directional term to its meaning.',[['Brachial','Arm'],['Antebrachial','Forearm'],['Proximal','Nearer the limb attachment'],['Superficial','Closer to the body surface']],'Regional names identify areas; directional words describe a comparison or position.');
m('1.6',2,'Relative to the elbow, how is the wrist positioned?','Distal',['Medial','Proximal','Superior'],'The wrist is farther from the limb’s point of attachment to the trunk than the elbow.');
x('1.6',3,'Match each plane with the portions it separates.',[['Sagittal','Right and left'],['Frontal','Anterior and posterior'],['Transverse','Superior and inferior']],'Plane names depend on the portions produced by the cut, independent of how the image is displayed.');
m('1.6',3,'A vertical cut separates unequal right and left portions. Which plane does it follow?','Parasagittal',['Midsagittal','Frontal','Transverse'],'A parasagittal cut is offset from the midline. A midsagittal cut follows the midline and separates equal right and left portions.');
m('1.6',4,'Which paired subdivisions belong to the posterior body cavity?','Cranial and vertebral cavities',['Thoracic and abdominal cavities','Pleural and pericardial cavities','Abdominal and pelvic cavities'],'The cranial cavity houses the brain and the vertebral canal houses the spinal cord. Both are posterior.');
t('1.6',4,'What muscular boundary separates the thoracic and abdominopelvic cavities?','Diaphragm',['Thoracic diaphragm'],'The diaphragm separates the thoracic compartment above from the abdominopelvic compartment below.');
m('1.6',5,'Which serous layer covers the lung surface directly?','Visceral pleura',['Parietal pleura','Visceral pericardium','Parietal peritoneum'],'Visceral pleura adheres to the lung. Parietal pleura lines the chest wall and other boundaries of the pleural cavity.');
t('1.6',5,'Name the serous layer that lines a cavity wall.','Parietal layer',['Parietal serosa','Parietal membrane','Parietal'],'Parietal refers to the cavity wall. The visceral layer is the organ-facing layer.');
export const foundationsBank=items.map(q=>q.type==='text'?{...q,answerPolicy:{kind:'concept'}}:q);
