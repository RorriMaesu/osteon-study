const aqua='#77e2d5',gold='#ffd179',light='#eef1e7';
function text(c,str,x,y,color=light,size=12){
  c.fillStyle=color;c.font=size+'px system-ui';c.textAlign='center';c.fillText(str,x,y);
}
function arrow(c,x1,x2,y,ink,progress){
  const sign=Math.sign(x2-x1);
  c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.moveTo(x1,y);c.lineTo(x2,y);
  c.moveTo(x2-5*sign,y-4);c.lineTo(x2,y);c.lineTo(x2-5*sign,y+4);c.stroke();
  c.fillStyle=ink;c.beginPath();c.arc(x1+(x2-x1)*progress,y,4,0,Math.PI*2);c.fill();
}
const gasRows=[
  ['Matched','Steady','Steady','CO₂ removal matches tissue production.'],
  ['Lower','Rises','Falls','CO₂ retention increases H⁺ and lowers arterial pH.'],
  ['Higher','Falls','Rises','Greater CO₂ clearance decreases H⁺ and raises arterial pH.']
];
export function drawVentilation(c,t,index){
  const [air,pco2,ph,reading]=gasRows[index];
  for(const [x,name,value] of [[61,'Alveolar ventilation',air],[172,'Arterial PCO₂',pco2],[278,'Arterial pH',ph]]){
    text(c,name,x,20,light,11);text(c,value,x,45,gold,17);
  }
  const u=Math.max(0,Math.min(1,t*3-index));
  text(c,'Blood',50,84);text(c,'Alveolar air',169,84);text(c,'Exhaled air',285,84);
  arrow(c,49,283,100,aqua,(u*[2,1,3][index])%1);
  text(c,'CO₂ clearance at fixed tissue production',167,124,aqua,11);
  return reading+' Ventilation '+air.toLowerCase()+'. Arterial PCO₂ '+pco2.toLowerCase()+'. Arterial pH '+ph.toLowerCase()+'.';
}
const cellRows=[
  {cell:'Proximal tubule',first:['H⁺ secretion',170,55,gold],second:['CO₂ enters',55,170,aqua],reading:'Apical Na⁺/H⁺ exchange supplies H⁺ to tubular fluid. Filtered bicarbonate reacts with H⁺, generating CO₂ that can diffuse into the cell.'},
  {cell:'Proximal tubule',first:['H⁺ recycled',170,55,gold],second:['HCO₃⁻ to blood',170,287,aqua],reading:'Inside the cell, carbonic anhydrase helps regenerate bicarbonate and H⁺. Basolateral transport returns bicarbonate to blood. Reusing H⁺ reclaims filtered base.'},
  {cell:'Type A cell',first:['H⁺ to urine',170,55,gold],second:['HCO₃⁻ to blood',170,287,aqua],reading:'With an acid load, the apical proton pump secretes H⁺. Basolateral chloride/bicarbonate exchange returns HCO₃⁻ toward blood. Excretion of buffered acid adds new bicarbonate.'},
  {cell:'Type B cell',first:['HCO₃⁻ to urine',170,55,aqua],second:['H⁺ to blood',170,287,gold],reading:'With excess base, apical pendrin exchanges bicarbonate for luminal chloride. Basolateral proton pumps move H⁺ toward blood. More bicarbonate is excreted.'}
];
export function drawTubularCell(c,t,index){
  const row=cellRows[index],u=Math.max(0,Math.min(1,t*4-index));
  c.fillStyle='#283d42';c.fillRect(110,0,119,132);
  text(c,'Tubular fluid',53,17);text(c,row.cell,170,17,gold);text(c,'Blood side',286,17);
  text(c,'Apical',110,125,light,10);text(c,'Basolateral',229,125,light,10);
  for(const [k,[label,from,to,color]] of [row.first,row.second].entries()){
    const y=48+k*45;text(c,label,(from+to)/2,y-7,color);
    arrow(c,from,to,y+4,color,k===0?Math.min(1,2*u):Math.max(0,2*u-1));
  }
  return row.reading;
}
