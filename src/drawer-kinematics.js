// AP translation in the flexed tibia's frame. Positive Z is anterior in this
// Blender specimen; the femur never participates in the moving group.
export const DRAWER_AMPLITUDE=.008;
export function drawerDisplacement(progress,anterior){const p=Math.max(0,Math.min(1,Number(progress)||0));return [0,0,(anterior?1:-1)*DRAWER_AMPLITUDE*p];}
export function drawerProgress(seconds){const t=Math.max(0,seconds-.6)/1.6;if(t>=1)return {progress:1,complete:true,phase:'Hold the displaced position'};const p=Math.min(1,t);return {progress:p*p*(3-2*p),complete:false,phase:seconds<.6?'Neutral reference':'Tibia moving · femur held still'};}
export function drawerElapsed(progress){const p=Math.max(0,Math.min(1,Number(progress)||0));return .6+1.6*(.5-Math.sin(Math.asin(1-2*p)/3));}
