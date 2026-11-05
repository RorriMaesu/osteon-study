import taxonomy from './muscle-taxonomy.json' with {type:'json'};
const support=new RegExp(taxonomy.supportPattern,'i'),groups=taxonomy.groups.map(g=>({...g,rx:new RegExp(g.pattern,'i')}));
export const sourceBase=name=>String(name).replace(/\.[lr]$/,'');
export function muscleKind(name){const base=sourceBase(name);return taxonomy.muscleOverrides.includes(base)?'muscle':support.test(base)?'support':'muscle';}
export function muscleGroup(component){if(muscleKind(component.sourceName)==='support')return component.name;return groups.find(g=>g.rx.test(sourceBase(component.sourceName)))?.name||component.muscleName;}
export function muscleDepth(component){return taxonomy.depthOverrides[sourceBase(component.sourceName)]||component.depth;}
