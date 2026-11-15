// Canvas labels are optional. Moving controls and camera buttons always win.
export function overlapsPoseRect(a,b,gap=0){
 return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
}
export const poseRect=(x,y,width,height=width)=>({left:x-width/2,right:x+width/2,top:y-height/2,bottom:y+height/2});

export function placePoseLabel({anchor,width,height,labelWidth,labelHeight,obstacles=[],gap=7}){
 const half=labelWidth/2,vertical=labelHeight/2,margin=7;
 if(![anchor.x,anchor.y,width,height,labelWidth,labelHeight].every(Number.isFinite)||labelWidth>width-margin*2||labelHeight>height-margin*2)return null;
 const candidates=[],add=(x,y)=>candidates.push({x:Math.max(half+margin,Math.min(width-half-margin,x)),y:Math.max(vertical+margin,Math.min(height-vertical-margin,y))});
 for(const distance of [35,65,95,130]){
  add(anchor.x,anchor.y-distance);add(anchor.x,anchor.y+distance);
  add(anchor.x-half-distance,anchor.y);add(anchor.x+half+distance,anchor.y);
  add(anchor.x-half-25,anchor.y-distance);add(anchor.x+half+25,anchor.y-distance);
  add(anchor.x-half-25,anchor.y+distance);add(anchor.x+half+25,anchor.y+distance);
 }
 // Narrow phones can have no room beside the target. A free edge position is
 // preferable to covering its drag handle; a leader still identifies the part.
 for(let y=vertical+margin;y<=height-vertical-margin;y+=labelHeight+gap){add(half+margin,y);add(width-half-margin,y);}
 const free=candidates.filter(point=>!obstacles.some(obstacle=>overlapsPoseRect(poseRect(point.x,point.y,labelWidth,labelHeight),obstacle,gap)));
 free.sort((a,b)=>Math.hypot(a.x-anchor.x,a.y-anchor.y)-Math.hypot(b.x-anchor.x,b.y-anchor.y));
 return free[0]||null;
}

export function placePoseGrip({anchor,width,height,obstacles=[],endpoint=false}){
 const offsets=endpoint?[[0,0]]:[[43,0],[-43,0],[0,-43],[0,43]];
 for(const [dx,dy]of offsets){
  const point={x:anchor.x+dx,y:anchor.y+dy},rect=poseRect(point.x,point.y,40);
  if(rect.left<4||rect.right>width-4||rect.top<4||rect.bottom>height-4)continue;
  if(!obstacles.some(obstacle=>overlapsPoseRect(rect,obstacle,4)))return point;
 }
 return null;
}
