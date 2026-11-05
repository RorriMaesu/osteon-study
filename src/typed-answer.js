import {objectiveChecks} from './foundations-objective-checks.js';
import {allTerms} from './data.js';
import glossary from './glossary.json' with {type:'json'};
import {answerPolicies,GRADING_VERSION} from './exam-answer-policies.js';
export {GRADING_VERSION};
export const fold=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\b(a|an|the|and)\b/g,' ').replace(/\s+/g,' ').trim();
const plurals={femur:'femora',tibia:'tibiae',fibula:'fibulae',radius:'radii',ulna:'ulnae',humerus:'humeri',scapula:'scapulae',clavicle:'clavicles',lacuna:'lacunae',trabecula:'trabeculae',diaphysis:'diaphyses',epiphysis:'epiphyses',diarthrosis:'diarthroses',syndesmosis:'syndesmoses',synostosis:'synostoses',phalanx:'phalanges'};
const pluralForms=s=>{const key=fold(s),singular=Object.keys(plurals).find(k=>plurals[k]===key);return [...new Set([key,plurals[key],singular].filter(Boolean))];};
const lexicon=[...allTerms,...glossary].flatMap(t=>[t.name,...(t.aliases||[])]).filter(Boolean);
// Include easy-to-confuse terms beyond the four assigned chapters.
const extra=['ileum','ilium','ischium','pubis','osteoblast','osteoclast','osteocyte','calcitonin','calcitriol','abduction','adduction','inversion','eversion','supination','pronation','flexion','extension','condyle','epicondyle','head','neck','foramen','fossa','canal'];
const foundationKeys=Object.values(objectiveChecks).flatMap(rows=>rows.flatMap(([,a,,b])=>[a,b]));
const known=new Set([...lexicon,...extra,...foundationKeys].flatMap(pluralForms));
const words=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const opposed=[['left','right'],['anterior','posterior'],['superior','inferior'],['medial','lateral'],['proximal','distal'],['head','neck'],['condyle','epicondyle'],['foramen','fossa','canal'],['abduction','adduction'],['inversion','eversion'],['osteoblast','osteoclast','osteocyte'],['ilium','ileum','ischium'],['calcitonin','calcitriol']];
export function answerPolicy(q){return q.answerPolicy||answerPolicies[q.id]||{kind:'structure',bone:q.type==='bone'};}
export function acceptedForms(q){const p=answerPolicy(q);return [...new Set([q.answer,...(q.aliases||[]),...(p.equivalents||[])].filter(Boolean))];}
export function editDistance(a,b){
 const rows=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)rows[i][0]=i;for(let j=0;j<=b.length;j++)rows[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){rows[i][j]=Math.min(rows[i-1][j]+1,rows[i][j-1]+1,rows[i-1][j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])rows[i][j]=Math.min(rows[i][j],rows[i-2][j-2]+1);}
 return rows[a.length][b.length];
}
function protectedDifference(expected,input){
 const e=new Set(expected.split(' ')),r=new Set(input.split(' '));
 if([...e].some(w=>/^[a-z]$/.test(w))&&[...r].some(w=>/^[a-z]$/.test(w)&&!e.has(w)))return true;
 for(const family of opposed){const has=family.filter(w=>e.has(w));if(has.length&&family.some(w=>r.has(w)&&!has.includes(w)))return true;}
 const ids=expected.match(/\b[ctlsc]?\d+\b/g)||[],actual=input.match(/\b[ctlsc]?\d+\b/g)||[];return !!(ids.length&&actual.some(n=>!ids.includes(n)));
}
const generic=new Set(['bone','bones','opening','foramen','canal','fossa','process','joint','ligament','cartilage','head','neck','projection','tissue','toe','arm','leg']);
export function assessTyped(q,response){
 const input=fold(response),p=answerPolicy(q),forms=acceptedForms(q),expected=fold(q.answer);
 const result=(status,reason,correction=q.answer)=>({schema:1,version:GRADING_VERSION,target:q.id,answer:q.answer,response:String(response??''),status,reason,correction});
 if(!input)return result('unanswered','No response was submitted.');
 if(p.allowAnySide&&/^(left|right) /.test(input)){const o=assessTyped({...q,answerPolicy:{...p,allowAnySide:false}},input.replace(/^(left|right) /,''));return result(o.status==='correct'?'equivalent':o.status,'This prompt tests the structure name; side is not assessed. '+o.reason,o.correction);}
 if(p.side&&new RegExp('\\b'+(p.side==='right'?'left':'right')+'\\b').test(input))return result('incorrect','The response names the opposite anatomical side.');
 if(p.side&&input.startsWith(p.side+' ')){const o=assessTyped({...q,answerPolicy:{...p,side:null}},input.slice(p.side.length+1));if(outcomeCorrect(o))return result(o.status==='spelling'?'spelling':'equivalent','The stated anatomical side agrees with this specimen.',o.correction);}
 const allowed=forms.flatMap(pluralForms),exact=allowed.includes(input);
 if(exact)return result(fold(q.answer)===input?'correct':'equivalent','The response matches an accepted term or word form.');
 if(p.formalOnly&&(p.descriptionOnly||[]).some(s=>fold(s)===input))return result('incorrect','This question asks for the anatomical term. Repeating its description does not retrieve that term.');
 if(p.bone&&/ bones?$/.test(input)){const trimmed=input.replace(/ bones?$/,'');if(allowed.includes(trimmed))return result('equivalent','The added word “bone” does not change the answer.');}
 if(p.kind==='count'){
  const plain=input.replace(/^(there are|there is|it has) /,'');if(plain!==input){const o=assessTyped(q,plain);return result(o.status==='correct'?'equivalent':o.status,o.reason,o.correction);}
  const expectedNumber=Number(expected),suffixes=['',...(p.suffixes||[])].map(fold),numberForms=[expected,fold(words[expectedNumber]||'')].filter(Boolean);
  for(const n of numberForms)if(suffixes.some(s=>input===(n+(s?' '+s:''))))return result('equivalent','The correct count is expressed with an appropriate structure name.');
  const unitWords=new Set(suffixes.join(' ').split(' '));if(['pair','pairs','carpal','carpals','tarsal','tarsals','metatarsal','metatarsals','metacarpal','metacarpals','phalanges'].some(w=>input.split(' ').includes(w)&&!unitWords.has(w)))return result('incorrect','The unit or named group differs from the requested count.');
  if(/\d/.test(input)||words.some(w=>new RegExp('\\b'+w+'\\b').test(input)))return result('incorrect','Use the correct count and unit; a different number, range or pair count is not a spelling correction.');
  const tokens=input.split(' '),word=tokens.shift(),suffix=tokens.join(' '),target=words[expectedNumber];
  if(target&&suffixes.includes(suffix)&&word.length>=4&&editDistance(word,target)===1)return result('spelling','The intended count is clear; practice its spelling.',target);
  return result(known.has(input)?'incorrect':'pending','The count wording needs review; no credit has been decided yet.');
 }
 if(p.kind==='set'){
  let parts=String(response).split(/[,;&]|\band\b/i).map(s=>s.trim()).filter(Boolean);if(parts.length===1&&p.members.every(m=>!m.includes(' ')))parts=input.split(' ');
  if(parts.length!==p.members.length)return result('incorrect','Include every requested structure exactly once, with no extra structures.');
  const unused=new Set(p.members),outcomes=[];
  for(const part of parts){const candidates=[...unused].map(answer=>({answer,outcome:assessTyped({id:q.id,answer,answerPolicy:{kind:'structure'}},part)})).filter(x=>['correct','spelling','equivalent'].includes(x.outcome.status));if(candidates.length!==1)return result(known.has(fold(part))?'incorrect':'pending','One of the listed structures needs a more precise identification.');unused.delete(candidates[0].answer);outcomes.push(candidates[0].outcome);}
  return result(outcomes.some(o=>o.status==='spelling')?'spelling':'equivalent','All requested structures are present; their order does not matter.');
 }
 if(generic.has(input))return result('incorrect','The response is too general for the requested structure or term.');
 if(known.has(input))return result('incorrect','This names a different anatomical structure or concept.');
 if(forms.some(f=>protectedDifference(fold(f),input)))return result('incorrect','A side, anatomical direction, numbered level or protected term differs from the answer.');
 if(/\b(or|not|except|instead|ignore|correct answer|mark this)\b/.test(input))return result('incorrect','The response contains alternatives, a contradiction or instructions rather than one clear answer.');
 // A known second structure must not disappear inside a spelling correction.
 const expectedWords=new Set(allowed.flatMap(a=>a.split(' '))),unexpected=input.split(' ').filter(w=>known.has(w)&&!expectedWords.has(w));
 const clean=s=>p.bone?s.replace(/ bones?$/,''):s;
 const candidate=forms.map(form=>{const a=clean(fold(form)),b=clean(input);return{form,a,b,d:editDistance(a,b)};}).sort((a,b)=>a.d-b.d)[0];
 const limit=candidate.a.length<4?0:candidate.a.length<12?1:2;
 if(candidate.d<=limit){
  if(unexpected.length)return result('pending','The proposed spelling correction could change an anatomical word.');
  const rivals=[...known].filter(k=>!allowed.includes(k)&&Math.abs(k.length-candidate.b.length)<=limit&&editDistance(k,candidate.b)<=candidate.d);
  if(!rivals.length)return result('spelling','The intended accepted term is unambiguous; spelling practice is saved separately.',candidate.form);
  return result('pending','This spelling could indicate more than one anatomical term.');
 }
 if(p.formalOnly&&candidate.d>Math.max(2,Math.floor(candidate.a.length*.25)))return result('incorrect','This question requires the anatomical term rather than its description.');
 if(candidate.d<=Math.max(2,Math.floor(candidate.a.length*.25))||input.includes(' '))return result('pending','The wording may express the answer, but needs a meaning review.');
 return result('incorrect','The response does not identify an accepted answer.');
}
export const outcomeCorrect=o=>['correct','spelling','equivalent'].includes(o.status);
export const outcomeLabel=o=>({correct:'Correct',spelling:'Correct — spelling to practice',equivalent:'Correct — equivalent wording',pending:'Meaning needs review',incorrect:'Concept needs another look',unanswered:'Unanswered'})[o.status];
