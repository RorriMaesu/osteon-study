const defaultContext={type:'study',label:'Chapters 1–11',text:'Human body, chemistry, cells, tissues, skin, skeleton, joints, muscle tissue and the muscular system.'};
let current={...defaultContext};
let assessmentMode=null;
export function getLearningContext(){return{...current,assessmentMode};}
export function getTutorAssessmentMode(){return assessmentMode;}
export function setTutorAssessmentMode(mode=null){
 if(![null,'exam','practice'].includes(mode))throw new Error('Unknown tutor assessment mode.');
 assessmentMode=mode;
 if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('tutorcontext',{detail:getLearningContext()}));
 return assessmentMode;
}
export function setLearningContext(context){
 current={...defaultContext,...context};
 if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('tutorcontext',{detail:getLearningContext()}));
 return getLearningContext();
}
const short=(value,max=600)=>String(value??'').slice(0,max);
export function setDiagramLearningContext({id,title,reference,state={},prediction='',question='',hint='',answer='',facts=[]}={}){
 const safeState=Object.fromEntries(Object.entries(state&&typeof state==='object'?state:{}).slice(0,16).filter(([key,value])=>typeof key==='string'&&(['string','boolean'].includes(typeof value)||typeof value==='number'&&Number.isFinite(value))).map(([key,value])=>[short(key,60),typeof value==='string'?short(value,240):value]));
 const diagram={id:short(id,100),state:safeState,prediction:short(prediction),question:short(question),hint:short(hint),answer:short(answer,1000),facts:(Array.isArray(facts)?facts:[]).slice(0,8).map(f=>short(f,500))};
 return setLearningContext({type:'diagram',label:short(title,160),reference:/^\d+\.\d+$/.test(reference||'')?reference:'',diagram,text:diagram.facts.join(' ')});
}
