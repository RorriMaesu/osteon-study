// Case diagrams use one coordinate system for the drawing, leader tips and controls.
const width=240,height=176;
const myelin={fill:'#8ad2be',edge:'#264e54',axon:'#e9b780',cell:'#b79bce'};

function axon(y){
  return '<path d="M12 '+y+' H229" stroke="'+myelin.axon+'" stroke-width="6" stroke-linecap="round"/>';
}
function sheath(x,y,length){
  const rings=[.18,.42,.66,.86].map(f=>{
    const at=x+length*f;
    return '<path d="M'+at+' '+(y-7)+' q-5 7 0 14"/>';
  }).join('');
  return '<rect x="'+x+'" y="'+(y-8)+'" width="'+length+'" height="16" rx="7" fill="'+myelin.fill+'" stroke="'+myelin.edge+'" stroke-width="2"/><g fill="none" stroke="'+myelin.edge+'" stroke-width="1.4">'+rings+'</g>';
}
function gliaPanel(multiple){
  if(!multiple){
    return axon(94)+sheath(63,94,108)+
      '<path d="M64 90 Q68 80 100 82 Q112 70 129 79 Q136 83 158 84 Q169 86 172 91 Q119 86 64 90Z" fill="'+myelin.cell+'"/>'+
      '<ellipse cx="117" cy="82" rx="9" ry="4" fill="#614673"/>';
  }
  return axon(46)+axon(129)+sheath(114,46,65)+sheath(56,129,61)+
    '<g fill="none" stroke="'+myelin.cell+'" stroke-width="4" stroke-linecap="round"><path d="M107 87 Q133 82 143 54"/><path d="M104 93 Q105 103 88 121"/></g>'+
    '<path d="M92 90 Q102 87 102 77 Q108 85 121 83 Q116 89 116 94 Q109 93 106 101 Q103 94 92 90Z" fill="'+myelin.cell+'"/>'+
    '<ellipse cx="107" cy="89" rx="4" ry="3.2" fill="#614673"/>';
}

const hemisphere='M118 37 C98 19 64 33 46 52 C28 72 29 99 43 121 C59 144 89 151 116 139 C118 128 119 111 119 93 L119 55Z';
const sulci='M54 55 Q69 57 71 48 M42 79 Q53 72 64 76 M46 106 Q59 98 66 103 M65 131 Q72 116 82 121 M83 42 Q92 49 98 44';
function brainPanel(enlarged){
  const horn=enlarged
    ?'M114 59 Q102 46 88 55 Q85 63 97 75 Q103 81 103 98 Q96 108 90 119 Q100 124 111 111 Q118 98 117 82Z'
    :'M114 66 Q108 55 102 59 Q101 65 108 76 Q111 84 110 99 L104 111 Q108 113 113 107 Q117 98 116 82Z';
  const half='<path d="'+hemisphere+'" fill="#ac989c" stroke="#ead9ce" stroke-width="2"/>'+
    '<path d="'+sulci+'" fill="none" stroke="#705f69" stroke-width="2.4" stroke-linecap="round"/>'+
    '<path d="'+horn+'" fill="#a0dae4" stroke="#3c626c" stroke-width="1.5"/>';
  const perfusion=enlarged?'':'<defs><pattern id="neuro-case-perfusion-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="#f0b884"/><path d="M0 0V6" stroke="#634b46" stroke-width="2"/></pattern></defs>'+
    '<path d="M37 76 Q40 59 54 49 Q70 51 77 63 Q79 73 85 82 Q64 91 61 104 Q46 104 35 96Z" fill="url(#neuro-case-perfusion-hatch)" stroke="#463d42" stroke-width="1.4"/>';
  return half+'<g transform="translate(240 0) scale(-1 1)">'+half+'</g>'+perfusion+
    '<g fill="#cfe4df" font-family="system-ui,sans-serif" font-size="10" text-anchor="middle"><text x="120" y="16">Anterior</text><text x="13" y="90">R</text><text x="227" y="90">L</text></g>';
}

const evidence={
  myelin:{
    title:'Compare the two myelinating cells',
    legend:'The narrow strand is an axon. Banded sleeves show myelin around an axon.',
    section:'12.2',source:'12-2-nervous-tissue',
    panels:[
      {label:'A',drawing:gliaPanel(true),description:'Two separate horizontal axons each carry a banded sleeve. A cell body between them sends a process to each sleeve.',
        spots:[
          {id:'A1',description:'Cell between the two horizontal fibers',at:[37,78],tip:[107,89]},
          {id:'A2',description:'Exposed strand beyond the lower sleeve',at:[188,153],tip:[197,129]}]},
      {label:'B',drawing:gliaPanel(false),description:'One horizontal axon passes through one sleeve. An oval nucleus lies along the outside of this sleeve.',
        spots:[
          {id:'B1',description:'Exposed strand before the sleeve',at:[36,133],tip:[39,94]},
          {id:'B2',description:'Nucleus on the outer edge of the sleeve',at:[168,45],tip:[117,82]}]}
    ],
    steps:[
      {prompt:'Mark the cell body with branches that reach two different axons.',answer:'A1',correct:'Two processes connect this cell body to myelin sleeves on different axons.',hint:'Start at a sleeve and follow a process back toward its cell body.'},
      {prompt:'Now mark the nucleus of the cell that wraps one segment of a single axon.',answer:'B2',correct:'This nucleus lies in the outer cytoplasm of the cell that formed this one sleeve.',hint:'Look at the outer surface of the long sleeve in panel B.'}
    ]
  },
  perfusion:{
    title:'Compare two axial brain sections',
    legend:'Pale blue cavities show ventricular CSF. Diagonal stripes indicate reduced blood delivery. The two sections are drawn at the same level with the subject’s right on your left.',
    section:'13.3',source:'13-3-circulation-and-the-central-nervous-system',
    panels:[
      {label:'A',drawing:brainPanel(false),description:'The two central cavities are narrow. A striped area occupies part of the subject’s right hemisphere.',
        spots:[
          {id:'A1',description:'Central cavity on the subject’s left',at:[193,142],tip:[128,76]},
          {id:'A2',description:'Outer tissue on the subject’s right',at:[28,38],tip:[60,79]}]},
      {label:'B',drawing:brainPanel(true),description:'Both central cavities are wider than those in A. The surrounding tissue has no striped area.',
        spots:[
          {id:'B1',description:'Central cavity on the subject’s left',at:[193,142],tip:[131,77]},
          {id:'B2',description:'Outer tissue on the subject’s right',at:[28,38],tip:[60,79]}]}
    ],
    steps:[
      {prompt:'Mark the tissue with reduced blood delivery.',answer:'A2',correct:'The striped area shows a focal change in tissue perfusion in case A.',hint:'Use the perfusion pattern in the legend to locate the changed tissue.'},
      {prompt:'Now mark one of the enlarged fluid spaces in the comparison section.',answer:'B1',correct:'Both lateral ventricles are wider in B than in A. The location of this change is inside a fluid space.',hint:'Compare the size of the paired cavities in both panels.'}
    ]
  }
};

const styles='<style>.case-evidence{margin:.8rem 0;padding:.7rem;border:1px solid #496667;border-radius:.6rem}.case-evidence h4{margin:.1rem 0 .4rem}.case-evidence-panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,13.5rem),1fr));gap:.6rem}.case-evidence-panel{margin:0;min-width:0;background:#102226;border:1px solid #416065;border-radius:.55rem}.case-evidence-panel figcaption{padding:.4rem .55rem 0;color:#d1e4de;font-weight:600}.case-evidence-plate{position:relative;max-width:23rem;margin:auto}.neuro-station .case-evidence-plate svg{width:100%;height:auto;max-width:none;max-height:none;margin:0}.neuro-station button.case-evidence-pin{position:absolute;transform:translate(-50%,-50%);width:2.65rem;height:2.65rem;min-height:0;padding:0;background:transparent;border:0;display:grid;place-items:center}.case-evidence-pin span{border:2px solid #e7e8cf;background:#204348;color:white;border-radius:.4rem;padding:.12rem .3rem;font-weight:700;font-size:.8rem;line-height:1.2}.case-evidence-pin[data-marked] span{background:#f4cd94;color:#203033;border-color:#f4cd94}.case-evidence-plate .case-tip{fill:none;stroke:#1d3136;stroke-width:1.6}.case-evidence summary{cursor:pointer}</style>';

function renderPanel(panel){
  const leaders=panel.spots.map(({at:[x,y],tip:[tx,ty]})=>'<path d="M'+x+' '+y+' L'+tx+' '+ty+'" fill="none" stroke="#23383d" stroke-width="3"/><path d="M'+x+' '+y+' L'+tx+' '+ty+'" fill="none" stroke="#f6e7c6" stroke-width="1.2"/><circle class="case-tip" cx="'+tx+'" cy="'+ty+'" r="3.8"/>').join('');
  const pins=panel.spots.map(({id,description,at:[x,y]})=>'<button class="case-evidence-pin" type="button" data-evidence-pin="'+id+'" style="left:'+x/width*100+'%;top:'+y/height*100+'%" aria-label="Mark '+id+' · '+description+'"><span>'+id+'</span></button>').join('');
  return '<figure class="case-evidence-panel"><figcaption>Panel '+panel.label+'</figcaption><div class="case-evidence-plate"><svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+panel.description+'">'+panel.drawing+leaders+'</svg>'+pins+'</div></figure>';
}
export function renderCaseEvidence(kind){
  const caseData=evidence[kind];
  if(!caseData)return '';
  return styles+'<section class="case-evidence" data-case-evidence="'+kind+'"><h4>'+caseData.title+'</h4><p>'+caseData.legend+'</p><p data-evidence-task><strong>'+caseData.steps[0].prompt+'</strong></p><div class="case-evidence-panels">'+caseData.panels.map(renderPanel).join('')+'</div>'+
    '<output role="status" data-evidence-feedback></output><button type="button" data-evidence-reset hidden>Clear marks and retry</button><details><summary>Read the diagrams</summary>'+caseData.panels.map(p=>'<p>Panel '+p.label+' · '+p.description+' '+p.spots.map(s=>s.id+' marks '+s.description.toLowerCase()+'.').join(' ')+'</p>').join('')+'</details>'+
    '<small>Osteon teaching schematics · <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/'+caseData.source+'" target="_blank" rel="noreferrer">OpenStax §'+caseData.section+' ↗</a></small></section>';
}

export function mountCaseEvidence(root){
  if(!root)return;
  const caseData=evidence[root.dataset.caseEvidence],pins=[...root.querySelectorAll('[data-evidence-pin]')];
  const task=root.querySelector('[data-evidence-task] strong'),feedback=root.querySelector('[data-evidence-feedback]'),reset=root.querySelector('[data-evidence-reset]');
  let index=0;
  for(const pin of pins)pin.onclick=()=>{
    const step=caseData.steps[index];
    if(!step||pin.hasAttribute('data-marked'))return;
    reset.hidden=false;
    if(pin.dataset.evidencePin!==step.answer){feedback.textContent=step.hint;return;}
    pin.setAttribute('data-marked','');
    pin.querySelector('span').textContent=pin.dataset.evidencePin+' ✓';
    pin.setAttribute('aria-label',pin.getAttribute('aria-label')+' · marked');
    index++;
    task.textContent=caseData.steps[index]?.prompt||'Both observations are marked.';
    feedback.textContent=step.correct+' '+(caseData.steps[index]?.prompt||'Use the evidence to answer the questions below.');
  };
  reset.onclick=()=>{
    for(const pin of pins){
      pin.removeAttribute('data-marked');
      pin.querySelector('span').textContent=pin.dataset.evidencePin;
      pin.setAttribute('aria-label',pin.getAttribute('aria-label').replace(/ · marked$/,''));
    }
    index=0;task.textContent=caseData.steps[0].prompt;
    feedback.textContent='Marks cleared. '+task.textContent;reset.hidden=true;pins[0].focus();
  };
}
