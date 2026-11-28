import surfaces from './organ-female-surfaces.json' with {type:'json'};

export const femaleBody={
  key:'female',title:'Organs in the female body',label:'Whole body · adult female',
  description:'Human Reference Atlas · adult female',
  asset:'assets/organ-atlas/female-body.glb',direction:[0,.02,1],
  organs:surfaces.organs,boneNames:surfaces.boneNames
};
