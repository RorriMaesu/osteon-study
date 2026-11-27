const source='https://openstax.org/books/anatomy-and-physiology-2e/pages/26-4-acid-base-balance';
const amber='#ffce69',aqua='#75e4d6';
const phase=(at,label,text)=>({at,label,text});
const trace=(points,span,color)=>({mode:'trace',points,span,color,trail:true,size:.033});
const cue=(mesh,span,color)=>({mode:'cue',mesh,span,color,sustained:true});

// Model coordinates follow the same capillary branch, open left alveolus,
// duct and respiratory bronchiole used to construct alveolar-exchange.glb.
const exhaledCO2=[
  [-1.06,.58,.09],[-.91,.39,.14],[-.73,.18,.19],[-.51,.16,.24],
  [-.46,.15,.17],[-.34,.14,-.02],[0,.10,-.12],
  [0,.36,-.10],[-.02,.60,-.08],[-.20,.88,-.10],[-.40,1.29,-.13]
];
const ventilation=[
  phase(0,'Matched ventilation','At rest, CO₂ removal matches tissue production. Arterial PCO₂ and pH remain near their starting levels. Follow the marker from pulmonary blood into alveolar air and out through the airway.'),
  phase(1/3,'Lower alveolar ventilation','With tissue CO₂ production held constant, less CO₂ leaves per minute. Arterial PCO₂ rises, the buffer equilibrium shifts toward H⁺ and pH falls.'),
  phase(2/3,'Higher alveolar ventilation','Compared with the same baseline, more CO₂ leaves per minute. Arterial PCO₂ falls, H⁺ falls and pH rises.')
];
const lungEffects=[2,1,3].flatMap((cycles,phaseIndex)=>
  Array.from({length:cycles},(_,i)=>trace(exhaledCO2,[(phaseIndex+i/cycles)/3,(phaseIndex+(i+1)/cycles)/3],aqua)));

// Proximal lumen, tip of adjacent peritubular capillary, and cortical collecting
// duct coordinates come from nephron-pair.glb. Cell-scale transport is enlarged
// separately in the companion; the whole-nephron arrows mark its segment.
const proximal=[[-.68,.94,.02],[-.61,1.04,.08],[-.53,1,.12],[-.65,.95,.13],[-.57,.82,.02]];
const renal=[
  phase(0,'Filtered bicarbonate','Most filtered HCO₃⁻ is reclaimed in the proximal tubule. Secreted H⁺ reacts with luminal HCO₃⁻. Carbonic anhydrase facilitates conversion to CO₂ and water.'),
  phase(.25,'Return to blood','CO₂ enters the proximal cell. HCO₃⁻ forms again and exits toward peritubular blood. Recycling H⁺ recovers a filtered bicarbonate equivalent. This step adds no new base.'),
  phase(.5,'Acid load · type A cell','In the collecting duct, a type A intercalated cell secretes H⁺ into tubular fluid and returns HCO₃⁻ toward blood. Net urinary acid excretion with buffers such as phosphate contributes new bicarbonate to blood.'),
  phase(.75,'Base load · type B cell','A type B intercalated cell in the cortical collecting duct secretes HCO₃⁻ into tubular fluid through pendrin in exchange for chloride. H⁺ moves toward the blood. Urinary bicarbonate loss helps lower an elevated pH.')
];
export const acidBaseOrgans=[
  {id:'respiratory-acid-base',title:'Lungs · ventilation and pH',system:'Respiratory',kind:'Process overlay',bodyIds:['lungs'],
    action:'Compare ventilation, CO₂ and pH',description:'Compare three ventilation conditions at a fixed rate of tissue CO₂ production. The turquoise symbols show relative CO₂ clearance through a representative alveolus over the same interval. Open the readout to compare blood gas and pH trends.',
    aliases:['chapter 26','carbon dioxide','acid base','hyperventilation','hypoventilation','partial pressure'],section:'26.4',source,
    asset:'assets/ap3-models/alveolar-exchange.glb',targets:['pulmonary_arteriole','capillary_network','alveolar_air_spaces','alveolar_duct','respiratory_bronchiole'],context:['alveolar_septum','pulmonary_venule'],
    direction:[.12,.12,1],duration:20,phases:ventilation,effects:lungEffects},
  {id:'renal-acid-base',title:'Kidneys · acid secretion and bicarbonate',system:'Urinary',kind:'Process overlay',bodyIds:['kidneys'],
    action:'Compare proximal and collecting-duct transport',description:'The 3D model locates each segment. Open the cell view to follow solutes between tubular fluid, the epithelial cell and the blood side. The last two phases compare responses to separate acid and base loads.',
    aliases:['chapter 26','acid base','kidney','hydrogen ion','alpha intercalated cell','beta intercalated cell','bicarbonate','pH','pendrin'],section:'26.4',source,
    asset:'assets/ap3-models/nephron-pair.glb',targets:['cortical_proximal_tubule','peritubular_capillaries','shared_collecting_duct'],
    context:['cortical_corpuscle','cortical_loop','cortical_distal_tubule','afferent_arteriole','efferent_arteriole'],
    direction:[.04,.04,1],duration:24,phases:renal,
    effects:[
      cue('cortical_proximal_tubule',[0,.25],amber),trace(proximal,[0,.25],amber),
      cue('peritubular_capillaries',[.25,.5],aqua),trace([proximal.at(-1),[-.58,.78,.095],[-.59,.74,.13]], [.25,.5],aqua),
      cue('shared_collecting_duct',[.5,1],amber),
      trace([[.999,.62,.04],[.97,.62,.04],[.93,.62,.04],[.93,.52,.04],[.93,.38,.04]],[.5,.75],amber),
      trace([[.999,.62,.04],[.97,.62,.04],[.93,.62,.04],[.93,.52,.04],[.93,.38,.04]],[.75,1],aqua)
    ]}
];
