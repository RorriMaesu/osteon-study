// Anatomical divisions are independent of the viewer's regional groupings.
export const divisions=['All','Axial','Appendicular'];
export function meshRegion(n,g=''){
 if(/Thyroid cartilage|Cricoid cartilage|Arytenoid cartilage|Corniculate cartilage/.test(n))return'Thorax';
 if(/cranium|ossicle|teeth/i.test(g)||/bone of cranium/i.test(g))return'Skull';
 if(/Vertebra|Atlas|Axis|Sacrum|Coccyx/.test(n))return'Spine';
 if(/rib|sternum|Xiphoid|Hyoid/i.test(n))return'Thorax';
 if(/Hip bone/.test(n))return'Pelvis';
 if(/Clavicle|Scapula|Humerus|Radius|Ulna|metacarpal|of hand|Scaphoid|Pisiform|Lunate|Triquetrum|Trapez|Capitate|Hamate/.test(n))return'Upper limb';
 if(/Femur|Patella|Tibia|Fibula|Talus|Calcaneus|Navicular|Cuboid|cuneiform|metatarsal|of foot/.test(n))return'Lower limb';
 return'Skull';
}
export function meshDivision(name){
 return /Clavicle|Scapula|Humerus|Radius|Ulna|metacarpal|of hand|Scaphoid|Pisiform|Lunate|Triquetrum|Trapez|Capitate|Hamate|Hip bone|Femur|Patella|Tibia|Fibula|Talus|Calcaneus|Navicular|Cuboid|cuneiform|metatarsal|of foot|acromio|coraco|glenohumeral|cruciate|collateral|iliofemoral|head of femur|Pubic symphysis/i.test(name)?'Appendicular':'Axial';
}
export function termDivision(t){
 if(t.division)return t.division;
 if(t.name==='Pelvis'||t.name==='Pelvic brim')return'Mixed';
 if(/Sacrum|Coccyx/.test(t.pattern))return'Axial';
 return ['Upper limb','Lower limb','Pelvis','Joints'].includes(t.region)?'Appendicular':'Axial';
}
export const inDivision=(t,division)=>division==='All'||termDivision(t)===division;
export const regionAvailable=(region,division,items)=>region==='All regions'||items.some(t=>t.region===region&&inDivision(t,division));
export const meshInRegion=(name,meshRegion,region)=>region==='All regions'||(region==='Joints'?meshDivision(name)==='Appendicular':meshRegion===region||(region==='Pelvis'&&/Sacrum|Coccyx/.test(name)));
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
