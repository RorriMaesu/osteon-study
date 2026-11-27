const route=(name,labels,notes)=>({name,labels,notes});
const text=(x,y,s,size=11)=>'<text fill="#dce7dd" x="'+x+'" y="'+y+'" font-size="'+size+'" text-anchor="middle">'+s+'</text>';
const path=(d,color='#b7d0c0',width=3)=>'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round"/>';
const dot=(x,y,r=6,color='#f6b779')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+'"/>';
export const routeSignals={
  '13.3':{title:'Compare cerebral arterial routes',modes:[
    route('Anterior circulation',['Common carotid','Internal carotid','Middle cerebral artery','Cortical branches'],['Carotid blood travels up the neck.','The internal carotid enters the skull and contributes to the cerebral arterial circle.','The middle cerebral artery supplies much of the lateral hemisphere. It branches from the internal carotid and is outside the arterial circle itself.','Interruption can impair tissue perfusion downstream, with deficits depending on the affected territory.']),
    route('Posterior circulation',['Subclavian','Vertebral arteries','Basilar artery','Posterior cerebral arteries'],['Each vertebral artery arises from a subclavian artery.','The vertebral arteries enter via the foramen magnum.','They unite into the basilar artery on the ventral pons.','The basilar artery ends in the paired posterior cerebral arteries, which supply much of the occipital cortex.'])]},
  '14.1':{title:'How the ear transduces movement',modes:[
    route('Sound pressure',['Air pressure','Ossicular motion','Oval window','Traveling wave','Hair-cell signal'],['Alternating air pressure moves the tympanic membrane.','The malleus, incus and stapes transmit vibration through the air-filled middle ear.','The stapes footplate displaces cochlear fluid. The round window accommodates pressure changes.','A traveling displacement of the cochlear partition peaks at a frequency-dependent site. This schematic unrolls the cochlea.','Shear at the organ of Corti bends stereocilia. A graded receptor potential changes transmitter release onto afferent fibers.']),
    route('Angular acceleration',['Head at rest','Head starts rotating','Endolymph lags','Cupula deflects','Steady rotation'],['The cupula projects into the ampulla at the end of a semicircular duct.','When the head starts rotating in the plane of a duct, the duct moves with the head.','Fluid inertia initially produces relative motion opposite the angular acceleration.','Pressure across the cupula bends the hair bundles. The response depends on direction and on which duct is examined.','During sustained constant-speed rotation, relative fluid motion decays and the cupula returns toward rest.']),
    route('Linear acceleration',['At rest','Head accelerates','Otolith layer lags','Hair bundles deflect','Velocity constant'],['The otolithic membrane contains dense calcium carbonate crystals called otoconia.','In this example the head accelerates to the right without tilting.','Inertia displaces the heavier otolithic layer to the left relative to the sensory epithelium.','Relative displacement bends hair bundles and changes afferent firing.','Once acceleration ceases, this horizontal inertial deflection subsides. The organs also respond to gravity.'])]},
  '15.1':{title:'Follow the autonomic output',modes:[
    route('Sympathetic · cardiac',['Thoracolumbar','Chain ganglion','Nerve ending','Pacemaker'],['A preganglionic cell body lies in the thoracolumbar cord.','Preganglionic ACh activates nicotinic receptors in a sympathetic ganglion.','A postganglionic axon releases norepinephrine.','β1 receptors in pacemaker cells mediate an increased heart rate in this example.']),
    route('Sympathetic · eccrine sweat',['Thoracolumbar','Chain ganglion','Nerve ending','Sweat gland'],['The pathway begins in the thoracolumbar cord.','Preganglionic ACh activates nicotinic receptors.','This sympathetic postganglionic axon releases ACh.','Effector muscarinic receptors mediate sweat secretion.']),
    route('Parasympathetic · cardiac',['Brainstem','Cardiac ganglion','Nerve ending','Pacemaker'],['Preganglionic axons travel in the vagus.','ACh activates nicotinic receptors near the heart.','A short postganglionic axon releases ACh close to the target.','M2 muscarinic receptors on the pacemaker slow the rate.']),
    route('Adrenal medulla',['Thoracolumbar','Chromaffin cell','Bloodstream','Distant targets'],['A preganglionic sympathetic axon projects to the adrenal medulla.','ACh activates nicotinic receptors on a chromaffin cell.','Chromaffin cells release chiefly epinephrine and some norepinephrine into blood. The droplets represent circulating hormones.','Circulation carries catecholamines to targets expressing adrenergic receptors.'])]},
  '15.2':{title:'Compare digestive reflex circuits',modes:[
    route('Short enteric reflex',['Distension','Enteric integration','Enteric motor output','Local contraction'],['Distension activates sensory neurons in the gut wall.','Interneurons in the enteric plexuses integrate a local signal.','Enteric motor neurons act on nearby smooth muscle.','A local motor response can continue without a CNS relay.']),
    route('Long vagovagal reflex',['Gut afferent','Medulla','Vagal efferent','Enteric effector'],['Sensory axons in the vagus carry visceral input from the gut.','Brainstem circuits integrate the sensory input.','Preganglionic vagal fibers return to enteric ganglia.','Enteric motor circuits coordinate the response in gastric smooth muscle.'])]}
};
function nodes(seq,i,mode,id){
  const x=[31,103,176,248];
  let s=path('M31 50H248','#658982',3);
  for(let j=0;j<x.length;j++){
    if(id==='15.1'&&j===2&&mode===3){
      for(const [dx,dy] of [[-6,-4],[3,5],[8,-3]])s+=dot(x[j]+dx,50+dy,3,j===i?'#f6b779':'#83aba5');
    }else if(id==='15.1'&&j===2){
      s+=path('M'+(x[j]-10)+' 50h10l8 -7m-8 7 8 7',i===j?'#f6b779':'#83aba5',4);
    }else s+=dot(x[j],50,j===i?9:6,j===i?'#f6b779':'#83aba5');
    s+=text(x[j],j%2?85:28,seq.labels[j],8);
  }
  return s+text(140,107,'Signal route · schematic');
}
function ear(mode,i){
  if(mode===0){
    const wave=[0,0,2,8,4][i];
    let partition='M88 57';for(let x=89;x<=246;x++)partition+=' L'+x+' '+(57+wave*Math.sin((x-85)/8)*Math.exp(-(((x-164)/48)**2))).toFixed(2);
    return path('M10 64q12 -16 22 0m3 -10v35M38 65l11 -12 8 7 10 -13 12 10','#c0d4c6',3)+path('M85 46 Q164 20 248 47 Q266 58 248 68 Q174 91 87 66','#86c8c6',4)+path(partition,'#eeb988',3)+dot([19,54,85,164,175][i],[62,55,58,57,62][i],5)+text(48,109,'Middle ear')+text(178,109,'Unrolled cochlea');
  }
  if(mode===1){
    const bend=[0,0,-5,-13,-1][i];
    return path('M146 78 C76 89 58 21 126 22 C184 20 203 67 163 78','#83bcba',9)+path('M126 81 Q'+(128+bend)+' 63 '+(130+bend)+' 60','#fac187',5)+(i===1||i===2?path('M72 46Q75 20 104 13l-6 4','#ffcb8f',2):'')+text(140,108,'Semicircular duct and cupula');
  }
  const lag=[0,0,-9,-14,0][i];
  let s=path('M50 78H230','#87bda8',8)+path('M'+(64+lag)+' 44h152','#aab5d3',9);
  for(let x=75;x<216;x+=16){s+=path('M'+x+' 74l'+lag+' -26','#eec286',2)+dot(x+lag,37,3,'#dddfc3');}
  if(i===1||i===2)s+=path('M192 18h40l-6 -4','#efb986',2);
  return s+text(138,108,'Otoconia, membrane and hair bundles');
}
export function drawNeuralRoute(id,mode,stage){return id==='14.1'?ear(mode,stage):nodes(routeSignals[id].modes[mode],stage,mode,id);}

