import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const planes=['Sagittal','Frontal','Transverse','Oblique'];
const colors=[0xff9c70,0x62c8ff,0xffdc65,0xc9a3fa];
const descriptions=['Separates right and left portions.','Separates anterior and posterior portions.','Separates superior and inferior portions.','Crosses at an angle to the standard planes.'];
let asset;

export function mountPlaneModel(root,fallback){
 const stage=root.querySelector('.foundation-plane-stage'),tools=root.querySelector('.foundation-plane-buttons');
 const fail=()=>{fallback();const notice=document.createElement('p');notice.setAttribute('role','status');notice.textContent='The 3D view is unavailable. The textbook diagram is shown instead.';root.prepend(notice);};
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{queueMicrotask(()=>{if(stage.isConnected)fail();});return ()=>{};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x122027);stage.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.01,30),orbit=new OrbitControls(camera,renderer.domElement);
 camera.position.set(2.6,1.65,3.3);orbit.target.set(0,.98,0);orbit.enablePan=false;orbit.minDistance=1.5;orbit.maxDistance=6;orbit.update();
 scene.add(new THREE.HemisphereLight(0xffffff,0x536067,2));
 const light=new THREE.DirectionalLight(0xffefd9,2);light.position.set(3,4,3);scene.add(light);
 const draw=()=>renderer.render(scene,camera),materials=[];
 const resize=new ResizeObserver(()=>{if(!stage.clientWidth||!stage.clientHeight)return;renderer.setSize(stage.clientWidth,stage.clientHeight,false);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();draw();});
 resize.observe(stage);orbit.addEventListener('change',draw);
 stage.tabIndex=0;stage.setAttribute('aria-label','3D body planes. Drag or use the arrow keys to rotate. Scroll, pinch, or use plus and minus to zoom.');
 stage.onkeydown=event=>{
  const steps={ArrowLeft:[-.16,0,0],ArrowRight:[.16,0,0],ArrowUp:[0,-.13,0],ArrowDown:[0,.13,0],'+':[0,0,-.25],'=':[0,0,-.25],'-':[0,0,.25]};
  const step=steps[event.key];if(!Array.isArray(step))return;event.preventDefault();
  const position=new THREE.Spherical().setFromVector3(camera.position.clone().sub(orbit.target));
  position.theta+=step[0];position.phi+=step[1];position.radius=THREE.MathUtils.clamp(position.radius+step[2],orbit.minDistance,orbit.maxDistance);position.makeSafe();
  camera.position.copy(new THREE.Vector3().setFromSpherical(position).add(orbit.target));orbit.update();draw();
 };
 let stopped=false;
 const detached=new MutationObserver(()=>{if(!stage.isConnected)clean();});
 detached.observe(document.querySelector('#study-view'),{subtree:true,childList:true});
 function clean(){if(stopped)return;stopped=true;detached.disconnect();resize.disconnect();orbit.dispose();renderer.dispose();renderer.forceContextLoss();materials.forEach(m=>m.dispose());}
 tools.innerHTML=planes.map((p,i)=>`<button data-plane="${i}" aria-pressed="${i===0}">${p}</button>`).join('')+'<span role="status">Loading the body model…</span>';
 asset??=new GLTFLoader().loadAsync(new URL('assets/foundations/body-planes.glb',document.baseURI).href).catch(error=>{asset=null;throw error;});
 asset.then(gltf=>{
  if(stopped)return;
  const model=gltf.scene.clone(true),surfaces=planes.map(name=>model.getObjectByName(name));scene.add(model);
  surfaces.forEach((surface,i)=>{surface.material=new THREE.MeshBasicMaterial({color:colors[i],transparent:true,opacity:.39,side:THREE.DoubleSide,depthWrite:false});surface.renderOrder=3;materials.push(surface.material);});
  function show(index){
   surfaces.forEach((s,i)=>{s.visible=index===i;});
   tools.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
   tools.querySelector('[role=status]').textContent=descriptions[index];draw();
  }
  tools.querySelectorAll('[data-plane]').forEach(b=>b.onclick=()=>show(+b.dataset.plane));show(0);
 }).catch(()=>{if(!stopped){clean();fail();}});
 return clean;
}
