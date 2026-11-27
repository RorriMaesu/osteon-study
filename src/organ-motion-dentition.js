import jaw from '../assets/motion-jaw.json' with {type:'json'};

const teeth=['Upper','Lower'].flatMap(arch=>['medial incisor','lateral incisor','canine','first premolar','second premolar','first molar tooth','second molar tooth'].flatMap(tooth=>['r','l'].map(side=>arch+' '+tooth+'.'+side+'.001')));
const clip=jaw.clips.find(clip=>clip.id==='jaw');
const phaseNotes=['Identify the upper and lower dental arches.','Watch the lower incisors move down and away from the upper incisors.','Compare the gap between the opposing molars while the jaw is open.','The mandible rises, bringing the lower teeth toward the fixed upper arch.','The dental arches return to their starting relationship.'];

export const dentition={id:'teeth',bodyIds:['teeth'],title:'Teeth and jaws',system:'Digestive',aliases:['dentition','bite','mastication','chewing','molars','incisors'],
  asset:'assets/motion-jaw.glb',targets:teeth,context:['Mandible.001','Maxilla.r.001','Maxilla.l.001'],
  action:'Open and close the dental arches',kind:'Organ movement',duration:clip.duration,direction:jaw.camera.direction,
  source:'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-3-the-mouth-pharynx-and-esophagus',credits:'assets/MODEL-LICENSE.md',
  description:'The lower teeth move with the mandible. The upper arch stays attached to the maxillae. This specimen has 28 teeth through the second molars. The cycle isolates jaw opening and closing.',
  phases:clip.phases.map((phase,i)=>({at:phase.start/clip.duration,label:phase.label,text:phaseNotes[i]}))};

export function mountDentition(entry,viewer,meshes){
  const deform=[];
  for(const list of meshes.values())for(const mesh of list){
    const index=mesh.morphTargetDictionary?.JawOpen;
    if(index!==undefined)deform.push({mesh,index,initial:mesh.morphTargetInfluences[index]});
  }
  if(!deform.length)throw new Error('Missing dental-arch motion');
  return {
    set(t){
      const seconds=t*clip.duration,keys=clip.morphTracks.JawOpen;
      const next=keys.findIndex(k=>k[0]>seconds);
      let weight=keys.at(-1)[1];
      if(next>0){
        const [a,b]=keys.slice(next-1,next+1),u=(seconds-a[0])/(b[0]-a[0]);
        weight=a[1]+(b[1]-a[1])*u*u*(3-2*u);
      }
      for(const {mesh,index} of deform)mesh.morphTargetInfluences[index]=weight;
    },dispose(){for(const {mesh,index,initial} of deform)mesh.morphTargetInfluences[index]=initial;}
  };
}
