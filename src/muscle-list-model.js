import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

function disposeModel(root){
 root.traverse(mesh=>{
  mesh.geometry?.dispose();
  if(!mesh.material)return;
  for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
   for(const value of Object.values(material))if(value?.isTexture)value.dispose();
   material.dispose();
  }
 });
}

export function mountMuscleStudyModel(panel,model){
 const dialog=panel.closest('dialog'),stage=panel.querySelector('.muscle-list-model-stage');
 const status=stage.querySelector('[role="status"]'),preview=stage.querySelector('img');
 const buttons=[...panel.querySelectorAll('button')];
 buttons.forEach(button=>button.disabled=true);
 let renderer;
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
 }catch{
  status.textContent='3D is unavailable on this device. The illustration and source are still available.';
  return;
 }
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,40);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enablePan=false;
 controls.minDistance=1.4;
 controls.maxDistance=18;
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 scene.add(new THREE.HemisphereLight(0xfff3e5,0xa7bfbe,2.2));
 for(const [color,intensity,direction] of [[0xffebdd,2.5,[2,3,4]],[0xafdad9,1.6,[-3,1,-2]]]){
  const light=new THREE.DirectionalLight(color,intensity);light.position.fromArray(direction);scene.add(light);
 }
 const render=()=>renderer.render(scene,camera);
 controls.addEventListener('change',render);
 const direction=new THREE.Vector3().fromArray(model.view).normalize();
 let closed=false,object=null,distance=4;
 function reset(){camera.position.copy(direction).multiplyScalar(distance);controls.update();render();}
 function resize(){
  if(!stage.clientWidth||!stage.clientHeight||closed)return;
  const zoom=camera.position.length()/distance||1;
  camera.aspect=stage.clientWidth/stage.clientHeight;
  const vertical=THREE.MathUtils.degToRad(camera.fov/2);
  distance=1.08/Math.sin(Math.min(vertical,Math.atan(Math.tan(vertical)*camera.aspect)));
  camera.position.setLength(THREE.MathUtils.clamp(distance*zoom,controls.minDistance,controls.maxDistance));
  camera.updateProjectionMatrix();
  renderer.setSize(stage.clientWidth,stage.clientHeight,false);
  controls.update();render();
 }
 const observer=new ResizeObserver(resize);
 dialog.addEventListener('close',()=>{
  closed=true;observer.disconnect();controls.dispose();
  if(object)disposeModel(object);
  renderer.dispose();renderer.forceContextLoss();
 },{once:true});
 function adjust(theta=0,phi=0,zoom=1){
  if(!object)return;
  const orbit=new THREE.Spherical().setFromVector3(camera.position);
  orbit.theta+=theta;orbit.phi+=phi;orbit.makeSafe();
  orbit.radius=THREE.MathUtils.clamp(orbit.radius*zoom,controls.minDistance,controls.maxDistance);
  camera.position.setFromSpherical(orbit);controls.update();render();
 }
 panel.querySelectorAll('[data-model-turn]').forEach(button=>button.onclick=()=>adjust(Number(button.dataset.modelTurn)*.23));
 panel.querySelectorAll('[data-model-zoom]').forEach(button=>button.onclick=()=>adjust(0,0,Number(button.dataset.modelZoom)));
 panel.querySelector('[data-model-reset]').onclick=reset;
 const keys={ArrowLeft:[-.23],ArrowRight:[.23],ArrowUp:[0,-.18],ArrowDown:[0,.18],'+':[0,0,.83],'=':[0,0,.83],'-':[0,0,1.2]};
 stage.addEventListener('keydown',event=>{
  const movement=keys[event.key];
  if(!Array.isArray(movement))return;
  event.preventDefault();adjust(...movement);
 });
 new GLTFLoader().loadAsync(model.src).then(gltf=>{
  const root=gltf.scene;
  if(closed){disposeModel(root);return;}
  const sphere=new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  if(!Number.isFinite(sphere.radius)||sphere.radius<=0){
   disposeModel(root);throw new Error('The muscle geometry has no renderable bounds.');
  }
  object=new THREE.Group();root.position.sub(sphere.center);object.add(root);object.scale.setScalar(1/sphere.radius);
  scene.add(object);
  preview.remove();status.hidden=true;stage.prepend(renderer.domElement);observer.observe(stage);
  buttons.forEach(button=>button.disabled=false);
  reset();resize();
 }).catch(()=>{
  if(!closed)status.textContent='The 3D model could not load. Use the illustration or try opening the model again.';
 });
}
