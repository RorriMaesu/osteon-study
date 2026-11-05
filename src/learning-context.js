const defaultContext={type:'study',label:'Chapters 1–10',text:'Human body, chemistry, cells, tissues, skin, skeleton, joints and muscle tissue.'};
let current={...defaultContext};
export function getLearningContext(){return{...current};}
export function setLearningContext(context){
 current={...defaultContext,...context};
 if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('tutorcontext',{detail:getLearningContext()}));
 return getLearningContext();
}
