import {Raycaster,Vector2} from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';

export const vesselWallTypes={
  walls:{parts:{
    artery_intima:['Artery · tunica intima','The endothelial lining and underlying connective tissue border the arterial lumen.'],
    artery_media:['Artery · tunica media','The thick circular smooth muscle layer changes the arterial lumen diameter.'],
    artery_externa:['Artery · tunica externa','The outer connective tissue reinforces the arterial wall and anchors it to nearby tissue.'],
    vein_intima:['Vein · tunica intima','In many limb veins, folds of the intima form valves that project into the lumen.'],
    vein_media:['Vein · tunica media','Less smooth muscle surrounds this wider lumen than in the comparable muscular artery.'],
    vein_externa:['Vein · tunica externa','The connective-tissue coat is prominent relative to the thin venous media.'],
    vein_leaflet:['Venous valve cusps','Two folds of intima admit forward flow toward the heart and meet when pressure would reverse flow.']
  },asset:'ap2-vessel-walls',direction:[.07,.77,1]},
  capillaries:{parts:{
    endothelium:['Endothelium','One layer of endothelial cells forms the lining in all three examples.'],
    nuclei:['Endothelial nuclei','These nuclear bulges belong to the flattened endothelial cells, viewed from the lumen.'],
    basement:['Basement membrane','This extracellular layer supports the outer side of the endothelial lining.']
  },asset:'ap2-capillary-barriers',direction:[.23,.09,1]}
};
const barrierInfo={
  continuous:['Continuous','Closely joined endothelial cells and a continuous basement membrane. Water and small solutes exchange to varying degrees depending on the tissue. Example: skeletal muscle.'],
  fenestrated:['Fenestrated','Small pores pass through the cells. A continuous basement membrane remains outside them. This arrangement facilitates fluid and solute exchange in many endocrine glands.'],
  sinusoidal:['Sinusoidal','Wider gaps between endothelial cells align with breaks in the basement membrane in this marrow example. Developing blood cells can enter the circulation through the sinusoidal wall.']
};
const option=(value,label)=>'<option value="'+value+'">'+label+'</option>';
export function vesselModelMarkup(){
  return '<details data-vessel-3d><summary>Compare vessel walls in 3D</summary><label>Model<select data-vessel-scale>'+option('walls','Muscular artery and vein with valve')+option('capillaries','Three capillary barriers')+'</select></label><div data-vessel-work></div></details>';
}
export function mountVesselModels(root){
  const details=root.querySelector('[data-vessel-3d]'),scale=details.querySelector('[data-vessel-scale]'),work=details.querySelector('[data-vessel-work]');
  function scene(){
    const kind=scale.value,spec=vesselWallTypes[kind],wall=kind==='walls';work.dataset.active=kind;
    const controls=wall?'<label>Venous pressure gradient<select data-wall-flow>'+option('forward','Toward the heart')+option('reverse','Tending to reverse')+'</select></label>':'<label>Capillary<select data-wall-type>'+Object.entries(barrierInfo).map(([k,[label]])=>option(k,label)).join('')+'</select></label>';
    work.innerHTML='<p>'+(wall?'Compare a muscular artery (left in the starting view) with a medium limb vein. A lengthwise cut exposes the tunics and opens a window onto the venous valve.':'View an enlarged patch of capillary wall from the lumen. Rotate around to the tissue side to see the basement membrane.')+'</p><div class="course-actions">'+controls+'<label>Inspect<select data-wall-pick>'+option('','All structures')+Object.entries(spec.parts).map(([k,[label]])=>option(k,label)).join('')+'</select></label><button type="button" data-wall-isolate disabled aria-pressed="false">Isolate selection</button></div><p data-wall-note aria-live="polite"></p><div data-vessel-stage></div><small>Osteon teaching reconstruction. Sizes, thicknesses, openings and travel are illustrative. <a href="assets/AP2-CARDIO-LICENSE.md" target="_blank" rel="noreferrer">Sources</a></small>';
    let viewer,isolated=false,frame=0,amount=0;const picker=work.querySelector('[data-wall-pick]'),solo=work.querySelector('[data-wall-isolate]'),type=work.querySelector('[data-wall-type]'),flow=work.querySelector('[data-wall-flow]'),note=work.querySelector('[data-wall-note]');
    const key=name=>wall?name.replace(/vein_leaflet_[ab]$/,'vein_leaflet'):name.slice(name.indexOf('_')+1);
    function paint(reframe=false){
      const selected=picker.value; if(!selected)isolated=false;
      solo.disabled=!viewer||!selected;solo.setAttribute('aria-pressed',String(isolated));solo.textContent=isolated?'Show surrounding structures':'Isolate selection';
      const context=wall?(flow.value==='reverse'?'The pressure gradient tends to drive blood away from the heart. Blood fills the valve pockets and the cusps meet.':'Blood moves through the open cusps toward the heart, upward in the starting view.'):barrierInfo[type.value][1];
      note.textContent=(selected?spec.parts[selected][1]+' ':'')+context;
      if(!viewer)return;
      viewer.model.traverse(obj=>{
        if(!obj.isMesh)return;
        const part=key(obj.name),active=part===selected;
        obj.visible=(wall||obj.name.startsWith(type.value+'_'))&&(!isolated||active);
        const mat=obj.material;if(!mat.userData.tint)mat.userData.tint=mat.color.clone();
        mat.color.copy(mat.userData.tint);if(active)mat.color.lerp({r:1,g:.70,b:.23},.5);
        mat.opacity=selected&&!active?.17:1;mat.transparent=mat.opacity<1;mat.depthWrite=!mat.transparent;
      });
      if(reframe)viewer.fit(viewer.model,viewer.camera.position.clone().sub(viewer.controls.target));
      viewer.invalidate();
    }
    function valve(t){
      amount=t;
      for(const side of ['a','b']){const leaf=viewer?.model.getObjectByName('vein_leaflet_'+side);if(leaf?.morphTargetInfluences)leaf.morphTargetInfluences[0]=t;}
      viewer?.invalidate();
    }
    if(flow)flow.onchange=()=>{
      const end=Number(flow.value==='reverse');cancelAnimationFrame(frame);paint();
      if(!viewer||matchMedia('(prefers-reduced-motion: reduce)').matches){valve(end);return;}
      const begin=performance.now(),from=amount;
      function move(now){const f=Math.min(1,(now-begin)/340);valve(from+(end-from)*f*f*(3-2*f));if(f<1)frame=requestAnimationFrame(move);}
      frame=requestAnimationFrame(move);
    };
    if(type)type.onchange=()=>{paint(true);};
    picker.onchange=()=>paint(isolated);
    solo.onclick=()=>{isolated=!isolated;paint(true);};
    paint();
    mountOrganViewer(work.querySelector('[data-vessel-stage]'),{title:wall?'Artery and vein wall cutaway':'Capillary wall cutaway',asset:'assets/'+spec.asset+'.glb',direction:spec.direction,onLoad(api){
      viewer=api;paint();if(wall)valve(Number(flow.value==='reverse'));
      const canvas=viewer.renderer.domElement,ray=new Raycaster();let down;
      const start=e=>{down=e.isPrimary?[e.clientX,e.clientY]:null;};
      const tap=e=>{
        if(!down||!e.isPrimary||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;down=null;
        const rect=canvas.getBoundingClientRect();
        ray.setFromCamera(new Vector2(2*(e.clientX-rect.left)/rect.width-1,1-2*(e.clientY-rect.top)/rect.height),api.camera);
        const meshes=[];api.model.traverseVisible(o=>{if(o.isMesh)meshes.push(o);});const hit=ray.intersectObjects(meshes,false)[0];if(hit){picker.value=key(hit.object.name);paint();}
      };
      canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointerup',tap);
      api.addCleanup(()=>{cancelAnimationFrame(frame);canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointerup',tap);});
    }});
  }
  scale.onchange=scene;
  details.addEventListener('toggle',()=>{if(details.open&&!work.firstElementChild)scene();});
}
