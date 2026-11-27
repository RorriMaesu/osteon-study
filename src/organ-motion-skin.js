import * as THREE from 'three';

const asset='assets/skin-appendages/skin-appendages.glb';
const source='https://openstax.org/books/anatomy-and-physiology-2e/pages/5-2-accessory-structures-of-the-skin';
const layers=['epidermis','dermis','subcutaneous'];
const common={system:'Integumentary',section:'5.2',asset,source,bodyIds:['skin'],direction:[.03,.09,1],duration:8};
const phase=(at,label,text,sites)=>({at,label,text,sites});

export const skinOrgans=[
  {...common,id:'eccrine-sweating',title:'Eccrine sweat gland',action:'Trace sweat from its coil to a pore',
    aliases:['sweating','sudoriferous gland','sweat duct','sweat pore','acrosyringium','thermoregulation'],kind:'Process overlay',
    targets:['eccrine_coil','sweat_duct','sweat_pore'],context:layers,
    description:'In this magnified teaching cutaway, the blue tracer follows one continuous tube to the free skin surface. Its pore opens independently of a hair follicle.',
    phases:[
      phase(0,'Secretory coil','The coiled tubule deep in the skin secretes fluid into its lumen. Follow the blue bead through the coil.',['eccrine_coil']),
      phase(.38,'Sweat duct','Fluid moves toward the surface. Duct cells reabsorb some sodium and chloride on the way. The final segment spirals through the epidermis.',['sweat_duct']),
      phase(.83,'Surface pore','Sweat emerges at the pore. Heat leaves the body as the water evaporates.',['sweat_pore'])
    ]},
  {...common,id:'sebaceous-secretion',title:'Sebaceous gland and hair follicle',action:'Follow sebum to the hair shaft',
    aliases:['oil gland','pilosebaceous unit','hair follicle','holocrine secretion','sebum'],kind:'Process overlay',
    targets:['sebaceous_lobules','sebaceous_duct','follicular_wall','hair'],context:layers,direction:[.09,.11,1],
    description:'Gold follows sebum out of the lobulated oil gland and into the side of the hair follicle. Part of the follicular wall is cut away to reveal the shaft inside.',
    phases:[
      phase(0,'Sebaceous lobules','Lipid accumulates in maturing sebocytes. Whole cells break down and release their contents by holocrine secretion.',['sebaceous_lobules']),
      phase(.36,'Short sebaceous duct','Sebum empties into the upper follicle through a short side branch.',['sebaceous_duct']),
      phase(.62,'Follicular opening','Sebum travels along the hair toward the follicular opening and spreads over the hair and skin.',['follicular_wall','hair'])
    ]},
  {...common,id:'piloerection',title:'Arrector pili and hair follicle',action:'Raise and release a hair',
    aliases:['goosebumps','goose bumps','piloerection','hair raising','arrector pili muscle'],kind:'Organ movement',
    targets:['arrector_pili','follicular_wall','hair'],context:layers,duration:7,
    description:'Follow the rose-colored smooth muscle from its superficial dermal attachment to the follicle. As the muscle shortens, the shaft becomes more upright relative to the skin surface. The angle is enlarged for study.',
    phases:[
      phase(0,'Rest','The hair lies at an angle to the skin. A slender muscle links the follicle to the superficial dermis.',['arrector_pili']),
      phase(.20,'Contract','Sympathetic stimulation shortens the arrector pili. The follicle turns and the shaft stands more upright.',['arrector_pili']),
      phase(.54,'Raised hair','The muscle remains shorter while the shaft stays upright. This response can accompany cold or emotion.',['arrector_pili','hair']),
      phase(.72,'Relax','The smooth muscle relaxes and the hair returns toward its original angle.',['arrector_pili'])
    ]}
];

const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>(1-Math.cos(Math.PI*clamp(v)))/2;
function pathOf(mesh,key){
  let raw;
  for(let o=mesh;o&&!raw;o=o.parent)raw=o.userData?.[key];
  if(!Array.isArray(raw)||raw.length<6)return null;
  const points=[];
  for(let i=0;i<raw.length;i+=3)points.push(new THREE.Vector3(raw[i],raw[i+1],raw[i+2]).multiplyScalar(.001));
  const cumulative=[0];
  for(let i=1;i<points.length;i++)cumulative.push(cumulative[i-1]+points[i].distanceTo(points[i-1]));
  return {mesh,points,cumulative};
}

function follow(route,fraction,result){
  const {mesh,points,cumulative}=route,distance=clamp(fraction)*cumulative.at(-1);
  let i=1;
  while(i<cumulative.length-1&&distance>cumulative[i])i++;
  const u=(distance-cumulative[i-1])/(cumulative[i]-cumulative[i-1]||1);
  result.copy(points[i-1]).lerp(points[i],u);
  return mesh.localToWorld(result);
}

// Keep one label at the edge of the viewport while the leader tracks the
// specimen through orbiting, zooming, and changes in the hair shape.
function mountLabel(viewer){
  const viewport=viewer.renderer?.domElement?.parentElement;
  if(!viewport||typeof document==='undefined')return {show(){},dispose(){}};
  const ns='http://www.w3.org/2000/svg';
  const node=name=>document.createElementNS(ns,name);
  const svg=node('svg'),line=node('line'),dot=node('circle'),box=node('rect'),label=node('text');
  svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden';
  const previous=viewport.style.position;
  if(getComputedStyle(viewport).position==='static')viewport.style.position='relative';
  line.setAttribute('stroke','#d6ece7');line.setAttribute('stroke-width','1.25');
  dot.setAttribute('r','2.5');dot.setAttribute('fill','#fff2bc');dot.setAttribute('stroke','#29444a');
  box.setAttribute('fill','#142b31');box.setAttribute('stroke','#8bafa9');box.setAttribute('rx','5');
  label.setAttribute('fill','#f6f6eb');label.style.cssText='font:600 11px system-ui,sans-serif';
  svg.append(line,dot,box,label);viewport.append(svg);
  const anchor=new THREE.Vector3(),ndc=new THREE.Vector3();let value='',hasPoint=false;
  function draw(){
    if(!hasPoint)return;
    const w=viewport.clientWidth,h=viewport.clientHeight;
    ndc.copy(anchor).project(viewer.camera);
    const visible=w>130&&h>80&&Math.abs(ndc.x)<1&&Math.abs(ndc.y)<1&&ndc.z>=-1&&ndc.z<=1;
    svg.style.display=visible?'':'none';if(!visible)return;
    const px=(ndc.x+1)*w/2,py=(1-ndc.y)*h/2;
    const width=label.getComputedTextLength()+14,right=px<w*.44;
    const bx=right?w-6-width:6,by=py<h*.4?h-27:6;
    for(const [key,val] of Object.entries({x:bx,y:by,width,height:20}))box.setAttribute(key,val);
    label.setAttribute('x',bx+7);label.setAttribute('y',by+14);
    for(const [key,val] of Object.entries({x1:right?bx:bx+width,y1:by+10,x2:px,y2:py}))line.setAttribute(key,val);
    dot.setAttribute('cx',px);dot.setAttribute('cy',py);
  }
  const observer=new ResizeObserver(draw);observer.observe(viewport);
  viewer.controls?.addEventListener('change',draw);
  return {show(name,world){hasPoint=Boolean(world);if(!hasPoint){svg.style.display='none';return;}
    if(name!==value){value=name;label.textContent=name;}anchor.copy(world);draw();},
  dispose(){observer.disconnect();viewer.controls?.removeEventListener('change',draw);svg.remove();viewport.style.position=previous;}};
}

export function mountSkinMotion(entry,viewer,meshes){
  const sweat=entry.id==='eccrine-sweating',oil=entry.id==='sebaceous-secretion',pilo=entry.id==='piloerection';
  const first=k=>meshes.get(k)?.[0];
  const coil=sweat&&pathOf(first('eccrine_coil'),'path_mm');
  const duct=sweat&&pathOf(first('sweat_duct'),'path_mm');
  const sebaceous=oil&&pathOf(first('sebaceous_duct'),'sebum_mm');
  const branch=oil&&pathOf(first('sebaceous_duct'),'path_mm');
  const follicleJunction=branch&&sebaceous?branch.cumulative.at(-1)/sebaceous.cumulative.at(-1):0;
  const colored=new Map(),animated=[];
  for(const name of entry.targets){
    const materials=[];
    for(const m of meshes.get(name)||[]){
      for(const mat of [].concat(m.material||[]))if(mat?.emissive)
        materials.push({mat,color:mat.emissive.clone(),intensity:mat.emissiveIntensity});
      const index=m.morphTargetDictionary?.Piloerection;
      if(pilo&&index!==undefined)animated.push({mesh:m,index,rest:m.morphTargetInfluences[index]});
    }
    colored.set(name,materials);
  }
  const markerMat=new THREE.MeshBasicMaterial({color:sweat?'#64e4f4':'#ffd46a',depthTest:false,depthWrite:false,toneMapped:false});
  const geometry=new THREE.SphereGeometry(1,16,10);
  const bead=new THREE.Mesh(geometry,markerMat);bead.renderOrder=6;bead.visible=false;
  const cutawayName=sweat?'Sweat':oil?'Sebum':'Hair';
  bead.name=cutawayName+' process marker';viewer.scene.add(bead);
  const accents=new THREE.Color(pilo?'#d67c80':sweat?'#64d4de':'#f0b854');
  const label=mountLabel(viewer),site=new THREE.Vector3();
  const names=sweat?['Secretory coil','Sweat duct','Sweat pore']:oil?['Sebaceous lobules','Sebaceous duct','Hair shaft']:['Arrector pili','Arrector pili','Raised hair','Arrector pili'];
  // Select a real mid-bundle or above-surface vertex for a label that deforms
  // with its parent mesh. The build places each resting surface in Y-up metres.
  const attachment=new Map();
  if(pilo)for(const [name,height] of [['arrector_pili',-.00054],['hair',.00053]]){
    const mesh=first(name),pos=mesh.geometry.attributes.position;let best=0;
    for(let i=1;i<pos.count;i++)if(Math.abs(pos.getY(i)-height)<Math.abs(pos.getY(best)-height))best=i;
    attachment.set(name,{mesh,best});
  }
  let disposed=false;
  function set(t){
    if(disposed)return;
    t=clamp(t);
    let index=0;
    while(index+1<entry.phases.length&&t>=entry.phases[index+1].at)index++;
    const p=entry.phases[index],end=entry.phases[index+1]?.at??1,u=clamp((t-p.at)/(end-p.at));
    for(const [key,materials] of colored){
      const current=p.sites.includes(key);
      for(const {mat,color,intensity} of materials){
        mat.emissive.copy(color);
        if(current)mat.emissive.lerp(accents,.14+.08*Math.sin(Math.PI*u));
        mat.emissiveIntensity=current?Math.max(.75,intensity):intensity;
      }
    }
    bead.visible=false;
    if(pilo){
      const amount=index===0?0:index===1?smooth(u):index===2?1:1-smooth(u);
      for(const {mesh,index:shape} of animated)mesh.morphTargetInfluences[shape]=amount;
      const {mesh,best}=attachment.get(index===2?'hair':'arrector_pili');
      label.show(names[index],mesh.localToWorld(mesh.getVertexPosition(best,site)));
    }else if(sweat&&coil&&duct){
      bead.visible=true;
      if(index===0)follow(coil,u,bead.position);
      else follow(duct,index===1?u:1,bead.position);
      const drop=index===2?smooth(Math.min(1,u/.55))*(1-smooth((u-.65)/.35)):0;
      bead.scale.setScalar(.000037+.00005*drop);
      if(index===2){
        bead.position.y+=.000055*drop;
        bead.visible=u<.96;
      }
    }else if(oil&&sebaceous){
      bead.visible=true;
      const f=index===0?0:index===1?follicleJunction*u:follicleJunction+(1-follicleJunction)*u;
      follow(sebaceous,f,bead.position);
      bead.scale.setScalar(index===0?.000016+.000042*smooth(u):.000052);
    }
    if(!pilo)label.show(names[index],bead.visible||sweat&&index===2?bead.position:null);
    viewer.invalidate();
  }
  function dispose(){
    if(disposed)return;disposed=true;
    for(const {mesh,index,rest} of animated)mesh.morphTargetInfluences[index]=rest;
    for(const records of colored.values())for(const {mat,color,intensity} of records){
      mat.emissive.copy(color);mat.emissiveIntensity=intensity;
    }
    label.dispose();bead.removeFromParent();geometry.dispose();markerMat.dispose();
  }
  return {set,dispose};
}
