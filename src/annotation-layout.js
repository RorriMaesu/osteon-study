export function drawingRect(width,height,{top=0,bottom=0,rail=0}={}){
 const x=12,y=Math.max(10,top),right=Math.max(x+60,width-12-rail),end=Math.max(y+60,height-12-bottom);
 return {x,y,width:Math.max(60,right-x),height:Math.max(60,end-y)};
}
export function comparisonLimit(width,height){return width<600?height<360?1:2:height<330?2:3;}
export function markerInView(q){return q.z>=-1&&q.z<=1&&Math.abs(q.x)<.99&&Math.abs(q.y)<.99;}
export function annotationName(term,label){return term.id==='ethmoidal-air-cells-and-sinus-openings'?'Ethmoidal air-cell region':label&&!/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(label)?label:term.name;}
export function pointKey(p){return p.term.id+':'+(p.anchor?.parent||p.label||p.point?.join(',')||'');}
