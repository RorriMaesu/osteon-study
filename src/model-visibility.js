import {meshDivision} from './anatomy.js';
import {isIntervertebralDisc} from './spinal-context.js';
import {ligamentInDivision} from './ligament-data.js';

// Shared by the actual renderer and its view-transition regression checks.
export function adultVisibility(mesh,state){
 const disc=isIntervertebralDisc(mesh.name),selected=!!state.selected;
 const overlay=!!(mesh.ligament&&state.ligaments);
 const inDivision=overlay?ligamentInDivision(mesh.ligament,state.division):state.division==='All'||meshDivision(mesh.name)===state.division;
 const hiddenLigament=mesh.ligament&&!overlay&&(mesh.ligament.asset==='ligaments'||(state.ligaments===false&&!selected&&!state.context));
 if(state.activeDetail||state.hidden||!inDivision||hiddenLigament)return {visible:false,opacity:1};
 let visible;
 if(state.isolated)visible=selected||!!state.focusedBone||(overlay&&state.boneView&&state.inScope);
 else if(state.isolateContext)visible=selected||!!state.context||(disc&&state.discs&&state.discContext);
 else visible=!!(state.inScope||selected||state.context||(disc&&state.discs&&state.discContext));
 // A selected exercise target cannot be switched off with a contextual layer.
 if(!selected){
  if(disc&&!state.discs)visible=false;
  if(mesh.tissue&&!disc&&!overlay&&!state.tissues&&!state.context)visible=false;
  if(mesh.sinus&&!state.sinuses)visible=false;
 }
 const faded=!selected&&(state.ghost||(state.ghostContext&&state.context));
 return {visible:!!visible,opacity:faded?(disc&&!state.innerDiscTarget ? .5 : .12):1};
}

export function focusGuideVisible(guide,{selectedIds,activeDetail,visibleParents,assessmentTask,answerRevealed}){
 if(assessmentTask==='locate'&&!answerRevealed)return false;
 return !!guide.focusFor?.some(id=>selectedIds.includes(id))&&(!guide.focusSpecimen||guide.focusSpecimen===activeDetail)&&visibleParents.has(guide.focusParent);
}
