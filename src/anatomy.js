// Anatomical divisions are independent of the viewer's regional groupings.
import {discAreas} from './spinal-context.js';
export const divisions=['All','Axial','Appendicular'];
// Named teaching tissues stay with their anatomical neighborhood during regional
// navigation. A ligament is not a bone, but must not disappear from a joint view.
export function tissueAreas(n){
 if(/Sacrotuberous ligament|Sacrospinous ligament/.test(n))return ['pelvis'];
 if(/Plantar tendon sheath of fibularis longus/.test(n))return ['foot'];
 if(/Conoid ligament|Trapezoid ligament|Acromioclavicular ligament|glenohumeral ligament|Coracohumeral ligament/.test(n))return ['shoulder','arm'];
 if(/Flexor retinaculum of wrist/.test(n))return ['hand','forearm'];
 if(/iliofemoral ligament|Ligament of head of femur/.test(n))return ['pelvis','thigh'];
 if(/cruciate ligament|collateral ligament|Patellar ligament/.test(n))return ['knee','leg','thigh'];
 if(/Pubic symphysis/.test(n))return ['pelvis'];
 if(/Stylohyoid ligament|Vertebral artery/.test(n))return ['neck'];
 if(/Intervertebral disc|Nucleus pulposus/.test(n))return discAreas(n);
 return [];
}
export function tissueRegion(n){const a=tissueAreas(n)[0];return ['shoulder','arm','forearm','hand'].includes(a)?'Upper limb':['thigh','knee','leg','foot'].includes(a)?'Lower limb':a==='pelvis'?'Pelvis':['neck','thoracic-spine','lower-back'].includes(a)?'Spine':null;}
export function meshRegion(n,g=''){
 const tissue=tissueRegion(n);if(tissue)return tissue;
 if(/Thyroid cartilage|Cricoid cartilage|Arytenoid cartilage|Corniculate cartilage/.test(n))return'Thorax';
 if(/nasal septal cartilage|alar cartilage/i.test(n))return'Skull';
 if(/cranium|ossicle|teeth/i.test(g)||/bone of cranium/i.test(g))return'Skull';
 if(/Vertebra|Atlas|Axis|Sacrum|Coccyx/.test(n))return'Spine';
 if(/rib|sternum|Xiphoid|Hyoid/i.test(n))return'Thorax';
 if(/Hip bone/.test(n))return'Pelvis';
 if(/Clavicle|Scapula|Humerus|Radius|Ulna|metacarpal|of hand|Scaphoid|Pisiform|Lunate|Triquetrum|Trapez|Capitate|Hamate/.test(n))return'Upper limb';
 if(/Femur|Patella|Tibia|Fibula|Talus|Calcaneus|Navicular|Cuboid|cuneiform|metatarsal|of foot/.test(n))return'Lower limb';
 if(/Frontal bone|Parietal bone|Temporal bone|Occipital bone|Sphenoid bone|Ethmoid bone|Maxilla|Zygomatic bone|Mandible|Palatine bone|Nasal bone|Lacrimal bone|Vomer|Inferior nasal concha|Malleus|Incus|Stapes|^Sinus |tooth|canine|incisor|premolar/i.test(n))return'Skull';
 return'Other anatomy';
}
export function meshDivision(name){
 return /Clavicle|Scapula|Humerus|Radius|Ulna|metacarpal|of hand|Scaphoid|Pisiform|Lunate|Triquetrum|Trapez|Capitate|Hamate|Hip bone|Femur|Patella|Tibia|Fibula|Talus|Calcaneus|Navicular|Cuboid|cuneiform|metatarsal|of foot|acromio|coraco|glenohumeral|cruciate|collateral|iliofemoral|head of femur|Pubic symphysis|Patellar ligament|Flexor retinaculum of wrist|Conoid ligament|Sacrotuberous ligament|Sacrospinous ligament|Plantar tendon sheath/i.test(name)?'Appendicular':'Axial';
}
export function termDivision(t){
 if(t.division)return t.division;
 if(t.name==='Pelvis'||t.name==='Pelvic brim')return'Mixed';
 if(/Sacrum|Coccyx/.test(t.pattern))return'Axial';
 return ['Upper limb','Lower limb','Pelvis','Joints'].includes(t.region)?'Appendicular':'Axial';
}
export const inDivision=(t,division)=>division==='All'||termDivision(t)===division;
export const regionAvailable=(region,division,items)=>region==='All regions'||items.some(t=>t.region===region&&inDivision(t,division));
export const meshInRegion=(name,meshRegion,region)=>region==='All regions'||(region==='Joints'?meshDivision(name)==='Appendicular':meshRegion===region||tissueRegion(name)===region||(region==='Pelvis'&&/^(Sacrum|Coccyx|Vertebra L5)$/.test(name))||(region==='Thorax'&&/^Vertebra T\d+$/.test(name)));
export const skullFamilies=[
 ['Frontal bone','Frontal','#edb16c','Cranial',1],['Parietal bone','Parietal','#68c5dd','Cranial',2],
 ['Temporal bone','Temporal','#b8a0ed','Cranial',2],['Occipital bone','Occipital','#e48eae','Cranial',1],
 ['Sphenoid bone','Sphenoid','#a3cb69','Cranial',1],['Ethmoid bone','Ethmoid','#f0d76e','Cranial',1],
 ['Maxilla','Maxilla','#69c8ad','Facial',2],['Zygomatic bone','Zygomatic','#ed896a','Facial',2],
 ['Mandible','Mandible','#75a6ed','Facial',1],['Palatine bone','Palatine','#d9a1cb','Facial',2],
 ['Nasal bone','Nasal','#c0d19a','Facial',2],['Lacrimal bone','Lacrimal','#e5c1a0','Facial',2],
 ['Vomer','Vomer','#81cbd2','Facial',1],['Inferior nasal concha bone','Inferior nasal concha','#d59b72','Facial',2],
 ['Malleus','Malleus','#f0b6bd','Associated',2],['Incus','Incus','#c4c2f1','Associated',2],['Stapes','Stapes','#a4ded2','Associated',2]
].map(([pattern,name,color,group,count])=>({pattern,name,color,group,count}));
export const skullFamily=name=>skullFamilies.find(f=>name.replace(/\.[lr]$/,'')===f.pattern);
