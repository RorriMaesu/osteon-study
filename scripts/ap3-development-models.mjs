import {SphereGeometry} from 'three';

// In this teaching cross-section each supporting cell spans from the tubular
// basement membrane to the lumen. Its basal/body/apical widths differ. Two
// neighbors meet close to the base where Sertoli junctions form the barrier.
function sustentacularCell(angle){
  const geometry=new SphereGeometry(1,32,24),position=geometry.attributes.position;
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    const u=(y+1)/2,r=.935-.604*u;
    const basalWidth=.031+.113*Math.exp(-((u-.31)**2)/.035);
    const tangent=x*basalWidth+.015*Math.sin(2*Math.PI*u);
    const depth=.016+.099*Math.sin(Math.PI*u);
    position.setXYZ(i,r*Math.cos(angle)-tangent*Math.sin(angle),r*Math.sin(angle)+tangent*Math.cos(angle),depth+.044*z);
  }
  geometry.computeVertexNormals();return geometry;
}

/** Reproductive and developmental reconstructions share the exporter and palette
 * with the gross-to-microscopic spring teaching models. */
export async function developmentModels({C,put,sphere,tube,ring,slab,around,save}){
  // Sagittal female pelvis. Anterior is to the learner's left in this slice.
  put('pubic_symphysis',C.bone,sphere(-.75,-.12,-.02,.13,.33,.19));
  put('bladder','#c6ac75',sphere(-.44,.14,-.05,.31,.30,.22));
  put('urethra','#cca46e',tube([[-.47,-.07,.03],[-.50,-.27,.08],[-.50,-.52,.08]],.055));
  put('uterine_body',C.muscle,sphere(-.04,.52,-.03,.36,.38,.22).rotateZ(.14));
  put('cervix',C.epithelium,sphere(.17,.21,.02,.15,.20,.17));
  put('vagina',C.tissue,tube([[.18,.17,.02],[.11,-.06,.06],[-.09,-.33,.08],[-.22,-.63,.10]],.13));
  put('rectum','#b38991',tube([[.65,.70,-.12],[.55,.45,-.09],[.61,.08,-.05],[.47,-.25,.04],[.25,-.58,.10]],.144));
  put('clitoris','#c77688',sphere(-.62,-.45,.14,.075,.07,.07),
    tube([[-.59,-.44,.11],[-.52,-.38,.06],[-.46,-.31,-.08]],.048));
  put('labia_majora',C.tissue,[-.12,.14].map(z=>tube([[-.60,-.51,z],[-.48,-.68,z],[-.25,-.74,z],[-.09,-.70,z]],.088)));
  put('labia_minora','#b76b7e',[-.06,.06].map(z=>tube([[-.54,-.50,z],[-.45,-.61,z],[-.30,-.66,z],[-.17,-.67,z]],.043)));
  await save('pelvic-section');

  put('theca',C.tissue,sphere(0,0,-.04,.94,.87,.65,0,Math.PI));
  put('granulosa_layer','#ac7f98',sphere(0,0,.01,.83,.77,.59,0,Math.PI));
  put('antrum',C.fluid,sphere(.07,.01,.04,.64,.58,.44,0,Math.PI));
  put('cumulus_oophorus','#ba83a6',sphere(-.40,-.25,.04,.34,.28,.17));
  put('corona_radiata',C.duct,around(16,(_,a)=>sphere(-.38+Math.cos(a)*.21,-.17+Math.sin(a)*.21,.15,.059)));
  put('zona_pellucida','#f1cab1',ring(-.38,-.17,.15,.169,.025));
  put('oocyte',C.epithelium,sphere(-.38,-.17,.16,.145,.145,.12));
  await save('ovarian-follicle');

  put('basement_membrane',C.nucleus,ring(0,0,0,.95,.048));
  put('spermatogonia',C.tissue,around(24,(_,a)=>sphere(.84*Math.cos(a),.84*Math.sin(a),.01,.10,.10,.09)));
  put('spermatocytes','#9f7ea6',around(21,(_,a)=>sphere(.65*Math.cos(a),.65*Math.sin(a),.015,.114,.105,.11)));
  put('spermatids','#758ea3',around(27,(_,a)=>sphere(.475*Math.cos(a),.475*Math.sin(a),.04,.064)));
  put('spermatozoa','#626f92',around(21,(_,a)=>[
    sphere(.355*Math.cos(a),.355*Math.sin(a),.06,.038,.048,.037),
    tube([[.33*Math.cos(a),.33*Math.sin(a),.07],[.23*Math.cos(a+.18),.23*Math.sin(a+.18),.08],[.14*Math.cos(a-.13),.14*Math.sin(a-.13),.08]],.011)]));
  put('lumen',C.fluid,sphere(0,0,-.14,.33,.33,.035));
  const pairAngle=.83,halfGap=.142,sites=[pairAngle-halfGap,pairAngle+halfGap];
  put('sustentacular_cells','#78b4ac',sites.map(sustentacularCell));
  put('sustentacular_nuclei','#476e81',sites.map(a=>sphere(.763*Math.cos(a)-.014*Math.sin(a),.763*Math.sin(a)+.014*Math.cos(a),.095,.029,.029,.025)));
  const junction=[-.015,0,.015].map(d=>[.755*Math.cos(pairAngle+d),.755*Math.sin(pairAngle+d),.096]);
  put('sertoli_tight_junction','#e7bf6b',tube(junction,.012));
  put('interstitial_cells',C.duct,[[-.88,.72],[-.72,.87],[-.97,.89]].map(([x,y])=>sphere(x,y,0,.09)));
  await save('seminiferous-tubule');

  put('zygote',C.epithelium,sphere(-1.52,.04,0,.22));
  put('two_cell_stage',C.tissue,sphere(-.98,.04,0,.145,.195,.17),sphere(-.75,.04,0,.145,.195,.17));
  put('morula',C.wall,around(8,(i,a)=>sphere(-.16+.115*Math.cos(a),.04+.115*Math.sin(a),.045*Math.cos(i),.092)),
    sphere(-.16,.04,.08,.092),sphere(-.16,.04,-.04,.11));
  put('trophoblast',C.epithelium,sphere(.61,.04,-.012,.255,.235,.224,0,Math.PI),around(22,(_,a)=>sphere(.61+.23*Math.cos(a),.04+.215*Math.sin(a),.0,.035)));
  put('inner_cell_mass',C.nucleus,[[.49,.11],[.52,.16],[.56,.11],[.48,.05],[.54,.05]].map(([x,y])=>sphere(x,y,.04,.045)));
  put('blastocoel',C.fluid,sphere(.66,.01,-.06,.14,.125,.07,0,Math.PI));
  put('implanting_blastocyst',C.muscle,sphere(1.40,-.38,0,.245,.22,.20));
  put('endometrium',C.tissue,slab(1.37,-.59,-.015,.74,.30,.46),...[-.23,0,.23].map(x=>tube([[1.37+x,-.73,.19],[1.39+x,-.59,.19],[1.36+x,-.49,.19]],.030)));
  await save('cleavage-implantation');

  put('uterine_wall',C.muscle,sphere(0,.12,-.06,.80,1.06,.60,0,Math.PI));
  put('amniotic_sac',C.fluid,sphere(0,.15,-.02,.73,.96,.52,0,Math.PI));
  put('fetal_head','#dfb397',sphere(-.07,-.41,.05,.30,.33,.26));
  put('fetal_trunk','#c1988c',sphere(.08,.15,.01,.30,.44,.25).rotateZ(-.22));
  put('flexed_limbs','#ce9b91',tube([[.18,.38,.09],[.43,.24,.13],[.37,-.07,.18],[.16,-.02,.23]],.10),
    tube([[-.10,.19,.11],[-.31,.12,.13],[-.16,-.10,.17]],.073));
  put('placenta',C.tissue,sphere(.53,.62,-.12,.18,.36,.15).rotateZ(.15));
  put('umbilical_cord','#b19aa1',tube([[.45,.60,.04],[.27,.47,.25],[-.12,.56,.29],[-.17,.31,.28],[.02,.14,.22]],.052));
  put('cervix',C.epithelium,ring(0,-.91,.02,.22,.086).rotateX(Math.PI/2).translate(0,-.91,.93));
  put('birth_canal',C.tissue,tube([[0,-.94,-.10],[-.08,-1.17,-.08],[-.20,-1.42,.05]],.19));
  await save('birth-orientation');

  put('secretory_alveoli',C.epithelium,[-1,1].flatMap(k=>around(7,(i,a)=>sphere(k*.35+.18*Math.cos(a),.39+.20*Math.sin(a),.07*Math.cos(i),.138,.14,.12,0,Math.PI))));
  put('milk_in_lumina',C.wall,[-1,1].flatMap(k=>around(7,(i,a)=>sphere(k*.35+.18*Math.cos(a),.39+.20*Math.sin(a),.07*Math.cos(i)-.015,.096,.096,.08,0,Math.PI))));
  put('myoepithelial_cells',C.muscle,[-1,1].flatMap(k=>around(7,(_,a)=>ring(k*.35+.18*Math.cos(a),.39+.20*Math.sin(a),.025,.103,.018))));
  put('lactiferous_duct',C.duct,...[-1,1].map(k=>tube([[k*.35,.23,.03],[k*.23,.01,.05],[0,-.20,.03],[0,-.47,.04],[0,-.75,.06]],.061)));
  put('nipple',C.tissue,sphere(0,-.79,-.04,.29,.17,.18,0,Math.PI));
  await save('lactating-unit');
}

