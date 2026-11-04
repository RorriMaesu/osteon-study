const defaultContext={type:'study',label:'Chapters 6–10',text:'Bone tissue, axial and appendicular anatomy, joints, and muscle tissue.'};
let current={...defaultContext};
export function getLearningContext(){return{...current};}
export function setLearningContext(context){
 current={...defaultContext,...context};
 if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('tutorcontext',{detail:getLearningContext()}));
 return getLearningContext();
}
