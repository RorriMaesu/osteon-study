import {chapter11Muscles} from './chapter11-muscles.js';
import {muscleFigureTargets} from './muscle-figure-targets.js';
const rows=[];
const clean=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
export const muscleChecklistTargets=chapter11Muscles.filter(card=>card.courseChecklist);
for(const card of muscleChecklistTargets){
 const id='mc11-'+card.id.replace(/^ch11-/,''),general=card.kind==='connective tissue',group=card.kind==='group';
 const criteria=[
  {id:'location',label:'Location',description:'Describes the main anatomical region/relationship: '+card.location,points:1},
  {id:'function',label:general?'Mechanical role':'Action or function',description:'Gives an accurate principal role consistent with: '+card.action,points:1},
  {id:'attachments',label:'General attachment relationship',description:(general?'Describes the attachment or enclosing relationship; do not invent a universal muscle-style origin/insertion. ':group?'Recognizes that this is a group; describes its general attachment regions and relevant variation. ':'Connects a proximal/general origin region to a distal/general insertion region. ')+'Study reference: '+card.origin+' '+card.insertion+' Exact wording and every minor slip are not required.',points:1},
 ];
 const base={lesson:card.section,topic:'Chapter 11',objectives:[],checklistTargetId:card.id,checklistTargetName:card.name,source:'OpenStax A&P 2e §'+card.section+' · BI 231 checklist · reviewed general attachment card',supplemental:true};
 rows.push({...base,id:id+'-explain',type:'written',points:3,prompt:'For '+card.name+', describe its location, '+(general?'mechanical role':'main action or function')+', and general attachment relationship. '+(group?'This is a group: acknowledge component differences where relevant. ':general?'Use the appropriate connective-tissue relationship rather than inventing a universal origin and insertion. ':'')+'Concise bullets are welcome.',answer:card.location+' '+card.action+' General attachments: '+card.origin+' '+card.insertion,explanation:card.location+' '+card.action+' '+card.origin+' '+card.insertion,rubric:{id:id+'-rubric',version:'1',criteria},sourceContext:[card.location,card.action,card.origin,card.insertion,card.sourceNotes],assessmentFacets:['location','function','attachments','explanation']});
 const names=[card.name,...card.aliases||[]].map(clean),target=Object.entries(muscleFigureTargets).find(([id,t])=>card.figures.includes(t.figure)&&(card.figureTarget?card.figureTarget===id:names.includes(clean(t.name))));
 if(target){const [targetId,t]=target;rows.push({...base,id:id+'-identify',type:'identify',figure:'muscle-target:'+targetId,target:'',prompt:'Name the ringed checklist structure. Use the shown anatomical orientation.',answer:card.name,aliases:[...new Set([t.name,...t.aliases||[],...card.aliases||[]])].filter(x=>x!==card.name),explanation:t.description+' '+card.location,answerPolicy:{kind:'structure'},assessmentFacets:['identification']});}
}
// The bank covers every checklist target through a written task. Only validated
// image targets are used for scored visual identification; no pin is invented.
export const muscleChecklistBank=rows;
export function muscleChecklistQuestionsFor(targetIds=muscleChecklistTargets.map(t=>t.id),{kind='all'}={}){
 const ids=new Set(targetIds);return rows.filter(q=>ids.has(q.checklistTargetId)&&(kind==='all'||kind==='visual'&&q.type==='identify'||kind==='written'&&q.type==='written'));
}
