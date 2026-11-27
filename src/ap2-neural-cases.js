import {renderNeuralSpecimens, mountNeuralSpecimens} from './ap2-neural-specimens.js';
import {renderNeuralSignal, mountNeuralSignal} from './ap2-neural-signals.js';

const q=(prompt,choices,key,why)=>({prompt,choices,key,why});
const station=(name,observation,finding,reason)=>({name,observation,questions:[finding,reason]});
export const neuralCases={
  '12.2':[
    station('Compare myelinating cells','In micrograph A, processes from one glial cell wrap internodes on several axons. In B, one cell wraps one internode of a peripheral nerve fiber.',
      q('Which specimen shows a many-axon pattern?',['A','B','Neither'],0,'One oligodendrocyte can supply myelin to segments of multiple CNS axons.'),
      q('Which cell made the myelin in B?',['Astrocyte','Schwann cell','Satellite glial cell'],1,'A myelinating Schwann cell forms one internode on one PNS axon. Satellite glia support neuronal cell bodies in peripheral ganglia.'))],
  '12.5':[
    station('Follow a receptor potential','A taste receptor cell responds to a chemical with a graded voltage change and releases transmitter. A neighboring afferent neuron develops a graded postsynaptic response.',
      q('Where is the initial receptor potential?',['In the taste receptor cell','In the postsynaptic neuron only','In a node of Ranvier'],0,'A separate sensory receptor cell can change its voltage and release transmitter onto an afferent.'),
      q('In a skin sensory neuron, what is a graded depolarization at its own sensory ending called?',['Inhibitory postsynaptic potential','Action potential','Generator potential'],2,'A generator potential arises at the sensory ending of the afferent itself and can initiate spikes if threshold is reached.')),
    station('Same transmitter, different receptor','Acetylcholine opens cation channels at a skeletal motor end plate. In a cardiac pacemaker, ACh acting through M2 receptors can increase potassium conductance.',
      q('What differs between these responses?',['The transmitter is different','The receptor and its coupled channels differ','Both cells must fire a skeletal muscle action potential'],1,'Receptor subtype and coupling determine which channels change their conductance.'),
      q('Which effect fits increased K⁺ conductance at the pacemaker?',['Voltage moves toward the K⁺ equilibrium potential and pacing slows','Rapid opening of every skeletal nicotinic channel','Transmitter release must reverse direction'],0,'Greater K⁺ conductance can hyperpolarize the pacemaker. Receptor expression helps explain different effects of the same chemical.'))],
  '13.3':[
    station('Compare ventricular spaces','On successive sections both lateral ventricles and the third ventricle are enlarged. The fourth ventricle is of usual size.',
      q('Where does the change stop?',['Before the third ventricle','Between the third and fourth ventricles','After the fourth ventricle'],1,'The third ventricle is upstream of the change. The fourth is downstream.'),
      q('Which interruption best accounts for this pattern?',['Aqueduct obstruction','Right interventricular foramen obstruction','Reduced absorption at arachnoid granulations alone'],0,'The cerebral aqueduct connects the third and fourth ventricles. An isolated block backs up CSF in both lateral ventricles and the third.')),
    station('Compare vascular and CSF patterns','A fictional record describes sudden unilateral weakness. An image shows a focal region of reduced perfusion and normally sized ventricles.',
      q('Which observation identifies the affected process?',['Both lateral ventricles are enlarged','Flow through the aqueduct is absent','A focal area receives less blood'],2,'Perfusion describes delivery of blood to tissue.'),
      q('Which mechanism fits the observation?',['Blocked CSF outflow alone','Ischemia in a vascular territory','Excess CSF production alone'],1,'An interrupted arterial supply can produce a focal deficit. These findings alone do not establish whether a clot formed locally or traveled.'))],
  '14.2':[
    station('Trace a visual field','With either eye tested separately, a fictional learner misses targets in the left half of space. The right half remains visible.',
      q('Which field is missing?',['Left visual field of both eyes','Left eye only','Temporal field of both eyes'],0,'The missing half stays on the same side of space when either eye is covered.'),
      q('Which route carries that field after the chiasm?',['Left optic tract','Right optic tract','Left optic nerve alone'],1,'Left visual space projects to the right half of both retinas. Left nasal retinal fibers cross and right temporal retinal fibers stay on the same side.'))],
  '14.1':[
    station('Reverse the focus change','A learner looks up from close print to a distant sign. Assume normal accommodation.',
      q('How should the lens change?',['Thicken','Flatten','Move outside the pupil'],1,'A flatter lens has less refractive power for distance.'),
      q('What initiates that change?',['Ciliary relaxation increases zonular tension','Ciliary contraction increases zonular tension','Contraction of extraocular muscles pulls on the lens'],0,'As the ciliary muscle relaxes, tension exerted through the zonules flattens the elastic lens.'))],
  '15.1':[
    station('Adrenal relay','A sympathetic preganglionic axon ends on a chromaffin cell. A blood sample subsequently contains more epinephrine.',
      q('Where does this effector release its product?',['Into a synaptic cleft on a muscle','Into the circulation','Into the ventricular CSF'],1,'Chromaffin cells of the adrenal medulla secrete catecholamines into blood.'),
      q('Which signal activates the chromaffin cell?',['Norepinephrine at β1 receptors','Acetylcholine at muscarinic receptors','Acetylcholine at nicotinic receptors'],2,'Chromaffin cells are modified sympathetic postganglionic cells. They receive preganglionic cholinergic input.'))],
  '15.2':[
    station('Local digestive reflex','A distended segment of isolated gut still develops coordinated local contraction when extrinsic autonomic connections are interrupted.',
      q('Which part of the response persists?',['Local peristaltic activity','A conscious withdrawal movement','A spinal stretch reflex'],0,'Gut wall sensory neurons, interneurons and motor neurons can form a local reflex.'),
      q('Why can it persist?',['The vagus has its cell bodies inside the gut','Enteric plexuses can complete the short reflex','Every visceral sensory signal crosses the medulla'],1,'A short reflex can be integrated within the gut wall. Extrinsic autonomic pathways modulate it and participate in long reflexes.'))],
  '15.3':[
    station('Compare control centers','During warming, hypothalamic circuits increase sweating. A sudden fall in blood pressure also increases heart rate through a rapid brainstem reflex.',
      q('Which observation represents thermal regulation?',['Sweating increases with warming','Heart rate rises with falling pressure','Skeletal muscle contracts voluntarily'],0,'Sweat evaporation promotes cooling.'),
      q('Which pairing best explains the integration?',['Cerebellum for both responses','Medulla for thermal set point and cortex for baroreflex','Hypothalamus for thermal control and medulla for baroreflex'],2,'Hypothalamic networks coordinate temperature effectors. Medullary cardiovascular centers integrate baroreceptor input.'))],
  '15.4':[
    station('Predict a receptor blockade','A simulated block acts only at muscarinic receptors on effectors. Autonomic ganglionic transmission remains intact.',
      q('Which pair should respond less to neural stimulation?',['Adrenal medulla and skeletal muscle','Sweat glands and vagally controlled cardiac pacemaker cells','Skeletal muscle and sympathetic cardiac pacemaker cells'],1,'Eccrine sweat glands receive sympathetic cholinergic input. Vagal cardiac terminals also release ACh onto muscarinic receptors.'),
      q('Which pathway still accelerates heart rate in this model?',['Sympathetic norepinephrine at β1','Vagal acetylcholine at M2','Preganglionic acetylcholine at cardiac muscarinic receptors'],0,'Sympathetic cardiac postganglionic fibers release norepinephrine onto β1 receptors.'))],
  '16.1':[
    station('Localize from distribution','A subject follows spoken commands. A smile is asymmetric and the arm and leg are weak on that same side of the body.',
      q('Which description is a direct observation?',['An embolus came from the heart','A wrist nerve is cut','Face, arm and leg movement differ by side'],2,'The distribution can be recorded without naming a cause.'),
      q('Which site warrants investigation first?',['A single digital nerve','Central motor pathways','An isolated ankle tendon'],1,'A single distal peripheral nerve cannot account for ipsilateral face, arm and leg weakness. Imaging and further assessment would be needed to establish cause.'))],
  '16.2':[
    station('New learning after onset','A person immediately repeats three words and recalls childhood events. After an unrelated task they cannot recall the new words. Hearing and command-following are intact.',
      q('Which ability did this test show was initially intact?',['Immediate registration','Formation of lasting episodic memories','Retrieval of the three words after delay'],0,'Accurate immediate repetition shows the words were received and briefly retained.'),
      q('Which pattern does this illustrate?',['Retrograde loss confined to childhood','Impaired formation of new declarative memories','Loss of previously learned motor skills'],1,'An anterograde pattern concerns new memories after onset. A single brief task illustrates a pattern and cannot establish a diagnosis.')),
    station('Past and present','After an injury, a fictional subject learns the name of a new examiner over several visits but cannot recall a previously familiar event just before the injury.',
      q('Which material is affected?',['Material acquired after injury','Immediate repetition of numbers','Memories acquired before injury'],2,'The event occurred before the onset of the injury.'),
      q('Which description fits?',['Retrograde amnesia','Anterograde amnesia','Expressive aphasia'],0,'Retrograde amnesia affects access to memories formed before onset.'))],
  '16.3':[
    station('Track the gaze','A fictional subject follows a target to their right. The right eye fails to move laterally while the left eye adducts.',
      q('Which movement is limited?',['Right abduction','Left abduction','Right adduction'],0,'The right eye should move away from the nose as it follows a target to the right.'),
      q('Which nerve innervates the muscle producing that movement?',['Right CN III','Right CN IV','Right CN VI'],2,'The abducens nerve supplies the lateral rectus. An observation localizes the movement to test and does not distinguish every possible cause.')),
    station('Lower the adducted eye','Eye movements are compared while looking inward toward the nose. On one side the eye has difficulty looking downward from that position.',
      q('Which combined position exposes the deficit?',['Abduction then elevation','Adduction then depression','Central gaze alone'],1,'Depression in an adducted eye emphasizes the superior oblique.'),
      q('Which cranial nerve supplies the principal muscle being tested?',['Trochlear, CN IV','Abducens, CN VI','Optic, CN II'],0,'CN IV supplies the superior oblique. CN VI supplies lateral rectus and CN II carries visual afferents.'))],
  '16.4':[
    station('Compare motor findings','Right ankle strength is reduced. Tone is increased, tendon reflexes are brisk, and the great toe extends with plantar stimulation in an adult.',
      q('Which pair is directly observed?',['Low tone and absent reflexes','Increased tone and brisk reflexes','Normal force and reduced sensation'],1,'Strength, tone and reflexes sample different aspects of motor function.'),
      q('Which pattern fits this established lesion?',['Lower motor neuron loss in the tested arc','Isolated skin receptor loss','Reduced descending upper motor neuron control'],2,'An established upper motor neuron lesion can combine weakness, increased tone, brisk reflexes and an extensor plantar response.')),
    station('Compare sensory modalities','Below a thoracic cord lesion, vibration is reduced on the right. Pain and temperature are reduced on the left beginning a few segments below.',
      q('Which modality is reduced on the right?',['Pain','Temperature','Vibration'],2,'The right lower-body dorsal column carries vibration and position signals.'),
      q('Which side of the cord best fits both findings?',['Right','Left','Neither, because both pathways cross in the medulla'],0,'Dorsal column fibers cross in the medulla. Pain and temperature fibers cross near entry and then ascend on the opposite side.'))],
  '16.5':[
    station('Reaching for a target','Strength and position sense are comparable on both sides. Repeated right-hand reaches pass beyond a visible target and correct back toward it.',
      q('What do you observe?',['Consistent overshoot and correction','Failure to generate force','Visual field loss'],0,'Overshooting a target is a spatial scaling error called hypermetria, a form of dysmetria.'),
      q('Which coordination system should be compared next?',['Contralateral visual cortex only','Ipsilateral cerebellar limb circuits','Ipsilateral olfactory tracts'],1,'Cerebellar hemisphere dysfunction commonly affects coordination on the same side. Compare other cerebellar tasks and the opposite limb.')),
    station('Balance with and without vision','A subject stands steadily with eyes open and sways substantially more with eyes closed.',
      q('Which change is directly observed?',['Wider steps with both eyes open','Variation in foot strength','Instability increases with eye closure'],2,'Removing visual input unmasks reliance on visual compensation.'),
      q('Which inputs warrant further comparison?',['Proprioceptive and vestibular signals','Olfaction and taste','Auditory signal strength alone'],0,'A positive Romberg pattern suggests visual compensation for impaired proprioceptive or vestibular input. It does not distinguish those causes alone.')),
    station('Observe the base of gait','During forward walking with eyes open, the subject steps with a broad base and irregular lateral foot placement. Strength is sufficient to support body weight.',
      q('Which observation describes the gait?',['Broad base with variable step placement','Normal tandem walking','Isolated failure to lift the great toe'],0,'The base of support is wide and the step positions vary from side to side.'),
      q('Which follow-up would help assess a cerebellar contribution?',['Measure smell threshold','Compare truncal stability and limb coordination','Repeat only a patellar tap'],1,'Midline cerebellar dysfunction can produce truncal instability and a wide-based gait. The gait pattern alone is nonspecific.'))]
};

const controlsCss='<style>.neuro-station,.neuro-specimen,.neuro-signal{margin:.85rem 0;padding:.8rem 1rem;border:1px solid #47605f;border-radius:.7rem;color:#e7eee9;background:#17292c;min-width:0}.neuro-station h3,.neuro-specimen h3,.neuro-signal h3{margin:0 0 .35rem}.neuro-station p,.neuro-specimen p,.neuro-signal p{line-height:1.45;margin:.45rem 0}.neuro-station select,.neuro-specimen select,.neuro-signal select,.neuro-station button,.neuro-specimen button,.neuro-signal button{max-width:100%;min-height:40px;padding:.35rem .65rem;background:#1a363a;color:#edf4eb;border:1px solid #59797c;border-radius:6px;font:inherit}.neuro-station label,.neuro-specimen select,.neuro-signal select{display:block}.neuro-station label{margin:.45rem 0}.neuro-station output{display:block;color:#c9e9cb;margin:.35rem 0}.neuro-station svg,.neuro-signal svg{display:block;width:100%;max-width:35rem;max-height:14rem;background:#102226;border-radius:.45rem;margin:.5rem auto}.neuro-specimen [hidden],.neuro-signal [hidden],.neuro-station [hidden]{display:none!important}.neuro-station button:focus-visible,.neuro-signal button:focus-visible,.neuro-specimen button:focus-visible{outline:3px solid #f3c385}.neuro-station .course-actions,.neuro-specimen .course-actions,.neuro-signal .course-actions{display:flex;gap:.4rem;flex-wrap:wrap;align-items:end;margin:.4rem 0}</style>';
neuralCases['16.3'].push(neuralCases['14.2'][0]);
const followUps={
  '16.1':['Compare facial, arm and leg strength by side and map sensation. Use the distribution to refine the localization.'],
  '16.2':['Test recognition after a delay and repeat with another list after confirming attention.','Compare recent and remote autobiographical events against a corroborated timeline.'],
  '16.3':['Compare conjugate gaze with each eye examined separately, and check pupil responses.','Compare depression of each adducted eye, then compare down-gaze with eyes abducted.','Map the four quadrants in each eye separately while fixation stays central.'],
  '16.4':['Compare tone, tendon reflexes and plantar responses on both sides.','Compare pinprick with vibration at several levels on both sides, including above the proposed lesion.'],
  '16.5':['Compare finger-to-nose on the opposite side and repeat after checking vision, sensation and strength.','Compare joint-position sense with vestibular signs to distinguish contributors to balance.','Compare truncal stability and reaching accuracy on both sides, then review sensory findings.']
};
function visualField(front){
  const left=front?218:70,right=front?70:218;
  return '<svg viewBox="0 0 288 100" role="img" aria-label="Fictional subject, '+(front?'facing you':'viewed from behind')+'. The left half of each eye’s tested field is lost.">'+
    [left,right].map((x,i)=>'<circle cx="'+x+'" cy="44" r="26" fill="#94bcac"/><path d="M'+x+' 18 a26 26 0 0 '+(front?'1':'0')+' 0 52Z" fill="#624646"/><path d="M'+x+' 17v54" stroke="#fff" stroke-dasharray="3 3"/><text x="'+x+'" y="91" text-anchor="middle" fill="#e8eee6" font-size="12">Subject’s '+(i?'R':'L')+' eye</text>').join('')+'</svg>';
}
export {controlsCss as neuralLabStyles};
export function renderNeuralCases(id){
  const entries=neuralCases[id]||[];
  const form=entries.length?'<section class="neuro-station" data-neuro-cases="'+id+'"><h3>Observation station</h3><label>Case <select data-case-index>'+entries.map((c,i)=>'<option value="'+i+'">'+c.name+'</option>').join('')+'</select></label><div data-case-body></div></section>':'';
  return (form?controlsCss+form:'')+(id==='16.3'?renderNeuralSpecimens(id):'')+(id.startsWith('15.')?renderNeuralSignal(id):'');
}
function motionObservation(i){
  if(i===1)return '';
  const path=i===0?'M30 95 Q100 80 167 71 T269 50 Q289 45 279 49 T241 58':'M48 79 L83 25 L132 93 L167 20 L204 93 L256 20 L285 78';
  const title=i===0?'Right hand position relative to the fixed target':'Alternating foot contact positions seen from above';
  const points=i===0?'<circle cx="241" cy="58" r="10" fill="none" stroke="#fff"/>':'<path d="M22 55H301" stroke="#849898" stroke-dasharray="4 5"/>';
  const url='?motionMode=activities&amp;motionActivity='+(i===0?'reach-forward':'walking')+'#motion';
  return '<figure><svg viewBox="0 0 320 112" role="img" aria-label="'+title+'">'+points+'<path d="'+path+'" fill="none" stroke="#95aeae" stroke-dasharray="3 5"/><circle data-moving-point r="7" fill="#ffc27f"><animateMotion dur="3s" begin="indefinite" fill="freeze" path="'+path+'"/></circle></svg><figcaption>'+title+'. Dotted line shows the whole illustrative record.</figcaption></figure><div class="course-actions"><button type="button" data-replay>Replay observation</button><a href="'+url+'">Compare the normal movement in the 3D Motion Lab ↗</a></div>';
}
export function mountNeuralCases(root,id){
  if(!root)return;
  if(id.startsWith('15.'))mountNeuralSignal(root,id);
  if(id==='16.3')mountNeuralSpecimens(root);
  const host=root.querySelector('[data-neuro-cases="'+id+'"]');
  if(!host||host.dataset.mounted)return;
  host.dataset.mounted='true';
  const selector=host.querySelector('[data-case-index]'),body=host.querySelector('[data-case-body]');
  function draw(){
    const i=Number(selector.value),c=neuralCases[id][i];
    body.innerHTML='<p>'+c.observation+'</p>'+(id==='16.5'?motionObservation(i):'')+c.questions.map((question,j)=>'<div data-question="'+j+'"'+(j?' hidden':'')+'><label>'+question.prompt+' <select><option value="">Choose a response</option>'+question.choices.map((choice,k)=>'<option value="'+k+'">'+choice+'</option>').join('')+'</select></label><button type="button">Check '+(j?'interpretation':'observation')+'</button><output aria-live="polite"></output></div>').join('');
    if(id==='16.2'){
      const ol=document.createElement('ol'),timeline=i?['Before injury · remembers an event while it is occurring.','Injury occurs.','After injury · learns a new name.','Later · cannot recall the event from just before the injury.']:['Before onset · established memories are available.','After onset · hears three words and repeats them immediately.','Intervening task · attention shifts.','Delayed recall · the new words cannot be retrieved.'];
      ol.setAttribute('aria-label','Memory timeline');for(const moment of timeline){const li=document.createElement('li');li.textContent=moment;ol.append(li);}
      body.querySelector('[data-question]').before(ol);
    }
    if(id==='14.2'||id==='16.3'&&i===2){
      const view=document.createElement('div');
      view.innerHTML='<div data-field-drawing></div><p>Shading marks the missing visual field in subject coordinates. These circles show visual fields.</p><button type="button" data-field-view aria-pressed="false">View from in front</button>';
      body.querySelector('[data-question]').before(view);
      let front=false;const field=view.querySelector('[data-field-drawing]'),flip=view.querySelector('button');
      field.innerHTML=visualField(front);
      flip.onclick=()=>{front=!front;field.innerHTML=visualField(front);flip.setAttribute('aria-pressed',String(front));flip.textContent=front?'View from behind':'View from in front';};
    }
    const replay=body.querySelector('[data-replay]');
    if(replay){const dot=body.querySelector('[data-moving-point]'),motion=dot.querySelector('animateMotion'),svg=dot.ownerSVGElement;
      if(typeof motion.beginElement==='function'){motion.beginElement();svg.pauseAnimations();replay.onclick=()=>{svg.unpauseAnimations();motion.beginElement();};}else replay.hidden=true;
    }
    const firstAttempts=[];
    const result=document.createElement('p');result.setAttribute('aria-live','polite');body.append(result);
    const steps=[...body.querySelectorAll('[data-question]')];
    for(const [j,block] of steps.entries()){
      const s=block.querySelector('select'),out=block.querySelector('output'),question=c.questions[j];
      block.querySelector('button').onclick=()=>{
        if(s.value===''){out.textContent='Choose a response first.';return;}
        if(firstAttempts[j]===undefined)firstAttempts[j]=+s.value===question.key;
        if(+s.value!==question.key){out.textContent=j?'Reconsider the mechanism using the recorded finding. You can try again.':'Compare the choices with the observation in the record. You can try again.';return;}
        out.textContent='Correct. '+question.why;
        if(steps[j+1])steps[j+1].hidden=false;
        else {
          result.textContent='First try · observation '+Number(firstAttempts[0])+'/1 · interpretation '+Number(firstAttempts[1])+'/1.';
          if(followUps[id]&&!body.querySelector('details')){const d=document.createElement('details');d.innerHTML='<summary>What would you examine next?</summary><p>'+followUps[id][i]+'</p>';body.append(d);}
        }
      };
    }
  }
  selector.onchange=draw;draw();
}

