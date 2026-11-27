import {adiposeLipolysis,mountAdiposeLipolysis} from './organ-motion-adipose.js';
import {visceralOrgans,mountVisceralMotion} from './organ-motion-visceral.js';
import {regulationOrgans,mountRegulationMotion} from './organ-motion-regulation.js';
import {accessoryGlandOrgans,mountAccessoryGlandMotion} from './organ-motion-accessory-glands.js';
import {skinOrgans,mountSkinMotion} from './organ-motion-skin.js';
import {exchangeOrgans,mountExchangeMotion} from './organ-motion-exchange.js';
import {vulvarPerfusion,mountPerfusion} from './organ-motion-perfusion.js';
import {dentition,mountDentition} from './organ-motion-dentition.js';
import {developmentMotions,mountDevelopmentMotion} from './organ-motion-development.js';
import {acidBaseOrgans} from './organ-motion-acid-base.js';
import {follicleMotion} from './organ-motion-follicle.js';
import {fluidExchangeOrgans} from './organ-motion-fluid-exchange.js';
import registration from './organ-atlas-assets.json' with {type:'json'};
import studySurfaces from './organ-study-surfaces.json' with {type:'json'};

const colors={digestive:'#d5956e',urinary:'#bd7992',reproductive:'#be89b5',respiratory:'#c18c99',endocrine:'#e4ae65',nervous:'#d7b686',lymphatic:'#85aa86',cardiovascular:'#bd6974',sensory:'#8fb4bd',integumentary:'#d0a387'};
export function organSystemColor(name){return colors[name?.toLowerCase()]||'#ca967f';}
export const bodyAtlas=registration;
export const organMotions=[adiposeLipolysis,...developmentMotions,...visceralOrgans,...regulationOrgans,...exchangeOrgans,...skinOrgans,...acidBaseOrgans,follicleMotion,...fluidExchangeOrgans,...accessoryGlandOrgans,dentition,vulvarPerfusion].sort((a,b)=>a.title.localeCompare(b.title));
for(const entry of organMotions)entry.studyOnly=studySurfaces[entry.id]||[];
export const motionById=new Map(organMotions.map(entry=>[entry.id,entry]));
const accessoryIds=new Set(accessoryGlandOrgans.map(entry=>entry.id));
const skinIds=new Set(skinOrgans.map(entry=>entry.id));
const exchangeIds=new Set(exchangeOrgans.map(entry=>entry.id));
const regulationIds=new Set(regulationOrgans.map(entry=>entry.id));

export function createOrganMotion(entry,instance,meshes){
  if(entry.id===adiposeLipolysis.id)return mountAdiposeLipolysis(entry,instance,meshes);
  if(developmentMotions.includes(entry))return mountDevelopmentMotion(entry,instance,meshes);
  if(accessoryIds.has(entry.id))return mountAccessoryGlandMotion(entry,instance,meshes);
  if(skinIds.has(entry.id))return mountSkinMotion(entry,instance,meshes);
  if(exchangeIds.has(entry.id))return mountExchangeMotion(entry,instance,meshes);
  if(entry.id===vulvarPerfusion.id)return mountPerfusion(entry,instance,meshes);
  if(entry.id===dentition.id)return mountDentition(entry,instance,meshes);
  return (regulationIds.has(entry.id)?mountRegulationMotion:mountVisceralMotion)(entry,instance,meshes);
}
export function motionsForBody(id){
  return organMotions.filter(entry=>entry.id===id||entry.bodyIds?.includes(id))
    .sort((a,b)=>Number(b.id===id)-Number(a.id===id)||(a.bodyIds?.indexOf(id)??0)-(b.bodyIds?.indexOf(id)??0));
}
export function phaseStart(entry,index){
  return entry.phases[index].at??index/entry.phases.length;
}
export function currentPhase(entry,t){
  let index=0;
  while(index+1<entry.phases.length&&phaseStart(entry,index+1)<=t)index++;
  return index;
}
export function sourceCredits(asset){
  const folder=asset.substring(0,asset.lastIndexOf('/'));
  if(folder==='assets')return 'assets/AP2-CARDIO-LICENSE.md';
  return folder+'/SOURCES.md';
}
