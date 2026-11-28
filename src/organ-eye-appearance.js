import * as THREE from 'three';
import {correctEyeWinding} from './organ-eye-winding.js';

// Registration is specific to the bilateral, metre-scale Z-Anatomy export.
// The sagittal HRA specimen has a different donor, optical axis and cut plane.
const registered='assets/organ-atlas/registered-organs.glb';
const eyeName=/^(sclera|cornea|iris|lens|retina)_(left|right)$/;
const artwork='assets/organ-atlas/eye-iris-sclera.webp';
let sharedAtlas;

export function isEyeSurface(asset,name){return asset===registered&&eyeName.test(name);}

function acquireAtlas(ready,invalidate){
  if(typeof document==='undefined')return;
  if(!sharedAtlas){
    const record={texture:null,ready:false,users:new Set()};
    sharedAtlas=record;
    record.texture=new THREE.TextureLoader().load(artwork,()=>{
      record.ready=true;
      for(const owner of record.users){owner.ready.value=1;owner.invalidate();}
    },undefined,()=>{for(const owner of record.users)owner.invalidate();});
    record.texture.colorSpace=THREE.SRGBColorSpace;
    record.texture.anisotropy=2;
  }
  const record=sharedAtlas,owner={ready,invalidate};
  record.users.add(owner);ready.value=Number(record.ready);
  return {texture:record.texture,release(){
    record.users.delete(owner);
    if(!record.users.size){record.texture.dispose();if(sharedAtlas===record)sharedAtlas=undefined;}
  }};
}

// Lens and iris are behind the clear donor cornea. The artwork covers the
// pigmented tissue and white coat only; the pupil is the original mesh opening.
function mapEyeSurface(mesh,part,side){
  const original=mesh.geometry,geometry=original.clone();
  const sign=side==='left'?1:-1;
  const axis=new THREE.Vector3(.062*sign,.065,.996).normalize();
  const horizontal=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),axis).normalize();
  const vertical=new THREE.Vector3().crossVectors(axis,horizontal);
  const center=part==='sclera'?new THREE.Vector3(.030545*sign,1.590705,.0632):new THREE.Vector3(.0311366*sign,1.5912949,.0735275);
  const pos=geometry.getAttribute('position'),delta=new THREE.Vector3();
  const uv=part==='cornea'?null:new Float32Array(pos.count*2);
  const offsets=part==='sclera'?null:new Float32Array(pos.count*3);
  const rotation=side==='left'?.17:-.38,cos=Math.cos(rotation),sin=Math.sin(rotation);
  for(let i=0;i<pos.count;i++){
    delta.fromBufferAttribute(pos,i).sub(center);
    const x=delta.dot(horizontal),y=delta.dot(vertical),radius=Math.hypot(x,y);
    const dx=radius?x/radius:0,dy=radius?y/radius:0;
    let sampleRadius,distance;
    if(part==='iris'){
      const band=THREE.MathUtils.clamp((radius-.00159)/.00487,0,1);
      sampleRadius=(37+band*79)/584;
      // Up to 0.45 mm of centripetal movement at the pupillary margin.
      // Weight fades to exactly zero before the donor's fixed outer rim.
      distance=-.00045*(1-THREE.MathUtils.smoothstep(radius,.0018,.0059));
    }else if(part==='cornea'){
      // The donor cap ends 0.09–0.13 mm short of the surrounding white coat.
      // A 0.16 mm overlap closes its open seam only at the outer limbus.
      distance=.00016*THREE.MathUtils.smoothstep(radius,.00632,.00698);
    }else{
      const latitude=Math.atan2(radius,delta.dot(axis));
      sampleRadius=THREE.MathUtils.clamp(.221+.238*(latitude-.55),.219,.486);
    }
    if(uv){
      uv[2*i]=.5+sampleRadius*(dx*cos-dy*sin);
      uv[2*i+1]=.5+sampleRadius*(dx*sin+dy*cos);
    }
    if(offsets)for(let j=0;j<3;j++)offsets[3*i+j]=distance*(dx*horizontal.getComponent(j)+dy*vertical.getComponent(j));
  }
  if(uv)geometry.setAttribute('organEyeUv',new THREE.BufferAttribute(uv,2));
  mesh.geometry=geometry;
  let last=0;
  return {
    deform(amount){
      if(!offsets||amount===last)return;
      last=amount;
      const source=original.getAttribute('position');
      for(let i=0;i<pos.count;i++)pos.setXYZ(i,source.getX(i)+offsets[3*i]*amount,
        source.getY(i)+offsets[3*i+1]*amount,source.getZ(i)+offsets[3*i+2]*amount);
      pos.needsUpdate=true;
    },
    dispose(){mesh.geometry=original;geometry.dispose();}
  };
}

const irisPigment=`
  if (eyeNatural > .5) {
    vec3 pigment=vec3(.112,.055,.025);
    if(eyeAtlasReady>.5){
      vec3 sampleColor=texture2D(eyeAtlas,vOrganEyeUv).rgb;
      float luma=dot(sampleColor,vec3(.40,.48,.12));
      // Adapt the rust-red source pigment to warm brown; retain the sampled fibers.
      pigment=mix(vec3(luma)*vec3(1.48,.88,.46),sampleColor,.16)*2.1;
      pigment=max(pigment,vec3(.009,.005,.0035));
    }
    diffuseColor.rgb=pigment;
  }`;
const scleraPigment=`
  if(eyeNatural>.5){
    vec3 coat=vec3(.78,.75,.69);
    if(eyeAtlasReady>.5){
      vec3 sampleColor=texture2D(eyeAtlas,vOrganEyeUv).rgb;
      coat=clamp((sampleColor-vec3(.44))*1.48+vec3(.77,.755,.725),.19,.93);
    }
    coat*=mix(vec3(.65,.68,.69),vec3(1.),smoothstep(.220,.268,length(vOrganEyeUv-.5)));
    diffuseColor.rgb=coat;
  }`;
const irisInterior=`
  if(eyeNatural>.5){
    // With illumination outside the globe, little light returns through the pupil.
    diffuseColor.rgb=vec3(.008,.0036,.0029);
  }`;

// A small area light reflected in the tear film. Orient it in world space so
// the catchlight moves across the actual corneal dome as the specimen rotates.
const cornealReflection=`
  if(eyeNatural>.5){
    vec3 V=normalize(vViewPosition);
    vec3 R=inverseTransformDirection(reflect(-V,normal),viewMatrix);
    vec3 key=normalize(vec3(-.48,.62,.78));
    vec3 ax=normalize(cross(vec3(0.,1.,0.),key));
    vec3 ay=cross(key,ax);
    vec2 q=vec2(dot(R,ax)/.12,dot(R,ay)/.17);
    float gleam=(1.-smoothstep(.67,1.12,length(q)))*smoothstep(.8,.94,dot(R,key));
    float fill=smoothstep(.989,.9995,dot(R,normalize(vec3(.64,.22,.75))));
    float edge=pow(1.-max(dot(normal,V),0.),3.);
    float radius=length(vEyeCornea.xy);
    float limbus=smoothstep(.00595,.00705,radius);
    // The segmented iris ends medial to the scleral rim. The translucent
    // corneoscleral transition softens that otherwise abrupt dark border.
    float coatLight=.65+.35*max(dot(normal,normalize(mat3(viewMatrix)*key)),0.);
    vec3 border=mix(vec3(.17,.15,.13),vec3(.49,.49,.45),limbus)*coatLight;
    vec3 surface=mix(vec3(.12,.155,.16),border,limbus);
    float virtualIris=0.;
    if(eyeRefract>.5 && eyeAtlasReady>.5){
      // The limbus is the one place where seeing straight through the cap
      // produces a visible gap around the smaller, deeper donor iris. Project
      // the peripheral iris through the clear anterior surface at its real depth.
      vec3 ray=refract(-V,normal,1./1.336);
      vec3 along=vec3(dot(ray,vEyeHorizontal),dot(ray,vEyeVertical),dot(ray,vEyeAxis));
      vec3 straight=vec3(dot(-V,vEyeHorizontal),dot(-V,vEyeVertical),dot(-V,vEyeAxis));
      float depth=vEyeCornea.z-(.0011-.0022*smoothstep(.002,.007,radius));
      vec2 bent=vEyeCornea.xy-along.xy*(depth/min(-.03,along.z));
      vec2 direct=vEyeCornea.xy-straight.xy*(depth/min(-.03,straight.z));
      float virtualR=length(bent);
      virtualIris=smoothstep(.0044,.0062,length(direct))*(1.-smoothstep(.00638,.00678,virtualR));
      virtualIris*=smoothstep(.0042,.0051,virtualR)*(1.-limbus);
      vec2 dir=bent/max(virtualR,1.e-5);
      float band=clamp((virtualR-.00159)/.00487,0.,1.);
      vec3 sampled=texture2D(eyeAtlas,.5+eyePigmentRotation*dir*((37.+79.*band)/584.)).rgb;
      float value=dot(sampled,vec3(.40,.48,.12));
      vec3 amber=mix(vec3(value)*vec3(1.48,.88,.46),sampled,.16)*2.1;
      vec3 irisLight=max(amber,vec3(.009,.005,.0035))*(.68+.32*coatLight);
      surface=mix(surface,irisLight,virtualIris);
    }
    outgoingLight=mix(surface,vec3(1.55,1.54,1.49),clamp(gleam+.21*fill,0.,1.));
    diffuseColor.a=clamp(opacity*(.017+.13*edge+.85*gleam+.11*fill+.96*limbus+.98*virtualIris),0.,1.);
  }`;
const lensTransmission=`
  if(eyeNatural>.5){
    float edge=pow(1.-max(dot(normal,normalize(vViewPosition)),0.),3.);
    outgoingLight=vec3(.30,.32,.31);
    diffuseColor.a=opacity*(.008+.042*edge);
  }`;

export function createEyeAppearance(mesh,asset,name,invalidate=()=>{}){
  if(!mesh?.isMesh||!isEyeSurface(asset,name))return null;
  const [,part,side]=eyeName.exec(name);
  const pigment=part==='iris'||part==='sclera';
  const clear=part==='cornea'||part==='lens';
  const materials=[].concat(mesh.material);
  if(materials.some(mat=>!mat.isMeshStandardMaterial))return null;
  const restoreWinding=correctEyeWinding(mesh,name);
  const mapping=pigment||part==='cornea'?mapEyeSurface(mesh,part,side):null;
  const mode={value:0},ready={value:0},atlas={value:null},refract={value:0},order=mesh.renderOrder;
  const priorDraw=mesh.onBeforeRender;
  let correspondingIris;
  if(part==='cornea'||part==='sclera'){
    mesh.onBeforeRender=function(renderer,scene,camera,...rest){
      priorDraw.call(this,renderer,scene,camera,...rest);
      // A cornea isolated for identification must remain a clear shell.
      if(!correspondingIris)for(let node=mesh.parent;node;node=node.parent){
        correspondingIris=node.getObjectByName('iris_'+side);
        if(correspondingIris)break;
      }
      let visible=Boolean(correspondingIris?.isMesh&&camera.layers.test(correspondingIris.layers)&&
        [].concat(correspondingIris.material)[0].opacity>.65);
      for(let n=correspondingIris;visible&&n;n=n.parent)visible=n.visible;
      refract.value=Number(visible);
    };
  }
  const states=materials.map(mat=>{
    const prior=mat.onBeforeCompile,priorKey=mat.customProgramCacheKey;
    const key=priorKey.call(mat);
    const original={opacity:mat.opacity,transparent:mat.transparent,depthWrite:mat.depthWrite,roughness:mat.roughness,side:mat.side};
    mat.onBeforeCompile=function(shader,renderer){
      prior.call(this,shader,renderer);
      shader.uniforms.eyeNatural=mode;
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
        '#include <common>\nuniform float eyeNatural;');
      if(pigment||part==='cornea'){
        shader.uniforms.eyeAtlas=atlas;shader.uniforms.eyeAtlasReady=ready;
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
          '#include <common>\nuniform sampler2D eyeAtlas; uniform float eyeAtlasReady;');
      }
      if(pigment){
        shader.vertexShader=shader.vertexShader.replace('#include <common>',
          '#include <common>\nattribute vec2 organEyeUv; varying vec2 vOrganEyeUv;')
          .replace('#include <begin_vertex>','#include <begin_vertex>\nvOrganEyeUv=organEyeUv;');
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
          '#include <common>\nvarying vec2 vOrganEyeUv;');
      }
      if(part==='sclera'){
        shader.uniforms.eyeRefract=refract;
        shader.uniforms.eyeGlobeCenter={value:new THREE.Vector3(.030545*(side==='left'?1:-1),1.590705,.0632)};
        shader.vertexShader=shader.vertexShader.replace('#include <common>',
          '#include <common>\nuniform vec3 eyeGlobeCenter; varying vec3 vEyeRadialNormal;')
          .replace('#include <begin_vertex>','#include <begin_vertex>\nvEyeRadialNormal=normalize(normalMatrix*(position-eyeGlobeCenter));');
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
          '#include <common>\nuniform float eyeRefract; varying vec3 vEyeRadialNormal;')
          .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
            if(eyeNatural>.5 && gl_FrontFacing){
              float edge=1.-smoothstep(.221,.275,length(vOrganEyeUv-.5));
              normal=normalize(mix(normal,normalize(vEyeRadialNormal),edge));
            }`)
          .replace('#include <opaque_fragment>',`
            if(eyeNatural>.5 && eyeRefract>.5 && !gl_FrontFacing)outgoingLight=vec3(.008,.004,.003);
            #include <opaque_fragment>`);
      }
      if(clear){
        if(part==='cornea'){
          const sign=side==='left'?1:-1;
          shader.uniforms.eyeAxis={value:new THREE.Vector3(.062*sign,.065,.996).normalize()};
          shader.uniforms.eyeCenter={value:new THREE.Vector3(.0311366*sign,1.5912949,.0735275)};
          shader.uniforms.eyeRefract=refract;
          const twist=side==='left'?.17:-.38;
          shader.uniforms.eyePigmentRotation={value:[Math.cos(twist),Math.sin(twist),-Math.sin(twist),Math.cos(twist)]};
          const varyings='varying vec3 vEyeCornea,vEyeHorizontal,vEyeVertical,vEyeAxis;';
          shader.vertexShader=shader.vertexShader.replace('#include <common>',
            '#include <common>\nuniform vec3 eyeAxis; uniform vec3 eyeCenter; '+varyings)
            .replace('#include <begin_vertex>',`#include <begin_vertex>
              vec3 h=normalize(cross(vec3(0.,1.,0.),eyeAxis)),v=cross(eyeAxis,h);
              vec3 fromEye=position-eyeCenter;
              vEyeCornea=vec3(dot(fromEye,h),dot(fromEye,v),dot(fromEye,eyeAxis));
              vEyeHorizontal=normalize(normalMatrix*h);vEyeVertical=normalize(normalMatrix*v);
              vEyeAxis=normalize(normalMatrix*eyeAxis);`);
          shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
            '#include <common>\nuniform float eyeRefract; uniform mat2 eyePigmentRotation; '+varyings);
        }
        const reflection=part==='cornea'?cornealReflection:lensTransmission;
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',reflection+'\n#include <opaque_fragment>');
      }else{
        const color=part==='iris'?irisPigment:part==='sclera'?scleraPigment:irisInterior;
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+color);
      }
    };
    mat.customProgramCacheKey=()=>key+'|registered-eye-v1-'+part;
    mat.needsUpdate=true;
    return {mat,prior,priorKey,original,visibility:{...original}};
  });
  let texture,near=0;
  function update(){
    const natural=Boolean(mode.value);
    for(const {mat,original,visibility} of states){
      const transparent=natural&&clear||visibility.transparent;
      if(mat.transparent!==transparent){mat.transparent=transparent;mat.needsUpdate=true;}
      const face=natural&&part==='sclera'?THREE.DoubleSide:original.side;
      if(mat.side!==face){mat.side=face;mat.needsUpdate=true;}
      mat.depthWrite=natural&&clear?false:visibility.depthWrite;
      mat.opacity=visibility.opacity;
      mat.roughness=natural&&part==='iris'?.82:natural&&part==='sclera'?.43:original.roughness;
    }
    mesh.renderOrder=natural&&clear?order+(part==='cornea'?2:1):order;
    mapping?.deform(natural?(part==='cornea'?1:near):0);
  }
  return {
    setMode(value){
      mode.value=Number(value==='natural');
      if(mode.value&&(pigment||part==='cornea')&&!texture){texture=acquireAtlas(ready,invalidate);atlas.value=texture?.texture||null;}
      update();
    },
    applyVisibility(opacity,transparent=opacity<1,depthWrite=!transparent){
      for(const state of states)Object.assign(state.visibility,{opacity,transparent,depthWrite});
      update();
    },
    setNearFocus(amount){
      near=THREE.MathUtils.clamp(amount,0,1);
      if(mode.value&&part==='iris')mapping?.deform(near);
    },
    dispose(){
      texture?.release();mapping?.dispose();restoreWinding?.();mesh.renderOrder=order;
      if(part==='cornea'||part==='sclera')mesh.onBeforeRender=priorDraw;
      for(const {mat,original,prior,priorKey} of states){
        Object.assign(mat,original);mat.onBeforeCompile=prior;mat.customProgramCacheKey=priorKey;mat.needsUpdate=true;
      }
    }
  };
}
