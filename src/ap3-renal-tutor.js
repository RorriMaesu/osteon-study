import {collectingDuct} from './ap3-labs-kidney.js';

const measurement=/\b\d+(?:\.\d+)?\s*(?:mL|millilit(?:er|re)s?|mOsm|milliosmoles?)\s*(?:\/|per\s+)(?:min(?:ute)?|L|lit(?:er|re))\b/i;
const trialReference=/\b(?:(?:my|your|our|this|current|selected|the)\s+(?:trial|result|prediction|simulation|reference|run|measured value)s?|trial [AB]|compared (?:with|to) (?:the )?(?:baseline|reference))\b/i;
const trialOutcome=/\b(?:produc\w*|recover\w*|left at|lost|reabsorb\w*|concentrat\w*|permeability|driving force|net (?:water|flux)|urine)\b/i;

function contradictsMechanism(text,high){
  return text.split(/[.!?]\s+|\n/).some(sentence=>{
    if(/\b(?:not|never|doesn.t|isn.t|wouldn.t)\b/i.test(sentence))return false;
    const inward=/\bfrom the (?:medulla|interstitium|interstitial fluid)\s+(?:back\s+)?(?:in)?to the (?:duct|tubul\w*|lumen)\b/i;
    const closes=/\b(?:high|increased|elevated)\s+ADH\s+(?:(?:directly|can|will)\s+)?(?:close\w*|remove\w*|block\w*|reduce\w*|lower\w*|decrease\w*)\s+(?:(?:the|surface|number of|insertion of|apical|water|membrane)\s+)*(?:channels?|permeability|aquaporin\w*)\b/i;
    const impermeable=/\b(?:water )?permeability\s+(?:(?:was|is|to be|set)\s+)*(?:to\s+)?zero\b/i;
    return inward.test(sentence)||closes.test(sentence)||(high&&impermeable.test(sentence));
  });
}

// A number can be present in the table yet assigned to the wrong compartment.
// Report interpretations from the same function as the displayed experiment.
export function checkRenalTutorReply(text,context={},query=''){
  const diagram=context.diagram;
  if(context.assessmentMode==='exam'||context.course!=='ap3'||diagram?.id!=='ap3-lab-25-2')return null;
  const state=diagram.state;
  if(!state||!['Low','High'].includes(state.ADH)||!['Intact','Flattened'].includes(state['Medullary gradient']))return null;
  const prose=text.replace(/\[S\d+\]/gi,'').trim();
  const high=state.ADH==='High',intact=state['Medullary gradient']==='Intact';
  const asksForReading=trialReference.test(query)&&/\b(?:measur\w*|happen\w*|readings?|results?|predict\w*|volumes?|flow|recovered|concentrations?|difference|why|discuss|explain|interpret|compare)\b/i.test(query);
  const interpreting=asksForReading||(trialReference.test(prose)&&trialOutcome.test(prose));
  const generalReference=/\b(?:normally|in general|typical(?:ly)?|healthy adults?|normal plasma|standard unit)\b/i.test(prose);
  if(!interpreting&&(!measurement.test(prose)||generalReference)&&!contradictsMechanism(prose,high))return null;
  const inputs=state.ADH+' ADH and '+state['Medullary gradient'].toLowerCase()+' medullary gradient';
  const note={kind:'course-note',reference:'25.8',reason:'Course-generated reading of the selected collecting-duct trial.'};
  if(state.status==='Awaiting prediction'){
    return {...note,text:'Your trial uses '+inputs+'. The duct receives 10 mL/min at 300 mOsm/L. Compare the water-channel bars with the solute dots outside the duct. [S1]\n\nWhich setting changes water permeability, and which sets the osmotic driving force?'};
  }
  if(state.status!=='Prediction checked')return null;
  const result=collectingDuct.run({adh:Number(high),gradient:Number(intact)});
  const [[,refWater,refUrine,refConcentration],[,water,urine,concentration]]=result.result.rows;
  const question=intact?'If the interstitium matched the entering fluid, what would happen to net water movement at this ADH setting?':
    'Keeping this flat gradient, what would changing ADH do to water permeability and net water movement?';
  return {...note,text:'Your trial ('+inputs+') recovered '+water+' of water from the duct. Urine left at '+urine+' with a concentration of '+concentration+'. The low-ADH reference with an intact gradient recovered '+refWater+' and produced '+refUrine+' of urine at '+refConcentration+'. [S1]\n\n'+result.why+' [S1]\n\n'+question};
}
