import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {winterExpandedControls} from './ap2-expanded-station.js';
import {organAssetUrl} from './organ-asset-url.js';
import {mountMetricScale} from './organ-metric-scale.js';

const instances = new WeakMap();
function release(root) {
  const resources = new Set();
  root.traverse(obj => {
    if (obj.geometry) resources.add(obj.geometry);
    for (const mat of [].concat(obj.material || [])) {
      for (const value of Object.values(mat)) if (value?.isTexture) resources.add(value);
      resources.add(mat);
    }
  });
  for (const resource of resources) resource.dispose();
}

export function mountOrganViewer(host, options) {
  if (!host) return;
  instances.get(host)?.dispose();
  options={...winterExpandedControls(host),...options};
  const title = options.title || '3D anatomy';
  host.innerHTML = '<div class="organ-viewport"></div><div class="organ-tools" aria-label="3D view controls"><button data-turn="left" aria-label="Rotate left">↶</button><button data-turn="right" aria-label="Rotate right">↷</button><button data-zoom="in" aria-label="Zoom in">+</button><button data-zoom="out" aria-label="Zoom out">−</button><select data-orientation aria-label="Preset view"><option value="home">Starting view</option><option value="reverse">Opposite view</option><option value="side">Side view</option><option value="above">View from above</option></select><button data-recenter>Reset view</button><button data-expand aria-expanded="false">Enlarge</button></div><small role="status" data-model-status></small><button type="button" data-retry-model hidden>Retry 3D model</button>';
  host.classList.add('organ-viewer');
  const viewport = host.querySelector('.organ-viewport'), notice = host.querySelector('[data-model-status]');
  const announce = message => {notice.textContent=message;};
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38,1,.001,100);
  const defaultView = new THREE.Vector3(...(options.direction || [0,0,1])).normalize();
  camera.up.set(...(options.up || [0,1,0])).normalize();
  scene.add(new THREE.HemisphereLight(0xffffff,0x9696a3,1.9));
  const key = new THREE.DirectionalLight(0xfff3e7,2.1);
  key.position.set(2,3,4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xddf0ff,1.15);
  fill.position.set(-3,1,-2); scene.add(fill);
  const viewingLight=new THREE.DirectionalLight(0xfff5e8,1.3);
  viewingLight.position.set(-.3,.6,1);camera.add(viewingLight,viewingLight.target);scene.add(camera);
  let renderer,controls,resizeObserver,onscreenObserver,removed,model,started=false,disposed=false,visible=false,frame=0,dirty=true,framed=false;
  let lastWidth=0,lastHeight=0,shownSeconds=0,lastTime=0,userMoved=false,currentRadius=1;
  const disposables = new Set();
  const api = {scene,camera,announce,fit,invalidate,dispose,loadLayer,addCleanup(fn){disposables.add(fn);},get model(){return model;},get controls(){return controls;},get renderer(){return renderer;}};
  const updateScale=options.asset==='assets/ap3-models/carnegie-stages.glb'?mountMetricScale(viewport,api):null;
  function keepInView() {
    const width=viewport.clientWidth,height=viewport.clientHeight;
    if(!renderer||width<=0||height<=0||width===lastWidth&&height===lastHeight)return;
    const previousAspect=camera.aspect;
    lastWidth=width;lastHeight=height;
    camera.aspect=width/height; camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    if(model&&framed&&controls&&previousAspect!==camera.aspect){
      // Keep the selected region and the learner's zoom level when resizing or enlarging.
      const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      const aperture=aspect=>Math.sin(Math.atan(tangent*Math.min(1,aspect)));
      const offset=camera.position.clone().sub(controls.target).multiplyScalar(aperture(previousAspect)/aperture(camera.aspect));
      camera.position.copy(controls.target).add(offset);controls.update();
    }else if(model&&!framed&&!userMoved)fit();
    invalidate();
  }
  function fit(target=model,direction=defaultView) {
    if(!target||!controls)return;
    const bounds=new THREE.Box3();
    for(const root of Array.isArray(target)?target:[target]){
      root.updateWorldMatrix(true,true);
      root.traverseVisible(obj=>{
        if(!obj.isMesh)return;
        if(!obj.geometry.boundingBox)obj.geometry.computeBoundingBox();
        if(obj.geometry.boundingBox)bounds.union(obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld));
      });
    }
    if(bounds.isEmpty())return;
    const sphere=bounds.getBoundingSphere(new THREE.Sphere());
    currentRadius=Math.max(sphere.radius,.00001);
    const dir=Array.isArray(direction)?new THREE.Vector3(...direction):direction.clone();
    dir.normalize();
    const side=new THREE.Vector3().crossVectors(camera.up,dir);
    if(side.lengthSq()<1e-8)side.crossVectors(Math.abs(dir.x)<.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1),dir);
    side.normalize();
    const up=new THREE.Vector3().crossVectors(dir,side);
    const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    let distance=0;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
      const offset=new THREE.Vector3(x,y,z).sub(sphere.center);
      const space=Math.max(Math.abs(offset.dot(side))/(tangent*camera.aspect),Math.abs(offset.dot(up))/tangent);
      distance=Math.max(distance,offset.dot(dir)+1.1*space);
    }
    distance=Math.max(distance,currentRadius*.35);
    controls.target.copy(sphere.center);
    camera.near=currentRadius/1000;camera.far=Math.max(distance+currentRadius*40,currentRadius*80);
    camera.updateProjectionMatrix();
    controls.minDistance=currentRadius*.16;controls.maxDistance=currentRadius*25;
    camera.position.copy(sphere.center).addScaledVector(dir.normalize(),distance);
    controls.update();framed=true;dirty=true;invalidate();
  }
  function invalidate(){
    dirty=true;
    if(!disposed&&visible&&renderer&&!frame)frame=requestAnimationFrame(draw);
  }
  function draw(now){
    frame=0;
    if(disposed||!visible||!renderer)return;
    const delta=lastTime?Math.min((now-lastTime)/1000,.1):0;
    shownSeconds+=delta;lastTime=now;
    if(model&&options.onFrame)options.onFrame(shownSeconds,api);
    if(controls)controls.update();
    if(dirty||options.onFrame){dirty=false;renderer.render(scene,camera);options.onRender?.(api);updateScale?.();}
    if(model&&options.onFrame&&!frame)frame=requestAnimationFrame(draw);
  }
  function turn(angle){
    if(!controls)return;
    const offset=camera.position.clone().sub(controls.target).applyAxisAngle(camera.up,angle);
    userMoved=true;camera.position.copy(controls.target).add(offset);controls.update();invalidate();
  }
  function zoom(multiplier){
    if(!controls)return;
    const offset=camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length()*multiplier,controls.minDistance,controls.maxDistance));
    userMoved=true;camera.position.copy(controls.target).add(offset);controls.update();invalidate();
  }
  let savedFocus;
  const expand=host.querySelector('[data-expand]');
  function enlarged(active){
    if(active)savedFocus=document.activeElement;
    host.classList.toggle('organ-expanded',active);
    options.onExpand?.(active);
    expand.textContent=active?(options.returnLabel||'Return to lesson'):'Enlarge';expand.setAttribute('aria-expanded',String(active));
    if(active)expand.focus();else if(savedFocus?.isConnected)savedFocus.focus();
    keepInView();
  }
  const presets=host.querySelector('[data-orientation]');
  const side=defaultView.clone().applyAxisAngle(camera.up,Math.PI/2);
  presets.onchange=()=>{
    if(!controls)return;
    userMoved=true;
    const dir={home:defaultView,reverse:defaultView.clone().negate(),side,above:camera.up.clone().addScaledVector(defaultView,.015)}[presets.value];
    const distance=camera.position.distanceTo(controls.target);
    camera.position.copy(controls.target).addScaledVector(dir.clone().normalize(),distance);
    controls.update();invalidate();
  };
  function keydown(ev){
    if(ev.key==='Tab'&&host.classList.contains('organ-expanded')){
      const focusables=[...host.querySelectorAll('canvas,button,select,input,summary,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length),first=focusables[0],last=focusables.at(-1);
      if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
    }
    if(ev.key==='Escape'&&host.classList.contains('organ-expanded')){ev.preventDefault();enlarged(false);return;}
    if(ev.target!==renderer?.domElement)return;
    const actions={ArrowLeft:()=>turn(-.15),ArrowRight:()=>turn(.15),'+':()=>zoom(.8),'=':()=>zoom(.8),'-':()=>zoom(1.25),Home:()=>fit()};
    if(actions[ev.key]){ev.preventDefault();actions[ev.key]();}
  }
  host.addEventListener('keydown',keydown);
  host.querySelector('[data-turn=left]').onclick=()=>turn(-Math.PI/8);
  host.querySelector('[data-turn=right]').onclick=()=>turn(Math.PI/8);
  host.querySelector('[data-zoom=in]').onclick=()=>zoom(.8);
  host.querySelector('[data-zoom=out]').onclick=()=>zoom(1.25);
  host.querySelector('[data-recenter]').onclick=()=>{userMoved=false;presets.value='home';fit();};
  expand.onclick=()=>enlarged(!host.classList.contains('organ-expanded'));
  async function fetchScene(asset){
    const decoder=new DRACOLoader().setDecoderPath(new URL('vendor/draco/',document.baseURI).href).setWorkerLimit(1);
    try{
      const loader=new GLTFLoader().setDRACOLoader(decoder);
      return (await loader.loadAsync(organAssetUrl(asset))).scene;
    }finally{decoder.dispose();}
  }
  const layers=new Map();
  function loadLayer(asset){
    if(disposed||!model)return Promise.reject(new Error('Specimen closed'));
    if(!layers.has(asset)){
      const pending=fetchScene(asset).then(layer=>{
        if(disposed){release(layer);throw new Error('Specimen closed');}
        model.add(layer);layer.updateWorldMatrix(true,true);invalidate();return layer;
      }).catch(error=>{layers.delete(asset);throw error;});
      layers.set(asset,pending);
    }
    return layers.get(asset);
  }
  async function start(){
    if(started||disposed)return;started=true;
    try {
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.localClippingEnabled=true;
      const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label',title+'. Drag to rotate, or use the view controls.');viewport.append(canvas);
      controls=new OrbitControls(camera,canvas);controls.enablePan=true;controls.enableDamping=false;
      controls.addEventListener('change',invalidate);controls.addEventListener('start',()=>{userMoved=true;});
      keepInView();
      const loaded=await fetchScene(options.asset);
      if(disposed){release(loaded);return;}
      model=loaded;
      options.prepare?.(model);
      model.traverse(obj=>{
        if(!obj.isMesh)return;
        if(options.include&&!options.include(obj.name,obj)){obj.visible=false;return;}
        const color=options.colors?.(obj.name,obj);
        if(color!=null){
          const mats=[].concat(obj.material).map(mat=>{const copy=mat.clone();disposables.add(()=>mat.dispose());copy.color?.set(color);
            // Specimen colors represent tissue. Bare glTF meshes otherwise get the metallic default.
            if('metalness' in copy){copy.metalness=0;copy.roughness=.80;}
            return copy;});
          obj.material=Array.isArray(obj.material)?mats:mats[0];
        }
      });
      scene.add(model);
      announce('Drag to rotate. Use + or − to zoom.');
      options.onLoad?.(api);
      if(!framed)fit();
      invalidate();
    } catch(err){
      if(disposed)return;
      const message=renderer?'The 3D specimen could not load.':'This browser could not start 3D graphics. Check hardware acceleration or try another browser.';
      announce(message+' The lesson and its labeled figures are available.');
      if(!model)host.querySelector('[data-retry-model]').hidden=false;
      console.warn('Organ viewer:',title,err.message);
    }
  }
  host.querySelector('[data-retry-model]').onclick=event=>{
    event.currentTarget.hidden=true;
    controls?.dispose();renderer?.domElement.remove();renderer?.dispose();renderer?.forceContextLoss();
    controls=null;renderer=null;lastWidth=0;lastHeight=0;started=false;
    announce('Loading '+title+'…');start();
  };
  function dispose(){
    if(disposed)return;disposed=true;
    if(host.classList.contains('organ-expanded'))options.onExpand?.(false);
    cancelAnimationFrame(frame);resizeObserver?.disconnect();onscreenObserver?.disconnect();removed?.disconnect();
    controls?.dispose();for(const fn of disposables)fn();release(scene);
    renderer?.dispose();renderer?.forceContextLoss();
    host.removeEventListener('keydown',keydown);host.classList.remove('organ-expanded');
    instances.delete(host);
  }
  instances.set(host,api);
  announce('Loading '+title+'…');
  resizeObserver=new ResizeObserver(keepInView);resizeObserver.observe(viewport);
  onscreenObserver=new IntersectionObserver(entries=>{
    visible=entries.at(-1).isIntersecting;
    if(visible){lastTime=0;start();invalidate();}else{cancelAnimationFrame(frame);frame=0;lastTime=0;}
  });onscreenObserver.observe(host);
  removed=new MutationObserver(()=>{if(!host.isConnected||!host.contains(viewport))dispose();});
  removed.observe(document.body,{subtree:true,childList:true});
  return api;
}
