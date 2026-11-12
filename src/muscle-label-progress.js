import {getProgress} from './storage.js';
import {saveNamedRecall} from './muscle-study-state.js';

const modes={worksheet:['label','locate'],spatial:['name','find']};
const targetPattern=/^[a-z0-9][a-z0-9-]{0,119}$/;

export function muscleLabelId(kind,mode,targetId){
 if(!Object.hasOwn(modes,kind)||!modes[kind].includes(mode)||typeof targetId!=='string'||!targetPattern.test(targetId))return null;
 return ['muscle-label',kind,mode,targetId].join('-');
}

function parseLabelId(id){
 const match=/^muscle-label-(worksheet|spatial)-(label|locate|name|find)-([a-z0-9-]+)$/.exec(id);
 if(!match||!muscleLabelId(match[1],match[2],match[3]))return null;
 return {kind:match[1],mode:match[2],targetId:match[3]};
}

export function recordMuscleLabel(kind,attempt){
 if(!attempt||typeof attempt.correct!=='boolean'||['pending','unanswered'].includes(attempt.answerStatus))return;
 const id=muscleLabelId(kind,attempt.mode,attempt.targetId||attempt.termId);
 if(!id)return;
 const status=attempt.correct&&['spelling','equivalent'].includes(attempt.answerStatus)?attempt.answerStatus:attempt.correct?'correct':'incorrect';
 saveNamedRecall(id,attempt.lesson||'11.1',{status,correction:attempt.correction,response:attempt.response},!!attempt.assisted,'muscle-label-'+kind);
}

export function dueMuscleLabels(kind,progress=getProgress(),now=Date.now()){
 return Object.entries(progress.cards).flatMap(([id,card])=>{
  const target=parseLabelId(id);
  return target?.kind===kind&&Number.isFinite(card.due)&&card.due<=now?[{...target,due:card.due}]:[];
 }).sort((a,b)=>a.due-b.due);
}

export function muscleLabelCoverage(cards,worksheetTerms,progress=getProgress()){
 const practiced={worksheet:new Set(),spatial:new Set()};
 for(const attempt of progress.attempts){
  const label=parseLabelId(attempt.id);
  if(!label)continue;
  const term=label.kind==='worksheet'?worksheetTerms.get(label.targetId):label.targetId;
  if(term)practiced[label.kind].add(term);
 }
 return cards.map(card=>({id:card.id,name:card.name,worksheet:practiced.worksheet.has(card.id),spatial:practiced.spatial.has(card.id)}));
}
