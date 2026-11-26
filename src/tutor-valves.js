import {ap2Reference} from './tutor-ap2.js';
import {sectionById} from './ap2-library.js';

const timing = /\b(?:open(?:s|ed|ing)?|reopen(?:s|ed|ing)?|clos(?:e[sd]?|ing|ure)|shut(?:s)?|pressure|gradient|timing|when|sequence|order|eject(?:ion|s|ed)?|fill(?:s|ing)?|systol\w*|diastol\w*|isovolum\w*|heart sounds?|s[12])\b/i;
const valve = /\b(?:valves?|mitral|tricuspid|bicuspid|semilunar|pulmonic)\b/i;
const namedHeartValve = /\b(?:aortic|pulmonic|pulmonary|mitral|bicuspid|tricuspid|semilunar|atrioventricular|av)\b/i;
const valveHistory = /\b(?:it|they|those|that|this|the other|what about|what happens next|then)\b/i;
const otherTopic = /\b(?:replacement|surgery|repair|treat\w*|diagnos\w*|steno\w*|regurgitat\w*|prolapse|murmur|embry\w*|leaflet|cusps?|tissue|chordae|papillary|made of|calculate|formula|venous valves?|lymphatic valves?|veins?|lymphangions?)\b/i;

const pressurePairs = {
  aortic:{name:'aortic',ventricle:'left ventricular',atrium:'left atrial',artery:'aortic',other:'mitral'},
  pulmonary:{name:'pulmonary',ventricle:'right ventricular',atrium:'right atrial',artery:'pulmonary trunk',other:'tricuspid'},
  mitral:{name:'mitral',ventricle:'left ventricular',atrium:'left atrial',artery:'aortic',other:'aortic'},
  tricuspid:{name:'tricuspid',ventricle:'right ventricular',atrium:'right atrial',artery:'pulmonary trunk',other:'pulmonary'}
};

function targetFor(text) {
  const outflow=/\b(?:aortic|aorta|pulmonic|pulmonary|semilunar)\b/i.test(text);
  const inflow=/\b(?:mitral|bicuspid|tricuspid|atrioventricular|av)\b/i.test(text);
  if (outflow && inflow) return 'cycle';
  if (/\b(?:pulmonic|pulmonary)\b/i.test(text) && !/\baort(?:a|ic)\b/i.test(text)) return 'pulmonary';
  if (/\baort(?:a|ic)\b/i.test(text) && !/\b(?:pulmonic|pulmonary)\b/i.test(text)) return 'aortic';
  if (/\b(?:mitral|bicuspid)\b/i.test(text) && !/\btricuspid\b/i.test(text)) return 'mitral';
  if (/\btricuspid\b/i.test(text) && !/\b(?:mitral|bicuspid)\b/i.test(text)) return 'tricuspid';
  return 'cycle';
}

function sequence() {
  return 'During filling, atrial pressure exceeds ventricular pressure and the mitral and tricuspid (atrioventricular) valves are open. As ventricular contraction starts, ventricular pressure rises above atrial pressure and the atrioventricular valves close (S1). All valves are closed during isovolumetric contraction. Ejection begins when ventricular pressure exceeds pressure in the aorta or pulmonary trunk and the corresponding aortic or pulmonary semilunar valve opens. As ventricular pressure falls below arterial pressure, the semilunar valves close (S2). Isovolumetric relaxation ends when atrial pressure again exceeds ventricular pressure and the atrioventricular valves reopen.';
}

function teaching(target, query, mode) {
  const p=pressurePairs[target];
  const closing=/\b(?:clos(?:e[sd]?|ing|ure)|shut(?:s)?|s2)\b/i.test(query);
  if(!p) {
    return mode==='explain'?sequence()+' [S1]':mode==='hint'?'Track the pressure on either side of each valve. All valves are closed during isovolumetric contraction. Which pressure difference must reverse for ejection to begin? [S1]':'During isovolumetric contraction, all four valves are closed. Which two pressures would you compare to predict when ventricular ejection begins? [S1]';
  }
  const semilunar=target==='aortic'||target==='pulmonary';
  const explanation=semilunar
    ? 'The '+p.name+' valve opens when '+p.ventricle+' pressure rises above '+p.artery+' pressure. This ends isovolumetric contraction and starts ejection during ventricular systole. The '+p.other+' valve closed earlier, when '+p.ventricle+' pressure first exceeded '+p.atrium+' pressure. At the end of ejection, '+p.ventricle+' pressure falls below '+p.artery+' pressure and the '+p.name+' valve closes.'
    : 'The '+p.name+' valve opens for ventricular filling when '+p.atrium+' pressure exceeds '+p.ventricle+' pressure. As the ventricle contracts, '+p.ventricle+' pressure rises above '+p.atrium+' pressure and the '+p.name+' valve closes. Both valves on this side remain closed during isovolumetric contraction. The '+p.other+' valve opens later, once '+p.ventricle+' pressure exceeds '+p.artery+' pressure.';
  if(mode==='explain') return explanation+' [S1]';
  const upstream=semilunar?p.ventricle:p.atrium;
  const downstream=semilunar?p.artery:p.ventricle;
  const question='For the '+p.name+' valve to '+(closing?'close':'open')+', which must be higher, '+upstream+' pressure or '+downstream+' pressure?';
  const cue=mode==='hint'?(closing?'Think about which pressure would push a little blood back toward the valve. ':'Forward flow goes from higher pressure to lower pressure. '):'';
  return cue+question+' [S1]';
}

export function cardiacValveTeaching(query, previous, context, mode) {
  if(context.assessmentMode==='exam'||otherTopic.test(query))return null;
  const q=String(query);
  const recent=String(previous||'');
  const inferred=valveHistory.test(q)&&q.split(/\s+/).length<=18&&valve.test(recent)&&timing.test(recent);
  const review=context.type==='review'&&context.review?.prompt||'';
  const usesReview=review&&/\b(?:this|my|that|answer|question|response)\b/i.test(q);
  const local=usesReview?q+' '+review:q;
  const evidence=inferred?local+' '+recent:local;
  const related=valve.test(evidence)&&(namedHeartValve.test(evidence)||context.reference==='19.3'||/\b(?:cardiac|heart|ventric\w*|atri[au]\w*)\b/i.test(evidence));
  const pressureEvent=/\bpressure\b/i.test(evidence)&&/\bventric\w*\b/i.test(evidence)&&/\b(?:aort\w*|pulmonary trunk|atri[au]\w*)\b/i.test(evidence);
  if(!(related||pressureEvent)||!timing.test(evidence))return null;
  const target=targetFor(namedHeartValve.test(local)?local:evidence);
  const reference=ap2Reference('19.3');
  const rightSide='On the right side, pressure differences across the tricuspid valve control flow from the right atrium into the right ventricle. The pulmonary valve opens as right ventricular pressure exceeds pulmonary trunk pressure and closes when the gradient reverses.';
  const source={id:'S1',...reference,text:[...sectionById.get('19.3').paragraphs,rightSide].join('\n\n')};
  return {authoredReply:teaching(target,local,mode),sources:[source]};
}
