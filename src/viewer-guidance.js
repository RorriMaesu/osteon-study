export function viewerGuidance({level='overview',touch=false,blocked=false,peel=false}={}){
 const gesture=touch?'Double-tap':'Double-click';
 if(peel)return {intro:'Peel is on',hint:'Turn Peel off to select or zoom into a bone.',action:''};
 if(blocked)return {intro:'Practice view',hint:touch?'Drag to rotate · Pinch to zoom':'Drag to rotate · Scroll to zoom',action:''};
 if(level==='bone')return {intro:'One bone in focus',hint:'Back returns to the region · Drag to rotate',action:'Back to region'};
 if(level==='region')return {intro:gesture+' again → one bone',hint:gesture+' a bone to view it alone',action:'View bone alone'};
 return {intro:gesture+' a bone → zoom to region',hint:gesture+' once → region · Again → one bone',action:'Zoom to region'};
}

// A second touch may land on another mesh belonging to the same adult bone.
// Different bones, a drag, or a multitouch gesture must never trigger navigation.
export function doubleTap(last,next){
 return !!last&&!!next&&!!last.bone&&last.bone===next.bone&&next.time>=last.time&&next.time-last.time<=450&&Math.hypot(next.x-last.x,next.y-last.y)<=28;
}
