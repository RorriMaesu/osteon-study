import manifest from './nerve-models.json' with {type:'json'};
import {areas} from './exploration.js';

export const nerveFiles=manifest.files;
export const nerveRecords=manifest.structures;
export const nerveByKey=new Map(nerveRecords.map(record=>[record.key,record]));
export const nerveCategories={central:'Brain & cord',cranial:'Cranial nerves',peripheral:'Spinal & peripheral',autonomic:'Autonomic'};
const sides={l:'left',r:'right'};
const regions={head:'Skull',spine:'Spine',trunk:'Thorax','upper-limb':'Upper limb','lower-limb':'Lower limb'};
const assetScopes={
 skull:['head'],neck:['head','spine','upper-limb','trunk'],
 'thoracic-spine':['spine','trunk'],'lower-back':['spine','lower-limb','trunk'],
 thorax:['trunk','spine'],shoulder:['upper-limb'],arm:['upper-limb'],forearm:['upper-limb'],hand:['upper-limb'],
 pelvis:['lower-limb','spine','trunk'],thigh:['lower-limb'],knee:['lower-limb'],leg:['lower-limb'],foot:['lower-limb']
};
const aliases={
 'Spinal cord · white matter surface':['spinal cord','medulla spinalis'],
 'Common fibular nerve':['common peroneal nerve'],
 'Superficial fibular nerve':['superficial peroneal nerve'],
 'Deep fibular nerve':['deep peroneal nerve'],
 'Dorsal root ganglia':['spinal ganglia','spinal ganglion','DRG'],
 'Ophthalmic nerve':['V1','CN V1'],'Maxillary nerve':['V2','CN V2'],'Mandibular nerve':['V3','CN V3']
};
const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const routeNotes={
 'Facial nerve (VII)':'The facial nerve passes through the internal acoustic meatus and facial canal, then exits at the stylomastoid foramen. The source route near the internal acoustic meatus needs further alignment review.',
 'Vestibulocochlear nerve (VIII)':'The cochlear and vestibular divisions convey hearing and balance information. The source route near the internal acoustic meatus needs further alignment review.',
 'Median nerve':'Trace the main nerve from the upper arm to the wrist. The palmar cutaneous branch and digital branches have separate entries.',
 'Radial nerve':'Follow its modeled course across the posterior humerus and toward the elbow. The superficial and deep branches have separate entries.',
 'Sciatic nerve':'Follow its modeled course from the pelvis to the posterior thigh. The tibial and common fibular nerves have separate entries.',
 'Hypoglossal nerve (XII)':'The hypoglossal nerve supplies most tongue muscles. The exact path through the hypoglossal canal remains under review.'
};
export const nerveTerms=nerveRecords.map(record=>{
 const cranial=/\(([IVX]+)\)$/.exec(record.name)?.[1],standard=record.name.replace(/ \([IVX]+\)$/,'');
 const category=nerveCategories[record.category];
 return {
  id:'nerve:'+record.key,name:standard+(cranial?' · CN '+cranial:'')+(record.side?' ('+sides[record.side]+')':''),
  aliases:[record.name,standard,...(aliases[record.name]||[]),...(cranial?['CN '+cranial,'CN '+(roman.indexOf(cranial)+1),'cranial nerve '+cranial]:[])],
  type:category,source:record.provider,region:regions[record.bucket],exact:true,
  cue:record.partial||routeNotes[record.name]||'Source anatomy aligned to the adult skeleton. Use the related structures and source reference to study its course.',
  representation:{kind:'mesh',nerveKey:record.key,assessment:'learn-only',reference:record.category==='autonomic'?'15.1':record.category==='central'?'13.2':'13.4'}
 };
});
export const nerveTermByKey=new Map(nerveTerms.map(term=>[term.representation.nerveKey,term]));
export function nerveInScope(record,view){
 const {focus,region,division}=view;
 if(focus.areaId)return record.areas.includes(focus.areaId)&&(!focus.side||!record.side||focus.side===record.side);
 if(region!=='All regions'&&region!=='Joints')return record.areas.some(id=>areas[id]?.macro===region);
 if(region==='Joints')return ['upper-limb','lower-limb'].includes(record.bucket);
 if(division==='Axial')return ['head','spine','trunk'].includes(record.bucket)||record.areas.some(a=>['neck','thorax'].includes(a));
 if(division==='Appendicular')return ['upper-limb','lower-limb'].includes(record.bucket);
 return true;
}
export function nerveScopeFiles({focus,region}){
 if(focus.areaId)return assetScopes[focus.areaId]||[];
 if(region==='All regions')return [];
 if(region==='Joints')return ['upper-limb','lower-limb'];
 return [...new Set(Object.keys(assetScopes).filter(id=>areas[id]?.macro===region).flatMap(id=>assetScopes[id]))];
}

