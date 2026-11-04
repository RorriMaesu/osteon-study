// A disc belongs to both neighboring levels, including junctions between regions.
export function discLevels(name){return /^(?:Intervertebral disc|Nucleus pulposus) ([CTL]\d+)-([CTLS]\d+)$/.exec(name)?.slice(1)||[];}
export const isIntervertebralDisc=name=>/^Intervertebral disc /.test(name);
export const isNucleus=name=>/^Nucleus pulposus /.test(name);
export function vertebralLevel(name){if(name==='Atlas (C1)')return 'C1';if(name==='Axis (C2)')return 'C2';if(name==='Sacrum')return 'S1';return /^Vertebra ([CTL]\d+)$/.exec(name)?.[1]||null;}
export function discAreas(name){const levels=discLevels(name);return [...new Set(levels.map(level=>({C:'neck',T:'thoracic-spine',L:'lower-back',S:'pelvis'})[level[0]]))];}
export function betweenVisibleVertebrae(name,levels){const neighbors=discLevels(name);return isIntervertebralDisc(name)&&neighbors.length===2&&neighbors.every(level=>levels.has(level));}
