const defaultContext={type:'study',label:'Chapters 6 and 7',text:'Bone tissue and the axial skeleton, with appendicular lab extensions.'};
let current={...defaultContext};
export function getLearningContext(){return{...current};}
export function setLearningContext(context){
 current={...defaultContext,...context};
 if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('tutorcontext',{detail:getLearningContext()}));
 return getLearningContext();
}
