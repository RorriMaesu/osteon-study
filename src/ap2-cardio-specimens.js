import * as THREE from 'three';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';
import {mountOrganViewer} from './ap2-organ-viewer.js';
import {makeTeachingValve} from './ap2-valve-surfaces.js';
import {pressureState} from './ap2-heart-cycle.js';

const structureName = name => name.replace(/^VH_M_/,'').replaceAll('_',' ').replace(/heart (left|right) ventricle/,'$1 ventricle').replace(/cardiac atrium/,'atrium');
const instructions = {
  motion:'Watch the two mitral leaflets and three aortic cusps open and close at the pressure crossings. Gold moving surfaces are idealized reconstructions positioned at the source valve centers. Select Valves and supports to inspect the original surfaces.',
  surface:'Locate the apex, then orbit to the posterior left atrium. Coronary arteries supply the myocardium. Cardiac veins return blood to the right atrium through the coronary sinus.',
  cut:'Adjust the frontal cut to expose both ventricles, the septum and internal valve apparatus. Compare the thicker left ventricular wall with the right.',
  valves:'View the valves from above. AV valves have chordal attachments to papillary muscles. Semilunar valves have pocket-shaped cusps and lack chordae. Chordae prevent prolapse during systole.',
  conduction:'Follow the highlighted teaching path from the superior right atrium through the AV junction, into the septum, toward the apex and then up the ventricular walls. Its position is approximate.',
  thorax:'The heart is behind the sternum and anterior to the thoracic vertebrae. Follow the apex toward the left fifth intercostal space. Heart walls, ribs and sternum share the same BodyParts3D coordinates.'
};
const conduction = [
  [[-.030,.515,.021],[-.034,.504,.034],[-.025,.48,.031],[-.009,.476,.029]],
  [[-.009,.476,.029],[-.004,.478,.030],[.010,.476,.037]],
  [[.010,.476,.037],[.023,.458,.052],[.042,.435,.070],[.049,.429,.073]],
  [[.049,.429,.073],[.046,.441,.084],[.026,.462,.083],[.013,.474,.072]],
  [[.049,.429,.073],[.061,.439,.070],[.073,.462,.048],[.064,.477,.036]]
];
const phaseTimes=[50,105,169,188,203];
function conductionIndex(t) {
  if(t<50 || t>270)return -1;
  if(t<105)return 0;
  if(t<169)return 1;
  if(t<188)return 2;
  return 3;
}
const heartModes=[['surface','Heart surface'],['cut','Cutaway'],['valves','Valves and supports'],['motion','Valve movement'],['conduction','Conduction'],['thorax','Heart in rib cage']];
const vesselModes=[['arch','Aortic arch'],['portal','Hepatic portal system'],['kidneys','Renal circulation'],['leg','Right leg and foot']];
const option=(value,label)=>`<option value="${value}">${label}</option>`;
function nameColor(n) {
  if(/valve/.test(n))return '#efcc84';
  if(/papillary/.test(n))return '#db9baf';
  if(/septum/.test(n))return '#df9fa1';
  if(/atrium|ventricle/.test(n)&&!/vein|oblique/.test(n))return /right/.test(n)?'#9b6b8d':'#c77074';
  if(/pulmonary_trunk|pulmonary_artery|vein|cava|coronary_sinus/.test(n))return /pulmonary_vein/.test(n)?'#c87379':'#6492ad';
  if(/artery|aort|branch|trunk/.test(n))return '#cc7568';
  if(n.includes('cartilage'))return '#a1bbbc';
  return '#e5d8b8';
}
function chamber(name) {return /cardiac_atrium|heart_(left|right)_ventricle|interventricular_septum/.test(name);}
function valve(name){return name.includes('valve')||name.includes('papillary');}
// Midpoints of the minimum surface-to-surface separations in the derived right leg.
const junctions = [
  ['Inguinal ligament level',[-.05304,.80834,.14371],[0,0,1],'The marker identifies the external iliac-to-femoral transition deep to the inguinal ligament.'],
  ['Adductor hiatus level',[-.05862,.47994,.08918],[-.18,.04,-1],'The femoral artery passes through the adductor hiatus in adductor magnus and continues behind the knee as the popliteal artery.'],
  ['Anterior ankle',[-.06993,.00693,.08879],[0,.25,1],'Crossing the ankle, the anterior tibial artery continues as dorsalis pedis.']
];
const spotters = {
  surface:[['VH_M_aortic_arch','Ascending aorta','Aortic arch','Pulmonary trunk','The arch curves posteriorly and to the patient’s left.'],['VH_M_superior_vena_cava','Superior vena cava','Coronary sinus','Pulmonary trunk','This systemic vein enters the superior right atrium.']],
  valves:[['VH_M_mitral_valve','Aortic valve','Mitral valve','Tricuspid valve','The mitral valve lies between the left atrium and ventricle.'],['VH_M_pulmonary_valve','Mitral valve','Pulmonary valve','Tricuspid valve','The pulmonary valve guards the right ventricular outflow.']],
  leg:[['right_popliteal_artery','Femoral artery','Anterior tibial artery','Popliteal artery','The popliteal artery runs posterior to the knee.'],['right_dorsalis_pedis_artery','Dorsalis pedis artery','Posterior tibial artery','Femoral artery','Dorsalis pedis continues the anterior tibial artery onto the dorsum of the foot.']],
  thorax:[['sternum','Thoracic vertebra','Sternum','Costal cartilage','The sternum lies anterior to the heart.']],
  arch:[['VH_M_aortic_arch','Aortic arch','Pulmonary trunk','Descending aorta','The aortic arch gives off the great branches supplying the head, neck and upper limbs.']],
  portal:[['VH_M_splenic_vein','Splenic vein','Hepatic vein','Inferior vena cava','The splenic vein joins the superior mesenteric vein to form the hepatic portal vein.']],
  kidneys:[['VH_M_left_renal_artery','Left renal artery','Right renal artery','Renal vein','From the aorta this artery carries blood to the left kidney.']]
};
const traceLabels=['Atrial spread','AV delay','His bundle and branches','Ventricular spread'];
const vesselGroup = {
  arch: n=>/aortic_arch|ascending_aorta|descending_aorta|brachiocephalic_artery|left_common_carotid|left_subclavian/.test(n),
  portal: n=>/portal_vein|mesenteric_vein|splenic_vein|hepatic_vein|vena_cava/.test(n),
  kidneys: n=>/renal_(artery|vein)|descending_aorta|vena_cava/.test(n)
};
const vesselNotes={arch:'Identify the three usual arch branches. The right common carotid and right subclavian share the brachiocephalic trunk. The left common carotid and left subclavian arise independently.',portal:'Compare the portal vein entering the liver with hepatic veins leaving for the inferior vena cava. A portal circuit connects two capillary beds.',kidneys:'Trace a renal artery from the abdominal aorta to a kidney and a renal vein to the inferior vena cava. Compare left and right lengths.',leg:'Follow the femoral artery behind the knee to the popliteal artery. Select the anterior tibial artery, then dorsalis pedis where it crosses the front of the ankle. The deep and superficial venous returns are in the route exercise.'};

export function renderSpecimen(kind,linked=false) {
  const heart=kind==='heart';
  return `<div class="ac-specimen" data-organ-kind="${kind}"><h3>${heart?'Dissect the heart in 3D':'Trace vessels in 3D'}</h3>
    <div class="ac-row"><label>Specimen view <select data-specimen-mode>${(heart?heartModes.filter(([m])=>linked||m!=='motion'):vesselModes).map(([v,l])=>option(v,l)).join('')}</select></label>
    <label>Highlight <select data-specimen-target aria-label="Highlight an anatomical structure"><option value="">All structures</option></select></label>
    <label><input type="checkbox" data-organ-names checked> Show names</label><button type="button" data-focus-structure disabled>Focus selection</button></div>
    <div data-organ-host></div><strong data-target-name role="status"></strong>
    <div class="ac-row" data-cut-settings hidden><label class="ac-range">Cut depth <input data-cut type="range" min="0" max="100" value="48"></label></div>
    <div class="ac-row" data-sac-settings ${heart?'':'hidden'}><label><input type="checkbox" data-sac> Show schematic pericardial sac</label></div>
    <label data-junction-settings hidden>Show an arterial transition <select data-junction><option value="">Whole leg</option>${junctions.map(([name],i)=>option(i,name)).join('')}</select></label><p data-junction-note></p>
    <div data-conduct-settings hidden><label class="ac-range">Conduction stage <input data-conduction-stage type="range" min="0" max="3" value="0"></label>
    <span data-conduction-note></span></div><p data-specimen-note></p>
    <div data-spot-area><button type="button" data-spot-start>Identify a highlighted structure</button><div data-spot-choices hidden></div><p data-spot-answer role="status"></p></div>
    <small>${linked?'The clock below controls the pressure state, valve highlighting and conduction sequence. ':''}Sources and model adaptations · <a href="assets/AP2-CARDIO-LICENSE.md" target="_blank" rel="noopener">Credits</a></small></div>`;
}

function addPericardialEnvelope(model) {
  const points=[];
  model.traverse(obj=>{
    if(!obj.isMesh||!chamber(obj.name))return;
    const pos=obj.geometry.getAttribute('position');
    for(let i=0;i<pos.count;i+=Math.max(1,Math.floor(pos.count/550))) points.push(new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(obj.matrixWorld));
  });
  const center=new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
  for(const p of points)p.sub(center).multiplyScalar(1.06).add(center);
  const surface=new THREE.Mesh(new ConvexGeometry(points),new THREE.MeshPhongMaterial({color:0xadc7c2,transparent:true,opacity:.3,depthWrite:false,side:THREE.FrontSide}));
  surface.name='schematic_pericardial_sac';surface.visible=false;surface.renderOrder=3;model.add(surface);return surface;
}

export function mountSpecimen(lab,kind,linked=false) {
  const root=lab.querySelector('[data-organ-kind="'+kind+'"]');
  const get=k=>root.querySelector('[data-'+k+']');
  const mode=get('specimen-mode'), target=get('specimen-target'), host=get('organ-host'), names=get('organ-names');
  const heart=kind==='heart', namesOff='Selected structure • rotate to identify';
  let api,ready=false,lastAsset='',time=0,meshes=[],sac,tracks=[],moving,clockState=pressureState(0);
  let activeSegment=0, animated=[], animatedGroup,junctionDot, question=null,spotIndex=0;
  function appearance() {
    if(!ready)return;
    const m=mode.value, focus=target.value;
    const cut=m==='cut';
    const plane=new THREE.Plane(new THREE.Vector3(0,0,-1),.092-Number(get('cut').value)*.00105);
    for(const obj of meshes){
      const n=obj.name,isFocus=n===focus;
      obj.visible=heart?(m==='motion'?(n.includes('papillary')||n.includes('septum')):m==='valves'?valve(n):m==='thorax'||m==='surface'||m==='conduction'||cut):m==='leg'||vesselGroup[m](n);
      const mat=obj.material;
      const dim=focus && !isFocus, translucent=dim || m==='conduction' || m==='motion' || (m==='thorax' && !/wall_of/.test(n)) || (m==='leg' && !/artery/.test(n));
      const timeColor=linked&&!focus&&((n==='VH_M_mitral_valve'&&clockState.mitral)||(n==='VH_M_aortic_valve'&&clockState.aortic));
      mat.color.set(isFocus?'#ffd977':timeColor?'#8fdbc8':nameColor(n));
      mat.transparent=Boolean(translucent);
      mat.opacity=dim?.12:(m==='conduction'||m==='motion')?.13:translucent?.32:1;
      mat.depthWrite=!translucent;mat.side=THREE.DoubleSide;
      if((mat.clippingPlanes?.length||0)!==Number(cut))mat.needsUpdate=true;
      mat.clippingPlanes=cut?[plane]:[];
      obj.renderOrder=isFocus?2:0;
    }
    if(animated.length){
      const gradients=[clockState.la-clockState.lv,clockState.lv-clockState.ao];
      for(const [i,leaf] of animated.entries()){
        leaf.root.visible=m==='motion';
        if(leaf.root.visible)leaf.open(gradients[i]>0?Math.min(1,Math.sqrt(gradients[i]/(i?2:1.2))):0);
      }
    }
    if(sac)sac.visible=m==='surface'&&get('sac').checked;
    for(const [i,obj] of tracks.entries()){
      obj.visible=m==='conduction';
      obj.material.color.set(activeSegment===i||(activeSegment===3&&i===4)?'#ffe374':'#7f91a8');
    }
    if(moving){
      moving.visible=m==='conduction'&&activeSegment>=0;
      if(moving.visible){
        const stage=activeSegment,lo=phaseTimes[stage],hi=stage===3?228:phaseTimes[stage+1];
        moving.position.copy(tracks[stage].userData.curve.getPoint(THREE.MathUtils.clamp((time-lo)/(hi-lo),0,1)));
      }
    }
    const stage=traceLabels[activeSegment]||'Between activations';
    get('conduction-note').textContent=names.checked?stage:'Observe where the impulse travels';
    target.parentElement.hidden=!names.checked||Boolean(question);
    get('spot-area').hidden=!spotters[m];
    get('spot-start').disabled=!ready;get('focus-structure').disabled=!focus;
    if(!names.checked||question)get('specimen-note').hidden=true;
    else get('specimen-note').hidden=false;
    get('target-name').textContent=focus?(names.checked&&!question?structureName(focus):namesOff):'';
    api?.invalidate();
  }
  function choices() {
    const previous=target.value;
    target.replaceChildren(new Option('All structures',''));
    for(const o of meshes.filter(o=>o.visible).sort((a,b)=>a.name.localeCompare(b.name)))target.append(new Option(structureName(o.name),o.name));
    if([...target.options].some(o=>o.value===previous))target.value=previous;
  }
  function setup(instance) {
    api=instance;ready=true;
    instance.model.updateWorldMatrix(true,true);
    meshes=[];instance.model.traverse(o=>{if(o.isMesh)meshes.push(o);});
    if(mode.value!=='thorax'&&heart){
      if(linked){
        animated=[makeTeachingValve({center:[.0261,.4746,.0145],axis:[.47,-.39,.79],radius:.017,cusps:2}),makeTeachingValve({center:[.0089,.4971,.0279],axis:[-.40,.916,-.03],radius:.009,cusps:3})];
        animatedGroup=new THREE.Group();instance.model.add(animatedGroup);
        for(const valve of animated)animatedGroup.add(valve.root);
      }
      sac=addPericardialEnvelope(instance.model);
      tracks=conduction.map(points=>{
        const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
        const obj=new THREE.Mesh(new THREE.TubeGeometry(curve,28,.0013,7,false),new THREE.MeshBasicMaterial({color:0xffe374,depthTest:false}));
        obj.renderOrder=4;obj.userData.curve=curve;instance.model.add(obj);return obj;
      });
      moving=new THREE.Mesh(new THREE.SphereGeometry(.0025,12,9),new THREE.MeshBasicMaterial({color:0xfffae6,depthTest:false}));moving.renderOrder=5;instance.model.add(moving);
    }
    if(mode.value==='leg'){
      junctionDot=new THREE.Mesh(new THREE.SphereGeometry(.004,14,10),new THREE.MeshBasicMaterial({color:'#ffe486',depthTest:false}));
      junctionDot.renderOrder=6;junctionDot.visible=false;instance.model.add(junctionDot);
    }
    appearance();choices();instance.fit();
    // Distinguish a tap from an orbit, using the closest visible specimen surface.
    const canvas=instance.renderer.domElement,ray=new THREE.Raycaster();let start;
    canvas.addEventListener('pointerdown',event=>start=[event.clientX,event.clientY]);
    canvas.addEventListener('pointerup',event=>{
      if(question||!start||Math.hypot(event.clientX-start[0],event.clientY-start[1])>5)return;
      const rect=canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(2*(event.clientX-rect.left)/rect.width-1,1-2*(event.clientY-rect.top)/rect.height),instance.camera);
      const hit=ray.intersectObjects(meshes.filter(m=>m.visible),false).find(({object,point})=>!object.material.clippingPlanes?.some(p=>p.distanceToPoint(point)<0));
      if(hit&&[...target.options].some(o=>o.value===hit.object.name)){target.value=hit.object.name;appearance();}
    });
  }
  function changeMode() {
    question=null;spotIndex=0;get('spot-choices').hidden=true;get('spot-answer').textContent='';get('spot-start').disabled=true;
    const m=mode.value;
    get('spot-area').hidden=!spotters[m];
    const asset=m==='thorax'?'ap2-thorax':m==='leg'?'ap2-leg-vessels':heart?'ap2-heart':'ap2-vessels';
    get('junction-settings').hidden=m!=='leg';get('junction').value='';get('junction-note').textContent='';
    get('cut-settings').hidden=m!=='cut';get('sac-settings').hidden=m!=='surface';get('conduct-settings').hidden=m!=='conduction'||linked;
    get('specimen-note').textContent=heart?instructions[m]:vesselNotes[m];target.value='';
    if(lastAsset===asset&&ready){appearance();choices();api.fit(m==='motion'?animatedGroup:api.model,m==='motion'?[.02,1,-.63]:m==='valves'?[.12,1,.3]:undefined);return;}
    ready=false;sac=null;junctionDot=null;animated=[];tracks=[];moving=null;lastAsset=asset;target.replaceChildren(new Option('All structures',''));
    api=mountOrganViewer(host,{asset:'assets/'+asset+'.glb',title:mode.selectedOptions[0].text,colors:nameColor,direction:[.1,.06,1],onLoad:setup});
  }
  get('spot-start').onclick=()=>{
    const eligible=spotters[mode.value]?.filter(([name])=>meshes.some(m=>m.name===name&&m.visible));
    if(!eligible?.length)return;
    question=eligible[spotIndex++%eligible.length];target.value=question[0];appearance();
    const box=get('spot-choices');box.replaceChildren();box.hidden=false;
    get('spot-answer').textContent='Which structure is gold?';
    question.slice(1,4).forEach(label=>{
      const b=document.createElement('button');b.type='button';b.textContent=label;
      b.onclick=()=>{
        const expected=structureName(question[0]).replace(mode.value==='leg'?/^right /:/^$/,'').toLowerCase();
        if(label.toLowerCase()!==expected){
          get('spot-answer').textContent='Look at the highlighted structure again. Rotate the specimen to check its position.';return;
        }
        get('spot-answer').textContent='Correct. '+question[4];question=null;box.hidden=true;appearance();
      };box.append(b);
    });
  };
  get('junction').onchange=()=>{
    if(!ready||!junctionDot)return;
    const val=get('junction').value;
    junctionDot.visible=val!=='';
    if(val===''){get('junction-note').textContent='';api.fit();return;}
    const [,position,direction,note]=junctions[+val];
    junctionDot.position.set(...position);get('junction-note').textContent=note+' Gold marks the vessel name change.';
    const frame=new THREE.Mesh(new THREE.BoxGeometry(.11,.12,.11));frame.position.copy(junctionDot.position);
    api.fit(frame,direction);frame.geometry.dispose();frame.material.dispose();
  };
  get('focus-structure').onclick=()=>{
    const focus=meshes.find(m=>m.name===target.value);
    if(ready&&focus)api.fit(focus,api.camera.position.clone().sub(api.controls.target));
  };
  mode.onchange=changeMode;target.onchange=names.onchange=get('cut').oninput=get('sac').onchange=appearance;
  get('conduction-stage').oninput=()=>{activeSegment=+get('conduction-stage').value;time=phaseTimes[activeSegment]+6;appearance();};
  if(linked)lab.addEventListener('cardiobeat',e=>{clockState=e.detail;time=e.detail.t;activeSegment=conductionIndex(time);if(ready)appearance();});
  if(linked)mode.value='cut';
  changeMode();
}

