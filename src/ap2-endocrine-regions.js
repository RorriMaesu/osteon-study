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
const gonads={
  ovary:{title:'Ovaries in the pelvis',file:'ovarian-region.glb',credit:hraCredit,dir:[.08,.51,1],
    note:'The ovaries lie lateral to the uterus. Follow a uterine tube toward its fimbriae near the ovary. The ovaries, tubes, uterus and bony pelvis share the Visible Human Female coordinate frame.',
    targets:[
      ['Left ovary',/^VH_F_left_ovary$/,'#eebc7b'],
      ['Right ovary',/^VH_F_right_ovary$/,'#eebc7b'],
      ['Fimbriae',/fibria|fimbria/i,'#c499be','Fingerlike fringes help guide the ovulated oocyte toward the abdominal opening.'],
      ['Infundibula',/infundibulum/i,'#be88ae','The abdominal opening of each tube is at the distal funnel beside the ovary. The highlighted surfaces are the funnels.'],
      ['Ampullae',/ampulla/i,'#cf9caf','The broad, curved segment between each infundibulum and isthmus is the usual site of fertilization.'],
      ['Isthmuses',/isthmus_of_fallopian/i,'#b68ea8','Each narrow isthmus approaches the wall of the uterus.'],
      ['Uterotubal junctions',/^VH_F_abdominal_ostium_of_uterine_tube$/,'#d3a5ca','These paired surfaces mark the uterine ends of the tubes, where the isthmuses meet the uterus.'],
      ['Uterus and cervix',/uterus|cerv|cornua|uterine_segment/i,'#bd7986'],
      ['Bony pelvis',/bone|sacrum|coccyx/i,'#c6c5b7']
    ]},
  testis:{title:'Testes and neighboring structures',file:'testicular-region.glb',credit:zCredit,dir:[.36,.13,1],
    note:'Find each testis below the pubic symphysis. Follow the epididymis into the ductus deferens and upward into the pelvis. Leydig cells lie between seminiferous tubules within the testis.',
    targets:[['Testes',/testis/,'#eebc7b'],['Epididymides',/epididymis/,'#c499be'],['Ductus deferentes',/ductus/,'#eb9b96'],['Seminal glands',/seminal/,'#bc9c6e'],['Prostate',/prostate/,'#b08686'],['Bladder',/bladder/,'#b0bcac'],['Pubic symphysis',/symphysis/,'#d1c8ac']]},
  placenta:{title:'Full-term placenta and umbilical cord',file:'placenta.glb',credit:hraCredit.replace('Kristen Browne and Heidi Schlehlein','Heidi Schlehlein'),dir:[.15,.5,1],
    note:'Explore the fetal and maternal faces of a separate full-term reference organ. Placental tissue supports progesterone production after the early ovarian contribution. The cord carries fetal blood.',
    targets:[['Maternal-facing basal plate',/basal/,'#a97078'],['Fetal chorionic plate',/chorionic/,'#ca8991'],['Amnion',/amnion/,'#d9c8be'],['Placental vessels',/placenta_vessels/,'#be7585'],['Umbilical arteries',/umbilical_artery/,'#87afd2'],['Umbilical vein',/umbilical_vein/,'#d58b84'],['Umbilical cord',/umbilical_cord/,'#c8bdac']]}
};
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
    detail.textContent=match?(match[3]||'Gold highlights '+match[0].toLowerCase()+'.'):'';
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
        mat.color.set(active?'#ffcd6c':color(obj.name));
        mat.opacity=context ? .16 : (sheerBone||thinShell)&&!active ? .24:1;
        mat.transparent=mat.opacity<1; mat.depthWrite=!mat.transparent;
      }
    });
    viewer.invalidate();
  }
  picker.onchange=isolate.onchange=paint;
  showModel(canvas,{asset:'assets/ap2-glands/'+data.file,title:data.title,direction:direction||data.dir||[0,0,1],colors:color,
    async onLoad(api){
      viewer=api; three=await import('three');
      if(!host.isConnected)return;
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
