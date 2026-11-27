const vesicles=[
  {early:'Forebrain',late:'Telencephalon',organ:'Cerebral hemispheres',cavity:'Lateral ventricles',level:'cerebral hemisphere',shape:'cerebrum'},
  {early:'Forebrain',late:'Diencephalon',organ:'Thalamus and hypothalamus',cavity:'Third ventricle',level:'diencephalon',shape:'thalamus'},
  {early:'Midbrain',late:'Mesencephalon',organ:'Midbrain tissue',cavity:'Cerebral aqueduct',level:'midbrain',shape:'midbrain'},
  {early:'Hindbrain',late:'Metencephalon',organ:'Pons and cerebellum',cavity:'Fourth ventricle',level:'pons',shape:'pons'},
  {early:'Hindbrain',late:'Myelencephalon',organ:'Medulla oblongata',cavity:'Fourth ventricle',level:'open rostral medulla',shape:'medulla'}
];
export {vesicles};
const outlines={
  cerebrum:['M30 62C18 31 46 10 72 15Q79 17 80 39Q82 16 90 15C122 8 146 33 132 65Q129 89 109 88Q92 91 80 77Q54 99 33 78Z','M51 46Q62 36 71 44L72 52Q61 48 51 59Z M91 44Q101 36 111 46L110 59Q99 48 89 52Z'],
  thalamus:['M36 53Q34 20 66 20Q77 20 80 30Q84 18 99 21Q131 26 126 56Q123 83 93 82L81 89L67 80Q43 84 36 53Z','M77 34Q81 29 84 34L83 70Q80 80 77 69Z'],
  midbrain:['M41 28Q48 11 63 17L80 24Q101 9 116 23Q126 37 117 59Q115 89 95 85L80 75L64 85Q43 91 42 67Q31 48 41 28Z','M75 38Q80 31 85 38L84 44Q80 49 76 44Z'],
  pons:['M26 47Q18 20 47 17Q66 11 80 20Q100 11 117 19Q144 26 134 49L124 58Q120 88 82 93Q45 90 39 62Z','M55 49L80 33L105 49Q80 53 55 49Z'],
  medulla:['M47 47Q39 25 53 23L65 28Q80 16 96 28L107 23Q121 29 112 49Q119 66 97 83Q80 94 62 82Q40 68 47 47Z','M56 44L80 29L104 44Q80 49 56 44Z']
};
function field(kind,shape,angle,focus){
  const embryonic=kind==='embryonic',wall=embryonic?'M33 54C33 7 127 7 127 54C127 98 33 99 33 54Z':outlines[shape][0];
  const lumen=embryonic?'M60 53C60 32 100 32 100 53C100 73 60 73 60 53Z':outlines[shape][1];
  const forebrain=shape==='cerebrum'||shape==='thalamus',orientation=forebrain?'Superior':'Dorsal';
  return '<svg style="display:block;width:100%;height:auto;max-height:11rem" viewBox="0 0 160 112" role="img" aria-label="'+(embryonic?'Embryonic tube in section.':'Adult section rotated '+angle+' degrees. '+orientation+' is marked.')+' Tissue surrounds '+(shape==='cerebrum'&&!embryonic?'two blue internal spaces.':'a blue internal space.')+(focus?' Starting mark on '+focus+'.':'')+'">'+
    '<g transform="rotate('+angle+' 80 54)"><path data-domain="wall" d="'+wall+'" fill="#b79486" stroke="'+(focus==='wall'?'#ffe595':'#e3bfa4')+'" stroke-width="'+(focus==='wall'?4:1)+'"/><path data-domain="lumen" d="'+lumen+'" fill="#457f9d" stroke="'+(focus==='lumen'?'#ffe595':'#c3e8ef')+'" stroke-width="'+(focus==='lumen'?4:1)+'"/>'+
    (embryonic?'':'<text x="80" y="12" fill="currentColor" font-size="10" text-anchor="middle">'+(forebrain?'S':'D')+'</text>')+'</g></svg>';
}
export function renderVesicleMap(){return '<section class="neuro-station" data-sensory-detail="vesicle-map"><h3>Trace a vesicle wall or lumen</h3><p>Follow one region through development. Gold marks your starting region. The simplified adult sections mark superior (S) in forebrain views and dorsal (D) in brainstem views.</p>'+
 '<div class="course-actions"><label>Region <select data-vesicle>'+vesicles.map((v,i)=>'<option value="'+i+'">'+v.late+'</option>').join('')+'</select></label><label>Direction <select data-direction><option value="forward">Embryo to adult</option><option value="back">Adult to embryo</option></select></label><label>Starting region <select data-domain-choice><option value="wall">Wall tissue</option><option value="lumen">Fluid space</option></select></label> <button type="button" data-rotate-section>Rotate adult section</button></div>'+
 '<div data-trace-views style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr));gap:.4rem"></div><div data-trace-choices></div><p data-trace-feedback role="status"></p></section>';}
export function mountVesicleMap(panel){
  const get=s=>panel.querySelector(s),select=get('[data-vesicle]'),direction=get('[data-direction]'),domain=get('[data-domain-choice]');
  let angle=0;
  function draw(){
    const v=vesicles[+select.value],forward=direction.value==='forward',target=domain.value;
    const f=(name,section,label,start)=>'<figure style="margin:.2rem" '+(start?'':'data-destination')+'><figcaption>'+name+' · '+label+'</figcaption>'+field(section,v.shape,section==='adult'?angle:0,start?target:null)+'</figure>';
    for(const option of select.options)option.textContent=forward?vesicles[+option.value].late:vesicles[+option.value].level;
    const embryo=f('Embryo','embryonic',forward?v.early+' → '+v.late:v.early,forward),adult=f('Adult','adult',v.level,!forward);
    get('[data-trace-views]').innerHTML=forward?embryo+adult:adult+embryo;
    const names=[...new Set(vesicles.map(x=>forward?(target==='wall'?x.organ:x.cavity):x.late))];
    const expected=forward?(target==='wall'?v.organ:v.cavity):v.late;
    get('[data-trace-choices]').innerHTML='<p>Where does the marked region correspond in the second section? Select it on the drawing or use the buttons.</p><div class="course-actions"><button data-region-answer="wall">Tissue region</button><button data-region-answer="lumen">Internal space</button></div><div data-name-part hidden><label>'+(forward?'Name the adult structure':'Name the secondary vesicle')+' <select data-trace-name><option value="">Choose</option>'+names.map(n=>'<option>'+n+'</option>').join('')+'</select></label> <button data-check-trace>Check name</button></div>';
    const note=get('[data-trace-feedback]');note.textContent='';
    function identify(key){
      if(key!==target){note.textContent=target==='wall'?'Follow the tissue around the fluid.':'Follow the fluid space enclosed by the tissue.';return;}
      const dest=get('[data-destination]');dest.querySelector('[data-domain="'+key+'"]').setAttribute('stroke','#ffe595');dest.querySelector('[data-domain="'+key+'"]').setAttribute('stroke-width','4');
      note.textContent='Corresponding region selected.';get('[data-name-part]').hidden=false;get('[data-trace-name]').focus();
    }
    get('[data-destination]').onclick=ev=>{if(ev.target.dataset.domain)identify(ev.target.dataset.domain);};
    for(const button of panel.querySelectorAll('[data-region-answer]'))button.onclick=()=>identify(button.dataset.regionAnswer);
    get('[data-check-trace]').onclick=()=>{
      const n=get('[data-trace-name]').value;
      note.textContent=n===expected?'Correct. '+v.early+' → '+v.late+'. The wall forms '+v.organ.toLowerCase()+' and the lumen contributes to the '+v.cavity.toLowerCase()+'.'+(v.cavity==='Fourth ventricle'?' Both hindbrain vesicles contribute to the fourth ventricle. Use surrounding tissue to distinguish their levels.':''):'Revisit the '+v.level+' level and trace the '+target+' again.';
    };
  }
  select.onchange=direction.onchange=domain.onchange=draw;get('[data-rotate-section]').onclick=()=>{angle=angle===0?25:angle===25?-25:0;draw();};draw();
}

