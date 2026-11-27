import {CatmullRomCurve3,Mesh,MeshBasicMaterial,SphereGeometry,Vector3} from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';
import {fetalPaths,fetalSegments,fetalRoutes,newbornRoutes} from './ap2-fetal-paths.js';

const organs={right_atrium:'Right atrium',right_ventricle:'Right ventricle',left_atrium:'Left atrium',left_ventricle:'Left ventricle',right_lung:'Right lung',left_lung:'Left lung',liver:'Liver',placenta:'Placenta',bladder:'Bladder'};
export function fetalFlowHTML(){
  return '<section class="course-card" data-fetal-flow><h3>Trace the fetal circulation in 3D</h3><p>Choose a route, then play it or move the marker by hand. Gold marks the route. The bright marker follows blood flow.</p><div class="course-actions"><label>Circulation <select data-fetal-state><option value="fetal">Before birth</option><option value="newborn">After the newborn transition</option></select></label><label>Route <select data-fetal-route>'+fetalRoutes.map(r=>'<option value="'+r.id+'">'+r.name+'</option>').join('')+'</select></label><button type="button" data-fetal-play aria-pressed="false" disabled>Play route</button></div><label>Route position <input type="range" data-fetal-position min="0" max="100" step=".1" value="0"></label> <strong data-fetal-segment></strong><div data-fetal-view></div><p data-fetal-note aria-live="polite"></p><details><summary>Landmarks and scale</summary><p>Front view shows the subject’s right on your left. Two lungs flank the four chambers. The liver is below the heart. The placenta is shown outside the body. This spatial teaching diagram enlarges the shunts and separates overlapping vessels. Colors describe the selected route. The marker represents one stream through the circulation.</p><p data-fetal-steps></p><a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/20-6-development-of-blood-vessels-and-fetal-circulation" target="_blank" rel="noreferrer">Compare OpenStax Fig. 20.44 ↗</a></details></section>';
}
export function mountFetalFlow(host){
  const get=k=>host.querySelector('[data-fetal-'+k+']');
  const curves=Object.fromEntries(Object.entries(fetalPaths).map(([id,pts])=>[id,new CatmullRomCurve3(pts.map(p=>new Vector3(...p)))]));
  let api,marker,frame=0,last=0,selected;
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;get('play').textContent='Play route';get('play').setAttribute('aria-pressed','false');}
  function position(){
    const chain=selected.path;
    if(!chain.length){
      get('segment').textContent='Placental flow has stopped';
      get('position').setAttribute('aria-valuetext','Placental flow has stopped');
      if(marker){marker.visible=false;api.invalidate();}
      return;
    }
    const lengths=chain.map(id=>curves[id].getLength());
    let d=Number(get('position').value)/100*lengths.reduce((a,b)=>a+b,0),i=0;
    while(i<lengths.length-1 && d>lengths[i]){d-=lengths[i];i++;}
    const name=fetalSegments[chain[i]];
    get('segment').textContent=name;get('position').setAttribute('aria-valuetext',name);
    if(marker){marker.visible=true;marker.position.copy(curves[chain[i]].getPointAt(Math.min(1,d/lengths[i])));api.invalidate();}
  }
  function view(){
    const post=get('state').value==='newborn';
    const route=fetalRoutes.find(r=>r.id===get('route').value);
    selected=post?newbornRoutes[route.id]:route;
    for(const option of get('route').options){
      const fetal=fetalRoutes.find(r=>r.id===option.value);
      option.textContent=post?newbornRoutes[option.value].name:fetal.name;
    }
    stop();get('position').value='0';get('position').disabled=!selected.path.length;get('play').disabled=!selected.path.length||!api;
    get('note').textContent=selected.note;
    get('steps').textContent=selected.path.length?selected.path.map(id=>fetalSegments[id]).join(' → ')+'.':'';
    if(api)api.model.traverse(o=>{
      if(!o.isMesh||o===marker)return;
      if(o.name==='septal_flap'){o.visible=post;o.material.color.set('#b8b1a5');return;}
      const context=Object.hasOwn(organs,o.name), chosen=selected.path.includes(o.name);
      const m=o.material;
      m.color.set(context?(o.name.includes('lung')?'#aac8bb':o.name==='liver'?'#ad775c':o.name==='placenta'?'#bc7082':'#bd8683'):chosen?'#f1b349':'#8eafc5');
      m.transparent=context||!chosen;m.opacity=context?(o.name==='placenta'?.45:.17):chosen?1:.4;m.depthWrite=!m.transparent;
    });
    position();
  }
  function advance(now){if(!host.isConnected||!host.getClientRects().length||document.hidden){stop();return;}
    if(last)get('position').value=Math.min(100,Number(get('position').value)+Math.min(100,now-last)/85);
    last=now;position();if(Number(get('position').value)>=100)stop();else frame=requestAnimationFrame(advance);
  }
  get('play').onclick=()=>{if(frame){stop();return;}if(Number(get('position').value)>=100)get('position').value=0;get('play').textContent='Pause route';get('play').setAttribute('aria-pressed','true');frame=requestAnimationFrame(advance);};
  get('position').oninput=()=>{stop();position();};get('route').onchange=get('state').onchange=view;view();
  mountOrganViewer(get('view'),{asset:'assets/ap2-fetal-flow.glb',title:'Fetal shunts and circulation',direction:[.15,.06,1],colors:()=>'#a2bcb7',onLoad(ready){
    api=ready;marker=new Mesh(new SphereGeometry(.109,18,12),new MeshBasicMaterial({color:'#fff9cc',depthTest:false}));marker.renderOrder=5;api.model.add(marker);api.addCleanup(stop);view();
  }});
}
