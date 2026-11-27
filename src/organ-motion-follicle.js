const phase=(at,label,text)=>({at,label,text});
const cue=(mesh,span,color)=>({mode:'cue',mesh,span,color,sustained:true});
const gold='#ffd376',aqua='#77dfd4';
const ring=Array.from({length:41},(_,i)=>{
  const a=2*Math.PI*i/40;
  return [-.38+.21*Math.cos(a),-.17+.21*Math.sin(a),.19];
});
export const follicleMotion={
  id:'follicle-ovulation',title:'Ovarian follicle · ovulation',system:'Reproductive',kind:'Process overlay',duration:18,
  bodyIds:['ovaries'],aliases:['antral follicle','secondary oocyte','LH surge','zona pellucida','corona radiata','cumulus oophorus','theca'],
  asset:'assets/ap3-models/ovarian-follicle.glb',direction:[.04,.03,1],section:'27.2',
  source:'https://openstax.org/books/anatomy-and-physiology-2e/pages/27-2-anatomy-and-physiology-of-the-ovarian-reproductive-system',
  action:'Follow an oocyte to ovulation',
  description:'Select any of the seven structures on the antral follicle. The front of this 3D specimen is a display cut. Open the ovulation section to watch the oocyte complex pass through a separate rupture in the follicle wall and overlying ovarian surface.',
  targets:['theca','granulosa_layer','antrum','cumulus_oophorus','corona_radiata','zona_pellucida','oocyte'],context:[],
  phases:[
    phase(0,'Follicle wall','The theca surrounds the granulosa layer. Granulosa cells border the fluid-filled antrum.'),
    phase(.23,'Oocyte and cumulus','The cumulus oophorus supports the oocyte in the antrum. The zona pellucida coats the oocyte. The innermost surrounding granulosa cells form the corona radiata.'),
    phase(.46,'LH surge','LH triggers completion of meiosis I. The secondary oocyte enters meiosis II and arrests in metaphase II. The cumulus expands and the apex of the mature follicle weakens.'),
    phase(.68,'Ovulation','The secondary oocyte leaves with its zona pellucida and surrounding cumulus cells, including the corona radiata. Open the ovulation section to follow the complex through the rupture.'),
    phase(.89,'After release','The complex enters the peritoneal cavity near the fimbriae. The remaining follicular cells luteinize and form the corpus luteum.')
  ],
  effects:[
    cue('theca',[0,.23],'#d39ba1'),cue('granulosa_layer',[0,.23],gold),cue('antrum',[0,.46],'#8ecdc8'),
    cue('cumulus_oophorus',[.23,.68],'#d998b3'),cue('zona_pellucida',[.23,1],gold),cue('oocyte',[.46,1],'#dc9bb1'),
    cue('corona_radiata',[.23,1],aqua),{mode:'trace',points:ring,span:[.23,.46],color:aqua,size:.024}
  ]
};

const ease=x=>{const f=Math.max(0,Math.min(1,x));return f*f*(3-2*f);};
// Coordinates in the teaching section. Both cellular coverings share the
// oocyte position. The apical gap opens before the complex reaches the wall.
export function releaseSection(t){
  const travel=ease((t-.68)/.21);
  return {gap:.53*ease((t-.58)/.12),x:84+162*travel,y:80-15*travel};
}
export function drawFollicleSection(c,t,index){
  const {gap,x,y}=releaseSection(t),cx=124,cy=65,rx=80,ry=45;
  function shell(rx,ry,start,end,ink,width){
    c.beginPath();c.ellipse(cx,cy,rx,ry,0,start,end);c.strokeStyle=ink;c.lineWidth=width;c.stroke();
  }
  function dot(x,y,r,color){
    c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();
  }
  function text(str,x,y,ink){
    c.fillStyle=ink;c.font='11px system-ui';c.textAlign='center';c.fillText(str,x,y);
  }
  c.fillStyle='#25464a';c.beginPath();c.ellipse(cx,cy,rx-5,ry-5,0,0,2*Math.PI);c.fill();
  shell(rx,ry,gap,2*Math.PI-gap,'#c89295',5);
  shell(rx-6,ry-5,gap,2*Math.PI-gap,'#b77c96',4);
  for(const [a,b] of [[-.92,-gap],[gap,.92]])shell(rx+8,ry+6,a,b,'#e5c6ae',3);
  text('Follicle wall',71,13,'#e7b6bf');text('Ovarian surface',240,26,'#ebcdb5');
  text('Antrum',131,46,'#b4ded6');
  if(t<.68){c.fillStyle='#96667f';c.beginPath();c.ellipse(70,82,18,11,.2,0,2*Math.PI);c.fill();}
  dot(x,y,7.7,'#ffe0b2');dot(x,y,5.7,'#d891a6');
  for(let i=0;i<12;i++){const a=i*Math.PI/6;dot(x+10*Math.cos(a),y+10*Math.sin(a),2.4,aqua);}
  text(index>=3?'Secondary oocyte + zona + corona':'Oocyte + zona + corona',163,125,'#f1d9ba');
  return [
    'Enlarged teaching section. The follicle wall and overlying ovarian surface are intact. The antrum contains follicular fluid.',
    'The oocyte sits within the cumulus. A pale zona pellucida coats the oocyte and a ring of corona radiata cells surrounds it.',
    'After the LH surge, meiosis I is completed. The wall and ovarian surface weaken at the follicular apex.',
    'A focal opening forms. The secondary oocyte passes through with its zona pellucida and corona radiata still attached.',
    'The released secondary oocyte is near the ovary. The follicular wall remains behind and develops into the corpus luteum.'
  ][index];
}
