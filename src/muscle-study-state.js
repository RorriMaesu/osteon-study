import {getProgress,recordAttempt,scheduleCard,addSpellingNote} from './storage.js';
import {outcomeCorrect} from './typed-answer.js';

const text=(value,max)=>typeof value==='string'&&value.length<=max;
const id=value=>text(value,100)&&/^[a-z0-9-]*$/.test(value);
const optional=(value,check)=>value===undefined||check(value);

export function validMuscleStudyState(work){
 const card=work.muscleCard;
 if(card!==undefined&&(!card||!['course','all','revisit'].includes(card.scope)||!id(card.id)||!text(card.query,120)||
  typeof card.recall!=='boolean'||typeof card.revealed!=='boolean'||typeof card.tab!=='string'||!['activity','cards'].includes(card.tab)||!optional(card.naming,x=>typeof x==='boolean')||!optional(card.nameAssisted,x=>typeof x==='boolean')||!optional(card.nameResponse,x=>text(x,120))||!optional(card.nameFeedback,x=>text(x,220))))return false;
 const views=work.figureViews;
 if(views!==undefined&&(!views||typeof views!=='object'||Array.isArray(views)||Object.entries(views).length>60||!Object.entries(views).every(([key,v])=>
  /^(10|11)\.\d{1,2}$/.test(key)&&v&&Number.isInteger(v.view)&&v.view>=-1&&v.view<=30&&id(v.target)&&
  typeof v.recalling==='boolean'&&typeof v.assisted==='boolean'&&text(v.response,120)&&text(v.feedback,220)&&text(v.lastResponse,120)&&optional(v.finished,x=>typeof x==='boolean'))))return false;
 return optional(work.figureFromCard,x=>typeof x==='boolean')&&optional(work.muscleActivity,id);
}

export const newFigureView=()=>({view:-1,target:'',recalling:false,assisted:false,response:'',feedback:'',lastResponse:'',finished:false});
export const newMuscleCardView=(tab='cards')=>({scope:'course',id:'',query:'',recall:false,revealed:false,tab,naming:false,nameAssisted:false,nameResponse:'',nameFeedback:''});
export const figurePracticeId=targetId=>'muscle-figure-'+targetId;
export function dueFigureTargets(targets, figures, progress=getProgress(), now=Date.now()){
 const available=new Set(figures.map(f=>f.number));
 return Object.entries(targets).filter(([id,target])=>available.has(target.figure)&&
  Number.isFinite(progress.cards[figurePracticeId(id)]?.due)&&progress.cards[figurePracticeId(id)].due<=now)
  .sort(([a],[b])=>progress.cards[figurePracticeId(a)].due-progress.cards[figurePracticeId(b)].due);
}
export function recordFigureRecall(targetId,lessonId,result,assisted){
 saveNamedRecall(figurePracticeId(targetId),lessonId,result,assisted,'muscle-figure');
}
export function saveNamedRecall(id,lessonId,result,assisted,mode='muscle-card-name'){
 if(result.status==='pending'||result.status==='unanswered')return;
 const correct=outcomeCorrect(result);
 const attemptKey=id+':'+crypto.randomUUID();
 recordAttempt({id,topic:'Chapter '+lessonId.split('.')[0],correct,assisted,mode,answerStatus:result.status,attemptKey});
 if(correct&&!assisted)scheduleCard(id,3);
 if(result.status==='spelling')addSpellingNote({term:result.correction,sourceId:id,reference:lessonId,response:result.response,attemptKey});
}
export function saveCardReview(card,rating){
 recordAttempt({id:card.id,topic:'Chapter 11',correct:rating>=3,assisted:true,mode:'muscle-card',selfRated:true});
 scheduleCard(card.id,rating);
}
