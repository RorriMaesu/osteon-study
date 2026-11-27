import {showOrganSelection} from './organ-selection-label.js';

// Selectable regional anatomy used by the endocrine chapter.
const zCredit = 'Z-Anatomy, based on BodyParts3D. Regional export in Blender 4.5. <a href="https://github.com/Z-Anatomy/Models-of-human-anatomy" target="_blank" rel="noreferrer">Source</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.';
const hraCredit = 'Human Reference Atlas, Kristen Browne and Heidi Schlehlein. <a href="https://humanatlas.io/3d-reference-library" target="_blank" rel="noreferrer">Reference organs</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.';
const neck = {
  title:'Thyroid and parathyroids in the neck', file:'neck.glb', credit:zCredit,
  note:'Find the isthmus crossing the front of the trachea. Rotate behind each thyroid lobe to see the smaller parathyroids. Their number and position vary.',
  targets:[
    ['Thyroid gland',/^thyroid$/,'#bf777e'],
    ['Left superior parathyroid gland',/^left_superior_parathyroid$/,'#eacc72'],
    ['Left inferior parathyroid gland',/^left_inferior_parathyroid$/,'#eacc72'],
    ['Right superior parathyroid gland',/^right_superior_parathyroid$/,'#eacc72'],
    ['Right inferior parathyroid gland',/^right_inferior_parathyroid$/,'#eacc72'],
    ['Thyroid cartilage',/^thyroid_cartilage$/,'#84b9bd'], ['Cricoid cartilage',/^cricoid$/,'#80a5ac'],
    ['Trachea',/^trachea$/,'#a2c4bc'], ['Hyoid bone',/^hyoid$/,'#ded4bc']
  ]
};
function sidedTargets(label, sourceName, color, note, format) {
  return ['Left', 'Right'].map(side => [
    side + ' ' + label, new RegExp('^' + format(sourceName, side) + '$'), color, note
  ]);
}
const tube = (label, name, color, note) => sidedTargets(label, name, color, note,
  (name, side) => 'VH_F_' + name + '_' + side[0]);
const scrotal = (label, name, color, note) => sidedTargets(label, name, color, note,
  (name, side) => side.toLowerCase() + '_' + name);
export const gonads={
  ovary:{title:'Ovaries in the pelvis',file:'ovarian-region.glb',credit:hraCredit,dir:[.08,.51,1],
    note:'The ovaries lie lateral to the uterus. Follow a uterine tube toward its fimbriae near the ovary. The ovaries, tubes, uterus and bony pelvis share the Visible Human Female coordinate frame.',
    targets:[
      ['Left ovary',/^VH_F_left_ovary$/,'#eebc7b'],
      ['Right ovary',/^VH_F_right_ovary$/,'#eebc7b'],
      ...tube('fimbriae','fibria_of_uterine_tube','#c499be','These fingerlike fringes lie beside the ovary and help guide the released oocyte into the tube.'),
      ...tube('infundibulum','uterine_tube_infundibulum','#be88ae','The abdominal opening of this tube is at its funnel-shaped end beside the ovary.'),
      ...tube('ampulla','ampulla_of_uterine_tube','#cf9caf','This broad segment is the usual site of fertilization.'),
      ...tube('uterine tube isthmus','isthmus_of_fallopian_tube','#b68ea8','This narrow portion of the tube approaches the uterine wall.'),
      ['Uterotubal junctions',/^VH_F_abdominal_ostium_of_uterine_tube$/,'#d3a5ca','These paired surfaces mark the uterine ends of the tubes, where the isthmuses meet the uterus.'],
      ['Uterine cornua',/^VH_F_cornua$/,'#ce8f96','The paired upper corners meet the uterine tubes. Both are represented by one surface.'],
      ['Uterine fundus',/^VH_F_fundus_of_uterus$/,'#c48190'],
      ['Uterine body',/^VH_F_body_of_uterus$/,'#bd7986'],
      ['Anterior uterine wall',/^VH_F_anterior_wall_of_uterus$/,'#b87983'],
      ['Posterior uterine wall',/^VH_F_posterior_wall_of_uterus$/,'#ab727d'],
      ['Lower uterine segment',/^VH_F_lower_uterine_segment$/,'#b38592'],
      ['Cervix',/^VH_F_cervix$/,'#be8e9b'],
      ['Internal cervical os',/^VH_F_internal_cervical_os$/,'#d69fae','The upper opening of the cervical canal communicates with the uterine cavity.'],
      ['External cervical os',/^VH_F_external_cervical_os$/,'#cf99ac','The lower opening of the cervical canal communicates with the vagina.'],
      ['Cervicovaginal junction',/^VH_F_cervicovaginal_junction$/,'#ae8795'],
      ['Sacrum',/^VH_F_sacrum$/,'#c6c5b7'],['Coccyx',/^VH_F_coccyx$/,'#c6c5b7'],
      ...['ilium','ischium','pubis'].flatMap(bone => tube(bone,bone+'_(compact|spongy)_bone','#c6c5b7','The compact and spongy portions are highlighted together on the selected side.'))
    ]},
  testis:{title:'Testes and neighboring structures',file:'testicular-region.glb',credit:zCredit,dir:[.36,.13,1],
    note:'Find each testis below the pubic symphysis. Follow the epididymis into the ductus deferens and upward into the pelvis. Leydig cells lie between seminiferous tubules within the testis.',
    targets:[
      ...scrotal('testis','testis','#eebc7b','Leydig cells within this organ secrete testosterone.'),
      ...scrotal('epididymis','epididymis','#c499be','Sperm mature in the epididymis before entering the ductus deferens.'),
      ...scrotal('ductus deferens','ductus_deferens','#eb9b96','This muscular duct carries sperm from the epididymis toward the ejaculatory duct.'),
      ...scrotal('seminal gland (seminal vesicle)','seminal_gland','#bc9c6e','This paired accessory gland contributes fluid to semen.'),
      ['Prostate',/^prostate$/,'#b08686'],['Urinary bladder',/^bladder$/,'#b0bcac'],['Pubic symphysis',/^pubic_symphysis$/,'#d1c8ac']]},
  placenta:{title:'Full-term placenta and umbilical cord',file:'placenta.glb',credit:hraCredit.replace('Kristen Browne and Heidi Schlehlein','Heidi Schlehlein'),dir:[.15,.5,1],
    note:'Explore the fetal and maternal faces of a separate full-term reference organ. Placental tissue supports progesterone production after the early ovarian contribution. The cord carries fetal blood.',
    targets:[['Maternal-facing basal plate',/basal/,'#a97078'],['Fetal chorionic plate',/chorionic/,'#ca8991'],['Amnion',/amnion/,'#d9c8be'],['Placental vessels',/placenta_vessels/,'#be7585'],
      ...[1,2].map(n=>['Umbilical artery '+n,new RegExp('umbilical_artery_'+n+'$'),'#87afd2','One of two arteries carrying fetal blood toward the placenta. Numbers distinguish the two vessels in this specimen.']),
      ['Umbilical vein',/umbilical_vein/,'#d58b84'],['Umbilical cord',/umbilical_cord/,'#c8bdac']]}
};
// Some reference organs nest individually labeled anatomy inside a node that
// also has a mesh (e.g. the cervical openings are children of the cervix).
// Give those static surfaces independent visibility while preserving their
// world coordinates, including rotations and offsets from the donor.
export function separateRegionalSurfaces(root){
  const nested=[];
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    for(let p=obj.parent;p&&p!==root;p=p.parent){
      if(p.isMesh){nested.push(obj);break;}
    }
  });
  for(const obj of nested)root.attach(obj);
}
export function regionSpecimen(host, kind, showModel, direction){
  const data=typeof kind==='object'?kind:kind==='neck'?neck:gonads[kind];
  host.innerHTML='<p>'+data.note+'</p><div data-region-canvas></div><label>Highlight a structure<select data-region-target><option value="">All structures</option>'+data.targets.map(([name],i)=>'<option value="'+i+'">'+name+'</option>').join('')+'</select></label><button type="button" data-region-focus disabled>Focus on selection</button><p data-region-detail aria-live="polite"></p><small>'+data.credit+'</small>';
  const picker=host.querySelector('[data-region-target]'),canvas=host.querySelector('[data-region-canvas]'),detail=host.querySelector('[data-region-detail]');
  const group=name=>data.targets.findIndex(([,pattern])=>pattern.test(name));
  const color=name=>data.colors?.[name]||data.targets[group(name)]?.[2]||'#bcb6a8';
  const focus=host.querySelector('[data-region-focus]');
  focus.insertAdjacentHTML('afterend',' <label><input type="checkbox" data-region-isolate disabled> Isolate selection</label>');
  const isolate=host.querySelector('[data-region-isolate]');
  let viewer,three;
  function frameGroup(match,direction){
    if(!viewer||!three)return;
    const group=new three.Group();
    viewer.model.traverseVisible(mesh=>{
      if(!mesh.isMesh||!match(mesh.name))return;
      // References are temporary and share the original geometry. Keep native coordinates.
      const part=mesh.clone(false);
      mesh.updateWorldMatrix(true,false);
      part.matrix.copy(mesh.matrixWorld);
      part.matrixAutoUpdate=false;
      group.add(part);
    });
    if(group.children.length)viewer.fit(group,direction);
  }
  focus.onclick=()=>{
    if(!viewer||picker.value==='')return;
    const pattern=data.targets[Number(picker.value)][1];
    frameGroup(name=>pattern.test(name),viewer.camera.position.clone().sub(viewer.controls.target));
  };

  function paint(){
    const selected=picker.value,match=selected===''?null:data.targets[Number(selected)];
    if(match)showOrganSelection(detail,{id:kind},'',match[0],match[3]);
    else detail.textContent='';
    focus.disabled=!viewer||!match;
    isolate.disabled=!match;
    if(!match)isolate.checked=false;
    if(!viewer)return;
    viewer.model.traverse(obj=>{
      if(!obj.isMesh)return;
      const active=match?.[1].test(obj.name),context=match&&!active;
      obj.visible=!isolate.checked||Boolean(active);
      const sheerBone=kind==='ovary'&&/bone|sacrum|coccyx/i.test(obj.name);
      const thinShell=kind==='placenta'&&/amnion|umbilical_cord/.test(obj.name);
      for(const mat of [].concat(obj.material)){
        mat.color.set(color(obj.name));
        mat.opacity=context ? .16 : (sheerBone||thinShell)&&!active ? .24:1;
        mat.transparent=mat.opacity<1; mat.depthWrite=!mat.transparent;
      }
    });
    viewer.invalidate();
  }
  picker.onchange=isolate.onchange=()=>{
    paint();
    if(isolate.checked)focus.onclick();
  };
  showModel(canvas,{asset:'assets/ap2-glands/'+data.file,title:data.title,direction:direction||data.dir||[0,0,1],colors:color,
    async onLoad(api){
      viewer=api; three=await import('three');
      if(!host.isConnected)return;
      separateRegionalSurfaces(api.model);
      const surface=api.renderer.domElement,ray=new three.Raycaster();
      let down=null;
      const press=event=>{down=[event.clientX,event.clientY];};
      const pick=event=>{
        if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5){down=null;return;}
        down=null;
        const box=surface.getBoundingClientRect(),parts=[];
        api.model.traverseVisible(o=>{if(o.isMesh&&group(o.name)>=0)parts.push(o);});
        ray.setFromCamera(new three.Vector2(2*(event.clientX-box.left)/box.width-1,1-2*(event.clientY-box.top)/box.height),api.camera);
        const hit=ray.intersectObjects(parts,false)[0];
        if(hit){picker.value=String(group(hit.object.name));paint();}
      };
      surface.addEventListener('pointerdown',press);surface.addEventListener('pointerup',pick);
      api.addCleanup(()=>{surface.removeEventListener('pointerdown',press);surface.removeEventListener('pointerup',pick);});
      paint();
      if(kind==='neck')api.fit(api.model.getObjectByName('thyroid'),direction||[0,0,1]);
      if(kind==='ovary')frameGroup(name=>group(name)>=0&&!/bone|sacrum|coccyx/i.test(name),data.dir);
    }});
}
