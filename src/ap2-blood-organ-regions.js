import {regionSpecimen} from './ap2-endocrine-regions.js';
import {mountOrganViewer} from './ap2-organ-viewer.js';

const atlasCredit='Z-Anatomy, based on BodyParts3D. All eight structures retain their source coordinates. <a href="assets/ap2-glands/SOURCES.md" target="_blank" rel="noreferrer">Specimen credits</a>.';
const tissueCredit='Original Osteon teaching cutaway. Shapes, spacing and colors illustrate tissue relationships. <a href="assets/ap2-glands/SOURCES.md" target="_blank" rel="noreferrer">References</a>.';
export const organRegions={
  abdomen:{title:'Spleen, liver and neighboring organs',file:'upper-abdomen.glb',dir:[.12,.16,1],credit:atlasCredit,
    note:'Rotate the upper abdomen. Find the spleen on the subject’s left and the liver on the right, then select a structure to connect its location with its function.',
    targets:[
      ['Spleen',/^spleen$/,'#976584','Splenic macrophages remove aging erythrocytes and recycle their components. The spleen lies lateral to the stomach.'],
      ['Liver',/^liver$/,'#a96659','The liver processes bilirubin from heme breakdown for excretion in bile. It also hydroxylates vitamin D before the kidneys activate it.'],
      ['Stomach',/^stomach$/,'#cd9389','The stomach sits anterior to the pancreas. Gastrin from its lining promotes gastric acid secretion.'],
      ['Duodenum',/^duodenum$/,'#daaa76','Acid from the stomach entering the duodenum stimulates secretin release. Secretin promotes bicarbonate secretion by the pancreas.'],
      ['Pancreas',/^pancreas$/,'#dbb662','Enzyme and bicarbonate secretions reach the gut through ducts. Pancreatic islets release their hormones into blood.'],
      ['Gallbladder',/^gallbladder$/,'#8eae76','The gallbladder stores and concentrates bile made by the liver and contracts in response to cholecystokinin.'],
      ['Splenic vein',/^splenic_vein$/,'#829ec4','Venous blood from the spleen flows toward the hepatic portal vein. Rotate the model to follow the vessel behind the pancreas.'],
      ['Hepatic portal vein',/^portal_vein$/,'#9584b4','The portal vein carries blood from the digestive organs and spleen to the liver before it returns to the heart.']
    ]},
  marrow:{title:'Red bone marrow',file:'marrow-section.glb',dir:[.12,.15,1],credit:tissueCredit,
    colors:{erythroid_nuclei:'#794e80',megakaryocyte_nucleus:'#664574'},
    note:'Explore one enlarged marrow space between trabeculae. Find the nucleated erythroid precursors around the macrophage, then locate a megakaryocyte beside a sinusoid.',
    targets:[
      ['Trabeculae',/^trabeculae$/,'#dfc5a0','Thin plates and struts of spongy bone border marrow spaces. Blood cells develop in the spaces between them.'],
      ['Venous sinusoid',/^sinusoid$/,'#b6748c','Mature blood cells cross the sinusoidal lining into the circulation. The opening at the end shows the lumen.'],
      ['Erythroid precursors',/^erythroid_(cells|nuclei)$/,'#c98293','Developing erythroid cells cluster around a central macrophage. Their nuclei are expelled before they enter blood as reticulocytes.'],
      ['Central macrophage',/^macrophage$/,'#bb9469','The central macrophage supports developing erythroblasts and engulfs expelled nuclei.'],
      ['Megakaryocyte',/^megakaryocyte/,'#a499c9','This large cell has one multilobed nucleus. Extensions of its cytoplasm enter a sinusoid and give rise to platelets.'],
      ['Marrow adipocytes',/^marrow_adipocytes$/,'#efcd7a','Adipocytes store lipid. In this red marrow field they are interspersed among cells involved in blood production.']
    ]},
  skin:{title:'Skin and subcutaneous adipose tissue',file:'skin-fat-section.glb',dir:[.2,.28,1],credit:tissueCredit,
    note:'Look at the exposed face of the tissue block. Find the epidermis at the surface and the lobules of adipose tissue beneath the dermis.',
    targets:[
      ['Epidermis',/^epidermis$/,'#b77c62','UVB initiates vitamin D₃ synthesis in epidermal keratinocytes. The liver and kidneys carry out later processing steps.'],
      ['Dermis',/^dermis$/,'#ce9788','The dermis supports the epidermis and contains blood vessels. The overlying epidermis is avascular.'],
      ['Dermal blood vessels',/^cutaneous_vessels$/,'#bb676e','Superficial capillary loops rise toward the epidermis. Nutrients reach epidermal cells by diffusion.'],
      ['Subcutaneous adipocytes',/^adipocytes$/,'#e3be75','Adipocytes beneath the skin store triglycerides and secrete leptin, which signals energy stores to the hypothalamus.'],
      ['Connective tissue septa',/^connective_septa$/,'#ccbcb0','Connective tissue partitions the subcutaneous fat into lobules. The hypodermis lies beneath the skin proper.']
    ]}
};
export const regionalLessons={
  '17.10':[['abdomen','Digestive organs in 3D'],['skin','Skin and adipose tissue in 3D']],
  '18.2':[['marrow','Explore a red marrow space in 3D']],
  '18.3':[['abdomen','Where aging erythrocytes are cleared']]
};
export function addOrgansToLesson(body,section,preset){
  const entries=regionalLessons[section];
  if(!entries)return;
  const container=document.createElement('section');
  container.className='ap2-regional-practical';
  container.innerHTML='<h2>Explore the anatomy in 3D</h2>'+entries.map(([key,title])=>'<details data-regional-key="'+key+'"><summary>'+title+'</summary><div data-regional-station></div></details>').join('');
  body.prepend(container);
  for(const panel of container.querySelectorAll('details')){
    const key=panel.dataset.regionalKey,station=panel.querySelector('[data-regional-station]');
    const show=()=>{if(panel.open&&!station.hasChildNodes())regionSpecimen(station,organRegions[key],mountOrganViewer);};
    panel.addEventListener('toggle',show);
    if(preset===key){panel.open=true;show();requestAnimationFrame(()=>panel.querySelector('.organ-viewport')?.scrollIntoView({block:'center'}));}
  }
}
