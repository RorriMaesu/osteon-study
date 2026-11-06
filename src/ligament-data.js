import manifest from './ligament-models.json' with {type:'json'};

const aliases={
 'Anterior cruciate ligament':['ACL'],
 'Posterior cruciate ligament':['PCL'],
 'Fibular collateral ligament':['LCL','lateral collateral ligament of knee'],
 'Deep part of tibial collateral ligament':['deep MCL','medial collateral ligament of knee'],
 'Superficial part of tibial collateral ligament':['superficial MCL','medial collateral ligament of knee'],
 'Anterior talofibular ligament':['ATFL'],
 'Posterior talofibular ligament':['PTFL'],
 'Calcaneofibular ligament':['CFL'],
 'Plantar calcaneonavicular ligament':['spring ligament'],
 'Ligament of head of femur':['ligamentum teres','round ligament of femoral head'],
 'Annular ligament of radius':['radial annular ligament'],
 'Flexor retinaculum of wrist':['transverse carpal ligament'],
 'Coraco-acromial ligament':['coracoacromial ligament'],
 'Lateral temporomandibular ligament':['lateral ligament of jaw','TMJ ligament'],
 'Ligamenta flava':['yellow ligaments','ligamentum flavum'],
 'Transverse ligament of atlas':['transverse atlantal ligament','C1 transverse ligament'],
 'Tibiocalcaneal ligament':['deltoid ligament'],
 'Tibionavicular ligament':['deltoid ligament'],
 'Posterior tibiotalar ligament':['deltoid ligament'],
 'Patellar ligament':['patellar tendon'],
 'Posterior tibiofibular ligament':['PITFL'],
 'Anterior tibiofibular ligament':['AITFL']
};
const slug=value=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
const sideName={l:'left',r:'right'};
export const ligamentSurfaces=manifest.surfaces;
export const ligamentByMesh=new Map(ligamentSurfaces.map(record=>[record.sourceName,record]));
export const ligamentTerms=ligamentSurfaces.map(record=>{
 const {name,side,region,kind,division,sourceName,group,geometry}=record;
 return {
  id:'ligament-layer-'+slug(sourceName),name:side?name+' ('+sideName[side]+')':name,
  type:kind.toLowerCase(),region,division,exact:true,source:'Ligament layer',
  aliases:[name,...(aliases[name]||[])],
  cue:(name==='Transverse ligament of atlas'?'Arches behind the dens of C2 and attaches to the medial tubercles of C1. ':group?group+'. ':'')+geometry+'. Rotate or peel nearby structures to see deep attachments.',
  representation:{kind:'mesh',ligamentKey:sourceName,assessment:'learn-only',
   ligamentContext:name==='Transverse ligament of atlas'?['Atlas (C1)','Axis (C2)']:null,
   reference:region==='Spine'?'7.3':region==='Upper limb'?'8.2':region==='Pelvis'?'8.3':region==='Lower limb'?'9.6':'7.2',
   note:geometry.includes('reconstruction')?'Teaching reconstruction with approximated contours.':'Surface aligned to Osteon’s source skeleton. Individual attachment boundaries may vary.'}
 };
});
export const ligamentTermByMesh=new Map(ligamentTerms.map(term=>[term.representation.ligamentKey,term]));
export const ligamentInDivision=(record,division)=>division==='All'||record.division==='Mixed'||record.division===division;
export function ligamentInScope(record,{region,focus}){
 if(focus.areaId){
  return record.areas.includes(focus.areaId)&&(!focus.side||!record.side||focus.side===record.side);
 }
 return region==='All regions'||region==='Joints'||record.region===region;
}
