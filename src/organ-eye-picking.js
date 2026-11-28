// The iris is visible through the clear cornea. The open pupil still gives
// learners a place to select the cornea itself from the front.
export function visibleEyeHit(hits,mode,rawOf){
  const front=hits[0];
  if(!front||mode!=='natural')return front;
  const raw=rawOf(front.object);
  if(raw!=='cornea_left'&&raw!=='cornea_right')return front;
  const next=hits.find(hit=>rawOf(hit.object)!==raw);
  return next&&rawOf(next.object)==='iris_'+raw.slice(7)?next:front;
}
