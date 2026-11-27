// Coordinates in schematic display units. Negative X is the subject's right; Y is superior.
const RA=[-.38,1.20,0], LA=[.38,1.26,-.06], RV=[-.30,.76,.25], LV=[.40,.67,.02];
const da=[-.03,1.86,.22], arch=[.61,1.84,-.28], umbilicus=[-.08,-1.81,.33];
const uv=[-.41,-.50,.26], ivc=[-.57,-.07,-.10], placenta=[-1.53,-2.04,.73];
export const fetalPaths={
  umbilicalVein:[placenta,[-.98,-2.13,.53],umbilicus,[-.12,-1.18,.34],uv],
  ductusVenosus:[uv,[-.45,-.34,.12],ivc],
  lowerCava:[ivc,[-.55,.48,-.13],RA],
  foramenOvale:[RA,[-.03,1.25,-.03],LA],
  mitralInflow:[LA,[.33,1.04,-.03],LV],
  ascendingAorta:[LV,[.15,1.37,-.21],[.13,2.02,-.16],[.42,2.12,-.2],arch],
  upperCava:[[-.52,2.17,-.03],[-.52,1.61,-.05],RA],
  tricuspidInflow:[RA,[-.35,1.02,.17],RV],
  pulmonaryTrunk:[RV,[-.28,1.29,.39],da],
  ductusArteriosus:[da,[.26,1.93,-.04],arch],
  descendingAorta:[arch,[.37,1.25,-.42],[.23,-.43,-.47],[.15,-1.46,-.35]],
  leftUmbilicalArtery:[[.15,-1.46,-.35],[.45,-1.74,-.18],[.35,-1.99,.07],umbilicus,[-.8,-2.27,.54],[-1.52,-2.16,.76]],
  rightUmbilicalArtery:[[.15,-1.46,-.35],[-.29,-1.75,-.18],[-.38,-2.03,.09],[-.14,-1.87,.30],[-.92,-1.99,.65],[-1.50,-1.93,.76]],
  lungBranch:[da,[.49,1.68,.06],[.97,1.45,-.13]],
  pulmonaryVein:[[.97,1.45,-.13],[.76,1.28,-.23],LA]
};
export const fetalSegments={
  umbilicalVein:'Umbilical vein',ductusVenosus:'Ductus venosus',lowerCava:'Inferior vena cava',foramenOvale:'Foramen ovale',mitralInflow:'Left atrium to left ventricle',ascendingAorta:'Ascending aorta and arch',upperCava:'Superior vena cava',tricuspidInflow:'Right atrium to right ventricle',pulmonaryTrunk:'Pulmonary trunk',ductusArteriosus:'Ductus arteriosus',descendingAorta:'Descending aorta',leftUmbilicalArtery:'Left umbilical artery',rightUmbilicalArtery:'Right umbilical artery',lungBranch:'Pulmonary artery toward the lung',pulmonaryVein:'Pulmonary venous return'
};
export const fetalRoutes=[
  {id:'placental',name:'Placenta to right atrium',path:['umbilicalVein','ductusVenosus','lowerCava'],note:'One umbilical vein brings blood from the placenta. Some blood perfuses the liver. Follow the portion that takes the ductus venosus into the inferior vena cava.'},
  {id:'atrial',name:'Across the foramen ovale',path:['lowerCava','foramenOvale','mitralInflow','ascendingAorta'],note:'Follow a preferential stream across the opening in the interatrial septum, into the left ventricle and ascending aorta. Other blood entering the right atrium goes to the right ventricle.'},
  {id:'ductal',name:'Pulmonary trunk to aorta',path:['upperCava','tricuspidInflow','pulmonaryTrunk','ductusArteriosus','descendingAorta'],note:'High fetal pulmonary vascular resistance directs much of the right ventricular output across the ductus arteriosus into the descending aorta.'},
  {id:'placentaReturn',name:'Return to the placenta',path:['descendingAorta','rightUmbilicalArtery'],note:'Trace one of the two umbilical arteries from the internal iliac circulation to the placenta. The second artery follows the other side of the fetal bladder.'},
  {id:'lung',name:'Through the lung',path:['tricuspidInflow','pulmonaryTrunk','lungBranch','pulmonaryVein','mitralInflow'],note:'Some blood reaches the fetal lungs even before birth. After the first breaths, pulmonary resistance falls and more blood returns to the left atrium.'}
];

// After functional shunt closure, caval blood traverses the right heart,
// pulmonary circuit and left heart. Both alternatives follow existing tubes.
const throughLung=['tricuspidInflow','pulmonaryTrunk','lungBranch','pulmonaryVein','mitralInflow','ascendingAorta'];
export const newbornRoutes={
  placental:{name:'Placental inflow ends',path:[],note:'Cord clamping stops umbilical venous inflow. The ductus venosus subsequently closes.'},
  atrial:{name:'Inferior vena cava through the lungs',path:['lowerCava',...throughLung],note:'Increased pulmonary venous return raises left atrial pressure and closes the flap of the foramen ovale. Follow blood from the inferior vena cava through the right heart, lungs and left heart to the aorta.'},
  ductal:{name:'Superior vena cava through the lungs',path:['upperCava',...throughLung,'descendingAorta'],note:'After pulmonary resistance falls and the ductus arteriosus constricts, blood from the right ventricle reaches the lungs. Trace its return to the left atrium and its delivery through the left ventricle to the descending aorta.'},
  placentaReturn:{name:'Placental outflow ends',path:[],note:'After cord clamping, the umbilical arteries cease carrying blood to the placenta. Their proximal portions continue to supply the bladder.'},
  lung:{name:'Through the expanded lung',path:throughLung,note:'Follow blood through the right heart to the lung, back to the left atrium and on to the aorta. The marker follows one representative lung branch.'}
};
