// Schematic left-heart samples share an 800 ms clock. Values are in mm Hg, mL and relative ECG units.
export const beat = {
  atrium: [[0,6],[70,7],[88,7],[125,10],[164,12],[186,10],[195,9],[212,10],[230,7],[300,4],[420,6],[492,10],[535,10],[550,9],[562,6],[588,5],[680,6],[800,6]],
  aorta: [[0,84],[90,82],[195,80],[245,79],[275,98],[310,113],[347,118],[405,113],[456,103],[492,95],[501,91],[513,96],[570,92],[660,88],[800,84]],
  ventricle: [[0,4],[70,5],[88,5],[125,7],[164,10],[186,8],[195,9],[212,25],[229,51],[245,79],[274,104],[310,120],[345,123],[405,117],[456,106],[492,95],[511,69],[533,35],[550,14],[562,6],[588,3],[680,4],[800,4]],
  volume: [[0,95],[88,102],[135,112],[178,119],[195,120],[245,120],[294,96],[349,73],[412,59],[459,53],[492,50],[562,50],[605,65],[685,87],[800,95]],
  ecg: [[0,0],[53,0],[64,.07],[73,.19],[81,.18],[90,.05],[96,0],[171,0],[177,-.12],[182,0],[188,1],[193,.12],[198,-.24],[204,0],[350,0],[379,.06],[408,.24],[426,.28],[445,.18],[466,.03],[478,0],[800,0]]
};

export function interpolate(points, t) {
  for (let i = 1; i < points.length; i++) {
    const [time, value] = points[i];
    if (t <= time) {
      const [previousTime, previousValue] = points[i-1];
      return previousValue + (value - previousValue) * (t - previousTime) / (time - previousTime);
    }
  }
  return points.at(-1)[1];
}
export function pressureState(t) {
  const la = interpolate(beat.atrium,t), lv = interpolate(beat.ventricle,t), ao = interpolate(beat.aorta,t);
  // At a crossing use the immediately following gradient to define the transition.
  const next = Math.min(800,t+.01), nextLV=interpolate(beat.ventricle,next);
  return {la,lv,ao,mitral:la>lv || (la===lv && interpolate(beat.atrium,next)>nextLV),
    aortic:lv>ao || (lv===ao && nextLV>interpolate(beat.aorta,next)),volume:interpolate(beat.volume,t)};
}

// Complementary illustrative right-sided trace. Pulmonary ejection ends
// slightly later than aortic ejection in this example.
export const rightBeat = {
  atrium:[[0,4],[88,4],[164,7],[189,5],[200,4],[224,5],[300,2],[426,4],[515,6],[550,6],[568,5],[598,4],[800,4]],
  ventricle:[[0,2],[88,2],[164,4],[189,3],[200,4],[221,6],[235,8],[285,22],[340,26],[400,24],[490,16],[515,14],[540,9],[568,5],[600,2],[800,2]],
  pulmonary:[[0,10],[120,9],[200,8.4],[235,8],[286,20],[341,24],[410,22],[490,15],[515,14],[524,13],[539,14],[650,12],[800,10]]
};
export function rightPressureState(t){
  const ra=interpolate(rightBeat.atrium,t),rv=interpolate(rightBeat.ventricle,t),pa=interpolate(rightBeat.pulmonary,t);
  const next=Math.min(800,t+.01),nextRV=interpolate(rightBeat.ventricle,next);
  return {ra,rv,pa,tricuspid:ra>rv||(ra===rv&&interpolate(rightBeat.atrium,next)>nextRV),
    pulmonary:rv>pa||(rv===pa&&nextRV>interpolate(rightBeat.pulmonary,next))};
}

export const valveChallenges = [
  [182,'The ventricle is about to contract. Which event comes next?',0,'As LV pressure rises above LA pressure, reverse pressure closes the mitral valve.'],
  [233,'The ventricle is building pressure with both valves closed. Which event comes next?',1,'LV pressure is about to exceed aortic pressure, opening the aortic valve.'],
  [474,'Ventricular pressure is falling late in ejection. Which event comes next?',2,'Aortic pressure overtakes LV pressure and closes the aortic valve.'],
  [550,'LV volume is at its minimum and both valves are closed. Which event comes next?',3,'LV pressure falls below LA pressure, allowing the mitral valve to open.']
];
export const valveChoices=['Mitral closes','Aortic opens','Aortic closes','Mitral opens'];

export const rightValveChoices=['Tricuspid closes','Pulmonary opens','Pulmonary closes','Tricuspid opens'];
export const rightPhases=[
  {start:0,name:'Passive filling',note:'Right atrial pressure exceeds right ventricular pressure. Venous blood enters through the open tricuspid valve.'},
  {start:88,name:'Atrial systole',note:'Right atrial contraction adds the final portion of blood to the right ventricle.'},
  {start:200,name:'Isovolumetric contraction',note:'The tricuspid valve closes. The right ventricle builds pressure with both valves closed.'},
  {start:235,name:'Ventricular ejection',note:'Right ventricular pressure exceeds pulmonary arterial pressure. Blood flows into the pulmonary trunk.'},
  {start:515,name:'Isovolumetric relaxation',note:'The pulmonary valve closes. Right ventricular pressure falls while both valves are closed.'},
  {start:568,name:'Ventricular filling resumes',note:'Right ventricular pressure falls below right atrial pressure. The tricuspid valve opens and filling resumes.'}
];
export const rightValveChallenges=[
  [189,'Right ventricular pressure is rising toward right atrial pressure. Which event comes next?',0,'RV pressure rises above RA pressure and closes the tricuspid valve.'],
  [224,'Both right-heart valves are closed and ventricular pressure is rising. Which event comes next?',1,'RV pressure rises above pulmonary arterial pressure, opening the pulmonary valve.'],
  [500,'Right ventricular pressure is falling late in ejection. Which event comes next?',2,'Pulmonary arterial pressure overtakes RV pressure and closes the pulmonary valve.'],
  [550,'Both right-heart valves are closed and ventricular pressure is falling. Which event comes next?',3,'RV pressure drops below RA pressure, so the tricuspid valve opens and filling resumes.']
];

