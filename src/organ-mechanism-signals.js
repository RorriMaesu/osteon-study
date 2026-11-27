const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};

// Qualitative output across one illustrative daylight → night → morning sequence.
export function pinealOutput(time){
  const t=clamp(time);
  if(t<1/3)return .12;
  if(t<2/3)return .12+.76*ease((t-1/3)*4.5);
  return .88-.76*ease((t-2/3)*3);
}

export const filtrationParticles={
  water:{label:'Water',color:'#7cd2ed',limit:1,scale:[1,1,1]},
  glucose:{label:'Glucose',color:'#e4b477',limit:1,scale:[1.1,1.1,1.1]},
  albumin:{label:'Albumin',color:'#cd9fe4',limit:.105,scale:[1.3,1,1.3]},
  erythrocyte:{label:'Red blood cell',color:'#ed766e',limit:.065,scale:[2,.8,1.8]}
};

export function filtrationReading(kind,time){
  const particle=filtrationParticles[kind]||filtrationParticles.water;
  const t=clamp(time),fraction=Math.min(t,particle.limit);
  if(particle.limit<1&&t>=particle.limit){
    const text=kind==='albumin'
      ?'Most albumin stays in plasma. The endothelial surface layer, basement membrane and slit diaphragms together limit its passage.'
      :'A red blood cell stays in the capillary. It is too large to pass an endothelial fenestra.';
    return {particle,fraction,text};
  }
  if(t<.17)return {particle,fraction,text:particle.label+' approaches the filtration barrier from capillary blood.'};
  if(t<.42)return {particle,fraction,text:particle.label+' passes through an endothelial fenestra.'};
  if(t<.66)return {particle,fraction,text:particle.label+' moves through the glomerular basement membrane.'};
  if(t<.9)return {particle,fraction,text:particle.label+' passes a slit diaphragm between podocyte foot processes.'};
  return {particle,fraction,text:kind==='glucose'?'Glucose reaches capsular space. In a healthy nephron the proximal tubule normally reabsorbs nearly all filtered glucose.':'Water reaches capsular space as part of the filtrate.'};
}

// A slowed, qualitative coronal section. Inferior margins lead superior margins.
export function foldCover(time){
  const t=clamp(time);
  if(t<.50||t>=.74){
    const opening=t<.2?1:t<.5?1-ease((t-.2)/.30):ease((t-.74)/.26);
    return {inferior:opening,superior:opening,voicing:false};
  }
  const cycle=((t-.50)/.24)*3;
  const edge=delay=>Math.max(0,Math.sin(Math.PI*2*(cycle-delay)));
  return {inferior:edge(0),superior:edge(.13),voicing:true};
}
