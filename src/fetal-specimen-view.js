import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import specimen from './fetal-skull-specimen.json' with {type:'json'};
import assets from './model-assets.json' with {type:'json'};

export function attachFetalSpecimen({viewer,toast}){
 let loading=null,request=0;
 const caption=document.createElement('div');caption.className='fetal-specimen-caption';caption.hidden=true;viewer.el.append(caption);
 const views={superior:{label:'Anterior / superior',direction:[0,1,.04],ids:['anterior']},posterior:{label:'Posterior site',direction:[0,.18,-1],ids:['posterior']},right:{label:'Right sites',direction:[-1,.08,.03],ids:['sphenoidal-r','mastoid-r']},left:{label:'Left sites',direction:[1,.08,.03],ids:['sphenoidal-l','mastoid-l']}};
 async function load(){
  if(!loading)loading=new GLTFLoader().loadAsync(new URL('assets/fetal-skull.glb?v='+assets['fetal-skull'],document.baseURI).href).then(gltf=>{
   gltf.scene.traverse(m=>{if(!m.isMesh)return;m.visible=false;m.userData.zname=m.userData.zname||m.name;m.userData.detailGroup='fetal-skull';m.userData.region='Skull';m.material=m.material.clone();m.material.side=THREE.DoubleSide;m.userData.authoredColor=m.material.color.clone();m.userData.authoredOpacity=m.material.opacity;viewer.meshes.push(m);});
   viewer.scene.add(gltf.scene);gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(m=>{if(m.isMesh)m.userData.bounds=new THREE.Box3().setFromObject(m);});return gltf.scene;
  }).catch(err=>{loading=null;throw err;});
  return loading;
 }
 viewer.openFetalSpecimen=async term=>{
  const job=++request;toast('Preparing the local UCSF developmental specimen…');
  try{await load();if(job!==request||viewer.quiz||viewer.referenceOpen||!viewer.el.getClientRects().length||viewer.selectedTerm?.id!==term.id)return;
   viewer.activeDetail='fetal-skull';viewer.cutaway=null;viewer.isolated=false;viewer.ghost=false;viewer.focus={level:'region',areaId:null,side:null,boneId:null};viewer.region='Skull';viewer.selected=viewer.meshes.filter(m=>m.userData.detailGroup==='fetal-skull');viewer.selectedTerm=term;
   const key=/posterior-fontanelle/.test(term.id)?'posterior':/sphenoidal|mastoid/.test(term.id)?'right':'superior';show(key,term.id);viewer.notifyFocus();toast('Developmental site guide loaded. Compare the newborn illustration for the open fontanelles.');
  }catch{toast('The scan could not load. Open the textbook comparison, then retry.');}
 };
 function show(key,termId=null){
  viewer.fetalSiteView=key;const config=views[key],sites=specimen.sites.filter(s=>config.ids.includes(s.id)),specific=termId&&termId!=='fontanelles'?sites.filter(s=>s.termId===termId):[];
  const chosen=specific.length?specific:sites;viewer.showPins(chosen.map(s=>({term:viewer.selectedTerm,point:s.point,label:s.label})),{labelled:true});viewer.applyVisibility();viewer.frame(viewer.meshes.filter(m=>m.userData.detailGroup==='fetal-skull'),config.direction);
 }
 viewer.renderFetalTools=()=>{
  const active=viewer.activeDetail==='fetal-skull'&&!viewer.quiz;caption.hidden=!active;if(!active)return false;
  const tools=viewer.detailTools;tools.hidden=false;tools.replaceChildren();const badge=document.createElement('span');badge.textContent='UCSF scan · developmental sites';tools.append(badge);
  const select=document.createElement('select');select.setAttribute('aria-label','Developmental skull view');for(const [key,config]of Object.entries(views)){const option=document.createElement('option');option.value=key;option.textContent=config.label;option.selected=viewer.fetalSiteView===key;select.append(option);}select.onchange=()=>show(select.value);tools.append(select);
  const source=document.createElement('button');source.type='button';source.textContent='Newborn comparison';source.onclick=()=>document.dispatchEvent(new CustomEvent('landmarksource',{detail:viewer.selectedTerm}));tools.append(source);
  caption.replaceChildren();const note=document.createElement('span');note.textContent='Site guides; some junctions are narrowed or closed. ';caption.append(note);const credit=document.createElement('a');credit.href=specimen.source;credit.target='_blank';credit.rel='noreferrer';credit.textContent='Rubio / UCSF · CC BY-NC';caption.append(credit);caption.title=specimen.notice;
  return true;
 };
 return{load};
}
