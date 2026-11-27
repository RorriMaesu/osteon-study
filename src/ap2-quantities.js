// Each factor converts the stated unit to the question's reference dimension.
const units = [
  {'l/min':1,'ml/min':.001,'l/s':60,'ml/s':.06},
  {'m/s':1,'cm/s':.01,'mm/s':.001,'km/h':1/3.6},
  {'ms':1,'s':1000},
  {'beats/min':1,'bpm':1,'beats/s':60},
  {'mg/min':1,'g/min':1000,'µg/min':.001},
  {'ml o2/dl':1,'ml o2/l':.1,'l o2/l':100,'ml/dl':1},
  {'pairs':1,'pair':1}
];
function unitName(value){
  return value.trim().toLowerCase().replace(/₂/g,'2').replace(/μ/g,'µ')
    .replace(/\b(millilit(?:er|re)s?)\b/g,'ml').replace(/\blit(?:er|re)s?\b/g,'l')
    .replace(/\bmilliseconds?\b/g,'ms').replace(/\bseconds?\b/g,'s').replace(/\bminutes?\b/g,'min')
    .replace(/\bmilligrams?\b/g,'mg').replace(/\bper\b/g,'/').replace(/\s*\/\s*/g,'/').replace(/\s+/g,' ');
}
export function checkQuantity(item,raw){
  const match=/^([+−-]?(?:\d{1,3}(?:,\d{3})+|\d+|(?=\.\d))(?:\.\d+)?(?:e[+-]?\d+)?)\s*(.*)$/i.exec(String(raw).trim());
  if(!match)return {correct:false,reason:'Enter one numerical value. You may include its unit.'};
  const value=Number(match[1].replace(/,/g,'').replace('−','-'));
  const expectedUnit=unitName(item.unit||''), given=unitName(match[2]);
  const conversions=units.find(group=>Object.hasOwn(group,expectedUnit));
  const factor=!given||given===expectedUnit?1:conversions&&Object.hasOwn(conversions,given)?conversions[given]/conversions[expectedUnit]:undefined;
  if(factor===undefined)return {correct:false,reason:'Check the units. This question asks for '+item.unit+'.'};
  const measured=value*factor;
  if(Number.isFinite(measured)&&Math.abs(measured-Number(item.expected))<=(item.tolerance||0)+1e-9)return {correct:true};
  const thousand=Number(item.expected)!==0&&[.001,1000].some(n=>Math.abs(measured*n-Number(item.expected))<=1e-9);
  return {correct:false,reason:thousand?'Check the prefix. Your value differs by a factor of 1,000.':null};
}
