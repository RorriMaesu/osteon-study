// A route lists landmarks along one selected stream. Other branches can carry blood at the same time.
const pulmonary = [
  ['Right ventricle','chamber','The right ventricle receives systemic venous blood and ejects it through the pulmonary valve.'],
  ['Pulmonary trunk','artery','Blood enters the short common outflow vessel before it branches to the two lungs.'],
  ['Pulmonary arteries','artery','The right and left pulmonary arteries carry relatively oxygen-poor blood away from the heart.'],
  ['Lung capillaries','bed','Across the thin alveolar–capillary barrier, blood gains oxygen and releases carbon dioxide.'],
  ['Pulmonary veins','vein','Blood now rich in oxygen travels through pulmonary veins toward the left side of the heart.'],
  ['Left atrium','chamber','The pulmonary veins empty into this chamber. Blood crosses the mitral valve when the left ventricle fills.']
];

const liverReturn = [
  ['Liver sinusoids','bed','Branches of the hepatic portal vein deliver blood to this second capillary bed. Blood from hepatic arterial branches joins it here.'],
  ['Hepatic veins','vein','Sinusoidal blood drains through central veins and larger collecting veins into the hepatic veins.'],
  ['Inferior vena cava','vein','The hepatic veins join the inferior vena cava. It carries the returning blood to the right atrium.']
];

const portal = [
  ['Intestinal capillaries','bed','Imagine a tracer entering a small capillary in a jejunal villus. The next organ to receive the tracer will be the liver.'],
  ['Superior mesenteric vein','vein','Venules from the jejunum join larger veins that drain to the superior mesenteric vein.'],
  ['Hepatic portal vein','vein','The superior mesenteric and splenic veins unite to form the hepatic portal vein. This vessel connects two capillary beds.'],
  ...liverReturn
];

const systemic = [
  ['Left ventricle','chamber','Begin with blood that has returned from the lungs. Ventricular contraction ejects it across the aortic valve.'],
  ['Aorta','artery','Follow the ascending aorta into the arch. Choose the left subclavian branch to reach the left arm.'],
  ['Upper limb arteries','artery','The left subclavian artery continues as the axillary and then brachial artery. Follow a branch to a working muscle.'],
  ['Muscle capillaries','bed','Oxygen and nutrients leave the blood for the muscle. Carbon dioxide from the muscle enters the blood.'],
  ['Upper limb veins','vein','Venules drain to larger veins. The axillary and subclavian veins return blood toward the left brachiocephalic vein.'],
  ['Right atrium','chamber','The left brachiocephalic vein joins the right one to form the superior vena cava, which empties into the right atrium.']
];

const fetalLiver = [
  ['Placental villi','bed','Start with fetal blood in the placental villi, where exchanges occur with maternal blood across a tissue barrier.'],
  ['Umbilical vein','vein','The single umbilical vein carries relatively oxygen-rich blood from the placenta toward the fetus.'],
  ['Ductus venosus','shunt','A portion of the umbilical venous stream passes through this channel, bypassing the liver sinusoids. The remaining portion perfuses the liver.'],
  ['Inferior vena cava','vein','Blood from the ductus venosus mixes with venous return from the lower body and liver.'],
  ['Right atrium','chamber','The inferior vena cava brings the stream to the right atrium. Some of the better oxygenated stream is directed through the foramen ovale.']
];

const fetalAtria = [
  ['Right atrium','chamber','Follow the portion of the incoming inferior vena caval stream directed toward the interatrial septum.'],
  ['Foramen ovale','shunt','The flap-like opening permits right-to-left flow directly across the fetal atrial septum.'],
  ['Left atrium','chamber','Blood arriving through the foramen ovale mixes with the smaller amount returning from the fetal lungs.'],
  ['Left ventricle','chamber','Blood crosses the mitral valve and fills the left ventricle.'],
  ['Ascending aorta','artery','Ejection across the aortic valve helps deliver relatively well-oxygenated blood to coronary arteries and aortic arch branches serving the head.']
];

const fetalOutflow = [
  ['Right ventricle','chamber','Follow blood ejected across the pulmonary valve into the pulmonary trunk.'],
  ['Pulmonary trunk','artery','The fluid-filled lungs have high vascular resistance. Some blood reaches the lungs, but much of this output takes another route.'],
  ['Ductus arteriosus','shunt','This vessel directs blood from the pulmonary outflow into the descending aorta, beyond the main aortic arch branches.'],
  ['Descending aorta','artery','Aortic blood supplies the lower body. Follow the portion flowing toward the pelvis.'],
  ['Umbilical arteries','artery','The paired umbilical arteries arise from the internal iliac circulation and carry blood away from the fetus.'],
  ['Placental villi','bed','The umbilical arteries branch into fetal placental vessels. The tracer has reached the fetal side of the gas-exchange surface.']
];

const pathways = {
  pulmonary:{label:'Pulmonary circuit',steps:pulmonary},
  systemic:{label:'Systemic circuit to the left arm',steps:systemic},
  portal:{label:'Hepatic portal circuit',steps:portal}
};

const shunts = {
  liver:{
    label:'Liver inflow · ductus venosus', fetal:fetalLiver, adult:portal,
    transition:'Separation from the placenta stops umbilical venous flow. The ductus venosus closes and later becomes the ligamentum venosum. In the adult comparison, follow intestinal venous blood through the liver sinusoids.'
  },
  atria:{
    label:'Atrial stream · foramen ovale', fetal:fetalAtria,
    adult:[
      ['Right atrium','chamber','Systemic venous blood enters the right atrium. A typical adult atrial septum keeps this stream on the right side.'],
      ['Right ventricle','chamber','Blood passes through the tricuspid valve. The right ventricle ejects it through the pulmonary valve.'],
      ['Pulmonary arteries','artery','The pulmonary trunk divides into right and left pulmonary arteries. Follow a branch into a ventilated lung.'],
      ...pulmonary.slice(3)
    ],
    transition:'With lung expansion, pulmonary resistance falls and venous return to the left atrium increases. Left atrial pressure presses the septal flap closed. The fossa ovalis marks the site in the typical adult septum.'
  },
  outflow:{
    label:'Pulmonary outflow · ductus arteriosus', fetal:fetalOutflow, adult:pulmonary,
    transition:'The lungs expand and pulmonary flow rises. Higher oxygen tension and falling prostaglandin signaling favor ductal constriction. The ductus arteriosus later becomes the ligamentum arteriosum.'
  }
};

const stationGlyphs = {
  chamber:'<path d="M14 23 C12 20 3 15 3 9 C3 3 10 2 14 7 C18 2 25 3 25 9 C25 15 16 22 14 23Z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  vein:'<path d="M2 7 Q12 4 26 7 M2 21 Q13 23 26 20 M8 8 Q11 14 15 14 M19 20 Q16 14 12 14" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  artery:'<path d="M2 6 H14 Q18 6 24 1 M2 20 H14 Q18 20 24 25 M2 11 H15 Q20 10 26 5 M2 15 H15 Q20 16 26 21" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  bed:'<path d="M1 14 H6 M21 14 H28 M6 14 Q12 -4 21 14 Q12 32 6 14 M6 14 Q13 6 21 14 Q13 22 6 14 M6 14 H21" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  shunt:'<path d="M3 5 H25 M3 22 H25 M7 19 L19 8 M13 8 H20 V15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
};
const routeStyles = `<style>
.ap2-cardio-lab .ac-route-figure {background:#112329;border:1px solid #354d4f;border-radius:10px;padding:8px;margin:12px 0}
.ap2-cardio-lab .ac-route-figure svg {display:block;width:100%;max-width:620px;height:auto;margin:auto}
.ap2-cardio-lab .ac-route-figure text {font-family:system-ui,sans-serif;fill:#e6eee5;font-size:15px;font-weight:550}
.ap2-cardio-lab .ac-route-figure .ac-visit text {fill:#17332d}
.ap2-cardio-lab .ac-route-controls {display:flex;align-items:end;flex-wrap:wrap;gap:10px 16px;margin:12px 0}
.ap2-cardio-lab .ac-route-controls label {display:grid;gap:4px;font-size:13px;max-width:100%}
.ap2-cardio-lab .ac-route-controls select {width:100%;max-width:100%;text-overflow:ellipsis}
.ap2-cardio-lab .ac-route-predict {display:flex;align-items:center;gap:8px;min-height:32px}
.ap2-cardio-lab .ac-route-predict input {accent-color:#a8d4b8}
.ap2-cardio-lab .ac-route-info {border-left:3px solid #eeb38d;padding:3px 0 3px 12px;margin:12px 0}
.ap2-cardio-lab .ac-route-info p {margin:4px 0}
</style>`;

export function renderRoutes(development) {
  const routes = development ? shunts : pathways;
  return `${routeStyles}<h3>${development ? 'Compare fetal and adult blood flow' : 'Trace a blood pathway'}</h3>
    <p>${development ? 'Choose a fetal shunt and trace one stream of blood. Switch to adult circulation to follow the route after birth.' : 'Choose a circuit and follow a red cell from stop to stop. The arrows give the direction of flow.'}</p>
    <div class="ac-route-controls">${development ? '<label>Stage<select data-route-stage><option value="fetal">Fetal circulation</option><option value="adult">Adult circulation</option></select></label>' : ''}
    <label>${development ? 'Compare a pathway' : 'Circuit'}<select data-pathway>${Object.entries(routes).map(([id,route]) => `<option value="${id}">${route.label}</option>`).join('')}</select></label></div>
    <label class="ac-route-predict"><input type="checkbox" data-predict>Hide upcoming stops to predict the route</label>
    <figure class="ac-route-figure"><svg data-route-plot role="img"></svg></figure>
    <div class="ac-row"><button type="button" data-route-back>Previous stop</button><button type="button" data-route-next>Next stop</button></div>
    <div class="ac-route-info" role="status" aria-live="polite" aria-atomic="true"><h4 data-stop-title></h4><p data-stop-note></p></div>
    ${development ? '<div class="ac-details"><h4>At birth</h4><p data-route-transition></p></div>' : ''}`;
}

function position(index) {
  const row = Math.floor(index / 2);
  const column = row % 2 ? 1 - index % 2 : index % 2;
  return {x:column ? 236 : 16,y:12 + row * 78};
}

function arrow(from,to,visited) {
  const color = visited ? '#a1cbb6' : '#92a8a8';
  let path;
  if (from.y === to.y) {
    const sign = to.x > from.x ? 1 : -1;
    const start = sign > 0 ? from.x + 174 : from.x;
    const end = sign > 0 ? to.x - 3 : to.x + 177;
    const y = from.y + 27;
    path = `M${start} ${y} H${end} M${end-sign*7} ${y-4} L${end} ${y} l${-sign*7} 4`;
  } else {
    const x = from.x + 87, bottom = to.y - 4;
    path = `M${x} ${from.y+54} V${bottom} M${x-4} ${bottom-7} L${x} ${bottom} l4 -7`;
  }
  return `<path d="${path}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function linesFor(name) {
  const words = name.split(' ');
  if (name.length <= 14) return [name];
  let split = 1;
  while (split < words.length - 1 && words.slice(0,split+1).join(' ').length <= 13) split++;
  return [words.slice(0,split).join(' '),words.slice(split).join(' ')];
}

function routeDrawing(steps,stop,predict) {
  return steps.map(([name,kind],i) => {
    const pos = position(i), chosen = i === stop;
    const hidden = predict && i > stop;
    const fill = chosen ? '#e4aa83' : i < stop ? '#29483e' : '#23373c';
    const stroke = chosen ? '#ffe0b5' : i < stop ? '#91bca6' : '#556e70';
    const text = linesFor(hidden ? 'Upcoming stop' : name);
    return `${i ? arrow(position(i-1),pos,i <= stop) : ''}<g transform="translate(${pos.x} ${pos.y})" class="${chosen ? 'ac-visit' : ''}">
      <rect width="174" height="54" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="${chosen ? 3 : 1.5}"/>
      <g transform="translate(9 15) scale(.83)" style="color:${chosen ? '#17332d' : '#b7d9c8'}">${hidden ? '<circle cx="14" cy="14" r="4" fill="currentColor"/>' : stationGlyphs[kind]}</g>
      ${text.map((line,j)=>`<text x="38" y="${text.length===1 ? 32 : 23 + j*18}">${line}</text>`).join('')}</g>`;
  }).join('');
}

export function mountRoutes(lab,development) {
  const get = name => lab.querySelector('[data-' + name + ']');
  const pathway = get('pathway'), stage = get('route-stage'), predict = get('predict');
  const back = get('route-back'), next = get('route-next'), plot = get('route-plot');
  let stop = 0, totalStops = 0;
  function show() {
    const route = (development ? shunts : pathways)[pathway.value];
    const steps = development ? route[stage.value] : route.steps;
    totalStops = steps.length;
    const [name,,detail] = steps[stop];
    plot.setAttribute('viewBox',`0 0 426 ${Math.ceil(steps.length/2)*78}`);
    plot.setAttribute('aria-label',steps.map(([label],i) => predict.checked && i > stop ? 'Upcoming stop' : label).join(' to ') + '. Current stop: ' + name + '.');
    plot.innerHTML = routeDrawing(steps,stop,predict.checked);
    get('stop-title').textContent = `Stop ${stop+1} of ${steps.length} · ${name}`;
    const finished = stop === steps.length - 1;
    get('stop-note').textContent = predict.checked && !finished ? 'Name the next stop, then advance to check your prediction.' : detail;
    back.disabled = stop === 0;
    next.textContent = finished ? 'Trace again' : 'Next stop';
    if (development) get('route-transition').textContent = route.transition;
  }
  function restart() { stop = 0; show(); }
  pathway.addEventListener('change',restart);
  stage?.addEventListener('change',restart);
  predict.addEventListener('change',show);
  back.addEventListener('click',() => { stop--; show(); });
  next.addEventListener('click',() => { stop = (stop+1) % totalStops; show(); });
  show();
}
