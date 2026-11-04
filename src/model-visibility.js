import {meshDivision} from './anatomy.js';
import {isIntervertebralDisc} from './spinal-context.js';

// Shared by the actual renderer and its view-transition regression checks.
export function adultVisibility(mesh,state){
 const disc=isIntervertebralDisc(mesh.name),selected=!!state.selected;
 if(state.activeDetail||state.hidden||(state.division!=='All'&&meshDivision(mesh.name)!==state.division))return {visible:false,opacity:1};
 let visible;
 if(state.isolated)visible=selected||!!state.focusedBone;
 else if(state.isolateContext)visible=selected||!!state.context||(disc&&state.discs&&state.discContext);
 else visible=!!(state.inScope||selected||state.context||(disc&&state.discs&&state.discContext));
 // A selected exercise target cannot be switched off with a contextual layer.
 if(!selected){
  if(disc&&!state.discs)visible=false;
  if(mesh.tissue&&!disc&&!state.tissues&&!state.context)visible=false;
  if(mesh.sinus&&!state.sinuses)visible=false;
 }
 const faded=!selected&&(state.ghost||(state.ghostContext&&state.context));
 return {visible:!!visible,opacity:faded?(disc&&!state.innerDiscTarget ? .5 : .12):1};
}

export function focusGuideVisible(guide,{selectedIds,activeDetail,visibleParents,assessmentTask,answerRevealed}){
 if(assessmentTask==='locate'&&!answerRevealed)return false;
 return !!guide.focusFor?.some(id=>selectedIds.includes(id))&&(!guide.focusSpecimen||guide.focusSpecimen===activeDetail)&&visibleParents.has(guide.focusParent);
}
