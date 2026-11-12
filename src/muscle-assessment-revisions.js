// Metadata corrections never change stored answer keys or response snapshots.
const objectives={
 'mx-a-band':['10.2.3'],'mx-b-band':['10.2.3'],
 'mx-a-twitch':['10.4.3'],'mx-b-treppe':['10.4.4'],
 'mx-a-unfused':['10.4.4'],'mx-b-fused':['10.4.4'],'mx-b-summation':['10.4.4'],
 'mx-a-recruit':[],'mx-written-recruitment':[],
 'ex-10.4-13':[],'ex-10.4-14':[],'ex-10.4-15':[],'ex-10.4-20':[],
 'ex-10.5-6':[],'ex-10.5-7':[],'ex-10.5-8':[],
 'ex-10.6-5':[],'ex-10.6-6':[],'ex-10.7-8':[],'ex-10.9-6':[],
 'mx-written-atp':['10.3.2'],'mx-written-knee':['11.6.2'],
};
const aliases={
 'ex-10.4-10':['Latent','Latency period'],
 'ex-11.1-11':['3rd class lever','3rd class','Class III lever','Class III','Third-order lever'],
 'ex-11.3-15':['Erector spinae muscles','Sacrospinalis'],
 'ex-11.5-2':['Rhomboid minor and rhomboid major','Rhomboid minor and major','Rhomboideus major and minor'],
 'ex-11.6-15':['Achilles'],
};
const alternatives={
 'ex-10.2-22':['Calcium binding to troponin after an otherwise normal muscle action potential','ATP-dependent calcium reuptake after an otherwise normal contraction','Force transmission from an electrically activated fiber through its tendon'],
 'ex-10.2-23':['Calcium stored inside the terminal cisternae','Acetylcholine released from the motor nerve terminal','Contractile force transmitted by the connective sheaths'],
 'ex-10.3-4':['Detachment of myosin before ATP binds','Exposure of actin sites by moving tropomyosin directly','Transport of calcium into the reticulum by the myosin head'],
 'ex-10.3-10':['Calcium directly splits ATP at every myosin head','Calcium pumps provide all energy for myosin detachment','ATP exposes actin sites while calcium powers the stroke'],
 'ex-10.5-4':['Large glycogen stores with few mitochondria and low myoglobin','Fast myosin with sparse capillaries and low oxidative capacity','Large fiber diameter with low mitochondrial density and few capillaries'],
 'ex-10.6-5':['More contractile protein without an increase in oxidative support','Lower capillary density with reduced oxygen delivery','Replacement of mitochondrial ATP production by phosphagen stores alone'],
 'ex-11.5-15':['Its motor neuron pulls the distal phalanx directly','Its contraction shortens a ligament running from the wrist to the finger','Its force moves the radius, while the finger joints remain fixed'],
};
const feedback={
 'ex-10.2-22':['Troponin regulation is downstream of the muscle action potential; receptor blockade first prevents normal end-plate depolarization.','Calcium reuptake is a later relaxation process, not the receptor-mediated event directly blocked here.','A receptor block interrupts signaling; it does not directly sever the mechanical tendon connection.'],
 'ex-10.2-23':['The terminal cisternae store calcium; T-tubules conduct membrane excitation beside them.','Acetylcholine crosses the extracellular synaptic cleft; it does not travel down T-tubules.','Connective sheaths transmit mechanical force; T-tubules are inward extensions of the excitable membrane.'],
 'ex-10.3-4':['ATP binding enables detachment; subsequent hydrolysis re-energizes the detached head.','Troponin and tropomyosin regulate access to actin sites in response to calcium.','Calcium reuptake uses SR pumps, not transport by the myosin motor head.'],
 'ex-10.3-10':['Myosin ATPase hydrolyzes ATP; calcium binding to troponin regulates thin-filament access.','Calcium pumps support relaxation, while ATP binding to myosin enables cross-bridge detachment.','This reverses the roles: calcium regulates access, while ATP supports cycling and ion transport.'],
 'ex-10.5-4':['Large glycogen stores with low oxidative support fit brief glycolytic activity better than sustained oxidative activity.','Fast myosin alone does not supply oxygen; capillaries and oxidative capacity support sustained activity.','Large diameter alone does not provide the mitochondrial and oxygen-delivery support needed for oxidative activity.'],
 'ex-10.6-5':['Added contractile protein can support hypertrophy; improved endurance particularly involves oxidative support.','Lower capillary density would reduce the oxygen-delivery support important for endurance.','Phosphagen stores provide brief rapid support and cannot replace sustained oxidative ATP regeneration.'],
 'ex-11.5-15':['Motor neurons activate muscle fibers; they do not mechanically pull the phalanges.','A tendon transmits muscle force; a ligament is not the ordinary continuation of a finger-flexor muscle.','Extrinsic finger-flexor tendons cross joints into the digits, so force can directly affect the finger joints.'],
};
export function reviseMuscleAssessment(q){
 if(!/^1[01]\./.test(q.lesson))return q;
 const next={...q,assessmentFacets:q.assessmentFacets||[q.figure?'identification':q.type==='written'?'explanation':['match','order'].includes(q.type)?'relationships':'recall']};
 if(Object.hasOwn(objectives,q.id)){next.objectives=objectives[q.id];next.objectiveNote='Mapping audited against the task actually requested; related section content does not automatically earn objective coverage.';}
 if(aliases[q.id])next.aliases=[...new Set([...(q.aliases||[]),...aliases[q.id]])];
 if(alternatives[q.id]){next.legacyDistractors=[...new Set([...(q.legacyDistractors||[]),...q.distractors])];next.distractors=alternatives[q.id];next.distractorFeedback=Object.fromEntries(next.distractors.map((option,i)=>[option,feedback[q.id][i]]));}
 return next;
}
