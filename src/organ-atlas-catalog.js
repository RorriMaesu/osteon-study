import {visceralOrgans,mountVisceralMotion} from './organ-motion-visceral.js';
import {regulationOrgans,mountRegulationMotion} from './organ-motion-regulation.js';
import {exchangeOrgans,mountExchangeMotion} from './organ-motion-exchange.js';
import {vulvarPerfusion,mountPerfusion} from './organ-motion-perfusion.js';
import {dentition,mountDentition} from './organ-motion-dentition.js';
import registration from './organ-atlas-assets.json' with {type:'json'};

export const bodyAtlas=registration;
export const organMotions=[...visceralOrgans,...regulationOrgans,...exchangeOrgans,dentition,vulvarPerfusion].sort((a,b)=>a.title.localeCompare(b.title));
export const motionById=new Map(organMotions.map(entry=>[entry.id,entry]));
const exchangeIds=new Set(exchangeOrgans.map(entry=>entry.id));
const regulationIds=new Set(regulationOrgans.map(entry=>entry.id));

export function createOrganMotion(entry,instance,meshes){
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
export function chapterFor(entry){
  const section=/\/pages\/(\d+)-/.exec(entry.source);
  return section?Number(section[1]):null;
}
export function sourceCredits(asset){
  const folder=asset.substring(0,asset.lastIndexOf('/'));
  if(folder==='assets')return 'assets/AP2-CARDIO-LICENSE.md';
  return folder+'/SOURCES.md';
}
