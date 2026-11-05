import checklist from './muscle-reference-checklist.json' with {type:'json'};
import manifest from './muscle-models.json' with {type:'json'};
export function muscleTermKey(value){return String(value).toLowerCase().replace(/\.[lr]$/,'').replace(/\bmuscles?\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
export function auditMuscleCoverage(components,reference=checklist.items){
 const muscles=components.filter(c=>c.kind==='muscle'),index=new Map();
 for(const c of muscles)for(const name of [c.name,c.sourceName,c.muscleName]){const key=muscleTermKey(name);if(!index.has(key))index.set(key,new Map());index.get(key).set(c.id,c);}
 const matches=name=>[...(index.get(muscleTermKey(name))?.values()||[])];
 const rows=reference.map(r=>{
  const groups=r.requiredGroups||[r.name],hits=groups.map(matches),named=hits.flat(),candidates=(r.candidateNames||[]).flatMap(matches),ids=[...new Set([...named,...candidates].map(c=>c.id))];
  const allNamed=hits.every(h=>h.length),paired=hits.every(h=>['left','right'].every(side=>h.some(c=>c.side===side||c.side==='bilateral'))),sideComplete=r.expectedSides==='left-and-right'?paired:named.some(c=>['midline','bilateral'].includes(c.side))||paired;
  const status=r.reviewStatus||(!allNamed?'no-named-mesh':!sideComplete?'side-review':r.requiredGroups?'represented-by-components':'named-geometry');
  return {...r,status,componentIds:ids,matchedGroups:hits.filter(h=>h.length).length,requiredGroupCount:groups.length,attachmentCertified:false};
 });
 const counts={};for(const r of rows)counts[r.status]=(counts[r.status]||0)+1;
 return {scope:checklist.scope,referenceChecks:rows.length,componentCount:components.length,muscleParts:muscles.length,supportParts:components.length-muscles.length,counts,geometryCertified:false,rows};
}
export const muscleCoverage=auditMuscleCoverage(manifest.components);
