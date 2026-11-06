import manifest from './lymph-node-models.json' with {type:'json'};
import {areas} from './exploration.js';

export const lymphNodeFiles=manifest.files;
export const lymphNodeRecords=manifest.structures;
export const lymphNodeByKey=new Map(lymphNodeRecords.map(record=>[record.key,record]));
export const lymphRegions={head:'Head',neck:'Neck','upper-limb':'Upper limb',thorax:'Thorax',abdomen:'Abdomen',pelvis:'Pelvis','lower-limb':'Lower limb'};
const atlasRegions={head:'Skull',neck:'Spine','upper-limb':'Upper limb',thorax:'Thorax',abdomen:'Spine',pelvis:'Pelvis','lower-limb':'Lower limb'};
export const lymphNodeTextbook='https://openstax.org/books/anatomy-and-physiology-2e/pages/21-1-anatomy-of-the-lymphatic-and-immune-systems';
export const lymphNodeStatus={'landmark-checked':'Position checked against nearby anatomy','source-aligned':'Source position · individual review pending',withheld:'Geometry withheld for review'};
export const lymphNodeTerms=lymphNodeRecords.filter(r=>r.status!=='withheld').map(r=>({
 id:'lymph-node:'+r.key,
 name:r.name+(r.side?' ('+(r.side==='l'?'left':'right')+')':''),
 aliases:[r.name,r.key.replace(/\.[lr]$/,'').replace(/[()]/g,''),'lymph nodes '+r.name.replace(/ nodes?$/,'')],
 region:atlasRegions[r.bucket],type:'Lymph nodes',source:'Z-Anatomy',exact:true,
 cue:r.cue||'Representative '+lymphRegions[r.bucket].toLowerCase()+' anatomy from Z-Anatomy. See the drainage atlas for this group’s connections.',
 representation:{kind:'mesh',lymphNodeKey:r.key,assessment:'learn-only',reference:'21.1'}
}));
export const lymphNodeTermByKey=new Map(lymphNodeTerms.map(term=>[term.representation.lymphNodeKey,term]));

export function lymphNodeInScope(record,{focus,region,division}){
 if(division!=='All'&&record.division!==division)return false;
 if(focus.areaId)return record.areas.includes(focus.areaId)&&(!focus.side||!record.side||focus.side===record.side);
 if(region==='All regions')return true;
 if(region==='Joints')return record.areas.includes('knee')||record.areas.includes('shoulder');
 return record.areas.some(id=>areas[id].macro===region);
}

export function lymphNodeScopeFiles(view){
 if(!view.focus.areaId&&view.region==='All regions')return [];
 return [...new Set(lymphNodeRecords.filter(r=>r.status!=='withheld'&&lymphNodeInScope(r,view)).map(r=>r.bucket))];
}
