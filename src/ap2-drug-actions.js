const sites=['Nicotinic receptors on ganglionic neurons','α1 receptors on arteriolar muscle','β1 receptors on pacemaker cells','M2 receptors on pacemaker cells'];
const classes=['Sympathomimetic · mimics sympathetic signaling','Sympatholytic · reduces sympathetic signaling','Ganglionic cholinergic agonist · acts in both divisions','Parasympatholytic at this effector'];
const trials=[
  {name:'Contractile vessel response',prompt:'A test compound activates adrenergic receptors on arteriolar smooth muscle. Compare with the same vessel before exposure.',site:1,group:0,effects:['Local constriction','Local dilation','Loss of transmission through autonomic ganglia'],answer:0,why:'A direct α1 agonist mimics sympathetic vasoconstrictor signaling and narrows the arteriole. The intact circulation can recruit a pressure reflex.'},
  {name:'Sympathetic pacemaker drive',prompt:'The sinoatrial node is receiving sympathetic input. A test compound selectively prevents norepinephrine from activating its β1 receptors.',site:2,group:1,effects:['Stronger sympathetic acceleration','Reduced response to sympathetic drive','Block of all cardiac sensory input'],answer:1,why:'Blocking β1 receptors is sympatholytic at the sinoatrial node. It blunts sympathetic acceleration. Residual rate also depends on intrinsic pacemaker activity and vagal input.'},
  {name:'Vagal slowing',prompt:'A test compound prevents acetylcholine from activating its usual effector receptor at a sinoatrial node receiving vagal input.',site:3,group:3,effects:['Enhanced vagal slowing','Loss of both ganglionic relays','Release from vagal slowing'],answer:2,why:'At the pacemaker, blocking M2 receptors removes part of the resting vagal brake. A faster rate in this experiment does not establish that the compound activated an adrenergic receptor.'},
  {name:'Acute nicotine signal',prompt:'A brief nicotine exposure excites autonomic ganglionic neurons. Compare its first site of action with the later response of a resistance vessel.',site:0,group:2,effects:['Preferential vagal dilation in most systemic resistance vessels','Excitation of adrenergic effector receptors by nicotine itself','Increased sympathetic vasoconstrictor drive can raise arterial pressure'],answer:2,why:'Nicotine activates neuronal nicotinic acetylcholine receptors in both autonomic divisions and can stimulate adrenal chromaffin cells. Most systemic resistance vessels have predominantly sympathetic vasomotor innervation. The cardiovascular response depends on autonomic tone, reflexes and exposure.'}
];
export {trials as drugTrials};
const select=(id,label,options)=>'<label>'+label+' <select '+id+'><option value="">Choose</option>'+options.map((s,i)=>'<option value="'+i+'">'+s+'</option>').join('')+'</select></label>';
export function renderDrugs(){return '<section class="neuro-station" data-sensory-detail="drug-actions"><h3>Locate and classify an autonomic drug action</h3><label>Experiment <select data-drug-trial>'+trials.map((t,i)=>'<option value="'+i+'">'+t.name+'</option>').join('')+'</select></label><div data-drug-body></div></section>';}
export function mountDrugs(host){
  const picker=host.querySelector('[data-drug-trial]'),body=host.querySelector('[data-drug-body]');
  function draw(){
    const trial=trials[+picker.value];
    body.innerHTML='<p>'+trial.prompt+'</p><div class="reg-controls">'+select('data-site','1 · Receptor and location',sites)+select('data-class','2 · Functional class',classes)+select('data-effect','3 · Expected effect',trial.effects)+'</div><button type="button" data-compare-drug>Check the pathway</button><p role="status"></p>';
    body.querySelector('button').onclick=()=>{
      const [site,group,effect]=[...body.querySelectorAll('select')].map(c=>c.value);
      const note=body.querySelector('[role=status]');
      if([site,group,effect].includes('')){note.textContent='Choose a receptor, a class and an effect first.';return;}
      const match=+site===trial.site&&+group===trial.group&&+effect===trial.answer;
      note.textContent=(match?'Correct. ':'Expected: '+sites[trial.site]+'. '+classes[trial.group]+'. '+trial.effects[trial.answer]+'. ')+trial.why;
    };
  }
  picker.onchange=draw;draw();
}

