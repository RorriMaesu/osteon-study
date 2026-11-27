// glTF uses metres. Only specimens calibrated against a measured reference
// should opt in. The bar describes the plane through the orbit centre.
export function metricBar(height,fieldOfView,depth){
  if(!(height>0&&depth>0))return;
  const pixelsPerMm=height/(2000*depth*Math.tan(fieldOfView*Math.PI/360));
  const max=74/pixelsPerMm,base=10**Math.floor(Math.log10(max));
  const mm=[5,2,1].map(value=>value*base).find(value=>value<=max)||base;
  return {mm:Number(mm.toPrecision(3)),pixels:mm*pixelsPerMm};
}
export function mountMetricScale(viewport,viewer){
  const bar=document.createElement('span');bar.className='organ-metric-scale';
  bar.title='Scale at the center of rotation';viewport.append(bar);
  let previousWidth,previousLength;
  return ()=>{
    if(!viewer.controls)return;
    const depth=viewer.controls.target.distanceTo(viewer.camera.position);
    const size=metricBar(viewport.clientHeight,viewer.camera.fov,depth);
    if(!size)return;
    const width=Math.round(size.pixels);
    if(width!==previousWidth){previousWidth=width;bar.style.width=width+'px';}
    if(size.mm!==previousLength){previousLength=size.mm;bar.textContent=size.mm+' mm';}
  };
}
