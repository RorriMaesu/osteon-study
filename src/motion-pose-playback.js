// A preview is a reversible excursion from the user's pose, never a new rest
// position. Zero velocity at each turn makes direction and role changes clear.
export function createPosePreview(values,joint,axis,cycle){
 const initial=values[joint]?.[axis];
 if(!cycle||![initial,cycle.from,cycle.to,cycle.duration].every(Number.isFinite)||cycle.duration<=0)return null;
 const targets=[cycle.from,cycle.to,initial],segments=[];
 let previous=initial,total=0;
 for(const target of targets){
  const distance=Math.abs(target-previous);
  if(distance>1e-6){segments.push({from:previous,to:target,distance});total+=distance;}
  previous=target;
 }
 if(!total)return null;
 const other=axis==='inhale'?'exhale':'inhale';
 const settle=joint==='breathing'&&values.breathing[other]>0?Math.min(.6,cycle.duration/5):0;
 let end=settle;
 for(const segment of segments){segment.start=end;end+=(cycle.duration-settle*2)*segment.distance/total;segment.end=end;}
 return {joint,axis,before:structuredClone(values),segments,settle,duration:cycle.duration,label:cycle.label};
}
export function samplePosePreview(preview,elapsed){
 const time=Math.max(0,Math.min(preview.duration,Number.isFinite(elapsed)?elapsed:0));
 if(time>=preview.duration)return {done:true,patch:structuredClone(preview.before),direction:0};
 if(preview.settle&&(time<preview.settle||time>preview.duration-preview.settle)){
  const other=preview.axis==='inhale'?'exhale':'inhale',start=time<preview.settle;
  const t=start?time/preview.settle:(time-preview.duration+preview.settle)/preview.settle;
  const eased=(1-Math.cos(t*Math.PI))/2;
  return {done:false,patch:{breathing:{[preview.axis]:0,[other]:preview.before.breathing[other]*(start?1-eased:eased)}},direction:start?-1:1};
 }
 const segment=preview.segments.find(item=>time<item.end)||preview.segments.at(-1);
 const t=Math.max(0,Math.min(1,(time-segment.start)/(segment.end-segment.start)));
 const eased=(1-Math.cos(t*Math.PI))/2,value=segment.from+(segment.to-segment.from)*eased;
 const patch={[preview.joint]:{[preview.axis]:value}};
 if(preview.joint==='breathing'){
  const other=preview.axis==='inhale'?'exhale':'inhale';
  patch.breathing[other]=0;
 }
 return {done:false,patch,direction:Math.sign(segment.to-segment.from)};
}
