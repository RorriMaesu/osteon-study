const days=3*24*60*60*1000;

const cases={
  afterload:[
    {
      prompt:'After an abrupt rise in aortic pressure, a ventricle produces the two beats below. Filling, contractility and heart rate are held fixed.',
      headers:['Simulated beat','EDV (mL)','ESV (mL)','Aortic opening pressure (mm Hg)'],
      rows:[['Baseline',135,55,78],['Next beat',135,75,103]],
      questions:[
        ['How did stroke volume change?',['It fell by 20 mL','It rose by 20 mL','It stayed at 80 mL'],0],
        ['Which observation supports an afterload effect?',['Less blood filled the ventricle','The ventricle opened the valve at a higher pressure and retained more blood','The heart beat more frequently'],1]
      ],
      why:'Stroke volume fell from 80 to 60 mL. End-diastolic volume stayed at 135 mL. With a higher pressure to overcome and contractility held fixed, more blood remained after ejection.'
    },{
      prompt:'Two pressure–volume loops share the same filling volume and contractility. Aortic pressure changed briefly between the two beats.',
      headers:['Simulated beat','EDV (mL)','ESV (mL)','Aortic opening pressure (mm Hg)'],
      rows:[['X',128,58,91],['Y',128,43,70]],
      questions:[
        ['Which loop is wider on the volume axis?',['X, by 21 mL','They have the same width','Y, by 15 mL'],2],
        ['What accounts for the difference?',['Lower opening pressure permitted more complete ejection in Y','Higher filling volume stretched the ventricle in Y','A stronger contraction was required in X, so X ejected more'],0]
      ],
      why:'X ejects 70 mL and Y ejects 85 mL. Their widths differ by 15 mL. Y opens the valve against a lower pressure and ends with a smaller volume. These are first-beat comparisons with equal filling and contractility.'
    }
  ],
  'collecting-duct':[
    {
      prompt:'Two collecting ducts receive the same volume and solute load. ADH exposure and the number of available water channels are equally high. Compare water movement along a short medullary segment.',
      headers:['Preparation','Entering fluid (mOsm/kg)','Surrounding interstitium (mOsm/kg)'],
      rows:[['P',300,820],['Q',300,340]],
      questions:[
        ['With equal water permeability, which preparation initially reabsorbs more water?',['They reabsorb equal amounts','P','Q'],1],
        ['Which observation explains your prediction?',['ADH is higher in P','More filtrate enters Q','P has the larger interstitium-to-lumen osmotic difference'],2]
      ],
      why:'Both ducts are water-permeable. The initial osmotic difference is 520 mOsm/kg in P and 40 mOsm/kg in Q, giving water a stronger outward driving force in P. A high ADH level alone does not create that gradient.'
    },{
      prompt:'Two collecting ducts have identical entering tubular fluid and equally concentrated medullary interstitium. Only the ADH signal differs. Compare the short-term result at the same tubular delivery.',
      headers:['Preparation','ADH signal','Apical water channels'],
      rows:[['X','Low','Few'],['Y','High','Many']],
      questions:[
        ['Which preparation delivers more dilute fluid at a higher outflow rate?',['Y','Both have equal output','X'],2],
        ['Which evidence distinguishes the cause?',['The gradient is fixed while luminal membrane water permeability differs','Y has a smaller medullary gradient','X filters more plasma'],0]
      ],
      why:'In X, fewer apical water channels limit reabsorption despite the available osmotic gradient. More water remains in the lumen. In Y, higher permeability lets more water leave, lowering outflow and concentrating the remaining tubular fluid.'
    }
  ]
};
const sessionKeys=['initial','revisit'];
const recordKey=(kind,session,stage)=>kind+':'+sessionKeys[session]+':'+stage;

export function validMechanismRecord(key,record,kind){
  const match=/^(afterload|collecting-duct):(initial|revisit):(first|retry)$/.exec(key);
  return Boolean(match&&match[1]===kind&&record&&Number.isSafeInteger(record.at)&&record.at>=0&&
    (match[3]==='first'?typeof record.helped==='boolean':record.helped===true)&&
    Array.isArray(record.answers)&&record.answers.length===2&&record.answers.every(a=>Number.isInteger(a)&&a>=0&&a<3));
}

export function renderMechanismTransfer(kind){
  if(!cases[kind])return '';
  return '<section class="course-card mechanism-transfer" data-mechanism-transfer="'+kind+'"><h3>Try a new case</h3><div data-transfer-body></div></section>';
}

function responseSummary(item,record,title){
  const lines=item.questions.map(([prompt,options,key],i)=>{
    const choice=record.answers[i],correct=choice===key;
    return '<li>'+prompt+' <strong>'+options[choice]+'</strong> · '+(correct?'Correct':'Expected '+options[key])+'.</li>';
  });
  return '<details><summary>'+title+' · '+item.questions.filter((q,i)=>q[2]===record.answers[i]).length+'/2</summary><ul>'+lines.join('')+'</ul></details>';
}

export function mountMechanismTransfer(container,kind,store){
  const selector='[data-mechanism-transfer="'+kind+'"]';
  const host=container?.matches?.(selector)?container:container?.querySelector(selector);
  if(!host||host.dataset.transferMounted||!cases[kind])return;
  host.dataset.transferMounted='true';
  const body=host.querySelector('[data-transfer-body]'),memory=new Map(),spring=kind==='collecting-duct';
  const read=key=>store?(spring?store.read('mechanism:'+key):store.read().mechanismRecall?.[key]):memory.get(key);
  function save(key,value){
    if(!validMechanismRecord(key,value,kind))return;
    if(!store)memory.set(key,memory.get(key)||value);
    else if(spring){if(!read(key))store.write('mechanism:'+key,value);}
    else store.update(records=>{(records.mechanismRecall||={})[key]??=value;});
  }
  let session=0,open=false,retrying=false;
  function draw(focus=false){
    const item=cases[kind][session],first=read(recordKey(kind,session,'first')),retry=read(recordKey(kind,session,'retry'));
    const initial=read(recordKey(kind,0,'first')),due=initial?initial.at+days:0;
    const hasRevisit=read(recordKey(kind,1,'first'));
    const revisit=initial?'<p>'+ (hasRevisit?'Second case completed.':Date.now()>=due?'Your three-day recall check is ready.':'Suggested revisit · '+new Date(due).toLocaleDateString()+'. You can also try the second case early.')+'</p>':'';
    if(!open){
      body.innerHTML='<button type="button" data-case-open="0">'+(initial?'Review first case':'Open first case')+'</button>'+revisit+
        (initial?'<button type="button" data-case-open="1">'+(hasRevisit?'Review second case':'Open second case')+'</button>':'');
      for(const b of body.querySelectorAll('[data-case-open]'))b.onclick=()=>{session=Number(b.dataset.caseOpen);open=true;retrying=false;draw(true);};
      if(focus)body.querySelector('[data-case-open="'+session+'"]')?.focus();
      return;
    }
    const table='<div class="ap2-table-wrap"><table><caption>Case measurements</caption><thead><tr>'+item.headers.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+item.rows.map(row=>'<tr>'+row.map((v,i)=>i?'<td>'+v+'</td>':'<th scope="row">'+v+'</th>').join('')+'</tr>').join('')+'</tbody></table></div>';
    const form='<form data-case-response>'+item.questions.map(([prompt,options],i)=>'<fieldset><legend>'+prompt+'</legend>'+options.map((answer,j)=>'<label style="display:block"><input type="radio" required name="transfer-'+kind+'-'+i+'" value="'+j+'"> '+answer+'</label>').join('')+'</fieldset>').join('')+
      (retrying?'':'<label>How did you answer? <select data-case-help required><option value="">Choose</option><option value="alone">On my own</option><option value="helped">With help or notes</option></select></label>')+
      '<button type="submit">'+(retrying?'Check coached retry':'Check first response')+'</button></form>';
    const report=first?responseSummary(item,first,first.helped?'First response with help':'First response on my own')+(retry?responseSummary(item,retry,'Coached retry'):'')+
      '<p>'+item.why+'</p>'+(retry?'':'<button type="button" data-case-retry>Try again with feedback</button>'):'';
    const timing=session===1&&first&&initial?'<p>'+ (first.at>=due?'Recall completed at least three days after the first case.':'Second case completed before the three-day revisit.')+'</p>':'';
    body.innerHTML='<h4 tabindex="-1">'+(session?'Second case':'First case')+'</h4><p>'+item.prompt+'</p>'+table+(first&&!retrying?report+timing:form)+
      '<p><button type="button" data-case-close>Return to case choices</button></p>';
    if(focus)body.querySelector('h4').focus({preventScroll:true});
    body.querySelector('[data-case-close]').onclick=()=>{open=false;retrying=false;draw(true);};
    const retryButton=body.querySelector('[data-case-retry]');
    if(retryButton)retryButton.onclick=()=>{retrying=true;draw(true);};
    const response=body.querySelector('form');
    if(response)response.onsubmit=event=>{
      event.preventDefault();
      if(!response.reportValidity())return;
      const values=new FormData(response),answers=item.questions.map((_,i)=>Number(values.get('transfer-'+kind+'-'+i)));
      save(recordKey(kind,session,retrying?'retry':'first'),{answers,helped:retrying||response.querySelector('[data-case-help]').value==='helped',at:Date.now()});
      retrying=false;draw(true);
    };
  }
  draw();
}
