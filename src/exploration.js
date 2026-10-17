import {skullFamily} from './anatomy.js';

export const baseName=name=>name.replace(/\.[lr]$/,'');
export const boneId=name=>/^(Manubrium of sternum|Body of sternum|Xiphoid process)$/.test(baseName(name))?'Sternum':name;
export const boneSide=name=>name.endsWith('.l')?'l':name.endsWith('.r')?'r':null;
export const isBone=name=>!/^Sinus /i.test(name)&&!/cartilage|tooth|canine|incisor|premolar|ligament|artery|disc|pulposus|symphysis/i.test(name);
const hand=/metacarpal|of hand|Scaphoid|Pisiform|Lunate|Triquetrum|Trapez|Capitate|Hamate/;
const foot=/Talus|Calcaneus|Navicular|Cuboid|cuneiform|metatarsal|of foot/;
const neck=/^Atlas|^Axis|^Vertebra C|^Hyoid/;
const shoulder=/^Clavicle|^Scapula/;
const ordinals=['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'];
const hues=['#edb16c','#68c5dd','#b8a0ed','#a3cb69','#e48eae','#75a6ed','#f0d76e','#69c8ad','#ed896a','#d9a1cb','#81cbd2','#c0d19a'];
const families=['Hyoid bone','Clavicle','Scapula','Humerus','Radius','Ulna','Hip bone','Femur','Patella','Tibia','Fibula','Talus','Calcaneus','Navicular bone','Cuboid bone','Medial cuneiform bone','Intermediate cuneiform bone','Lateral cuneiform bone','Scaphoid bone','Lunate bone','Triquetrum bone','Pisiform bone','Trapezium bone','Trapezoid bone','Capitate bone','Hamate bone','Sacrum','Coccyx','Sternum','Sesamoid bones of foot'];

export function boneFamily(name){
 if(!isBone(name))return null;
 const base=baseName(name),skull=skullFamily(name);
 if(skull)return{id:skull.pattern,name:skull.name,color:skull.color};
 let id=boneId(base),index=families.indexOf(id),label=id;
 const vertebra=/^Vertebra ([CTL])(\d+)$/.exec(base);
 if(base==='Atlas (C1)'){index=0;label='Atlas · C1';}
 else if(base==='Axis (C2)'){index=1;label='Axis · C2';}
 else if(vertebra){index=Number(vertebra[2])-1+({C:0,T:3,L:7}[vertebra[1]]);label=vertebra[1]+vertebra[2];}
 else if(/ rib$/.test(base)){index=ordinals.indexOf(base.split(' ')[0]);label=base;}
 else if(/metacarpal|metatarsal/.test(base)){index=ordinals.indexOf(base.split(' ')[0])+2;}
 else if(/phalanx/.test(base)){const digit=ordinals.findIndex(n=>base.toLowerCase().includes(n.toLowerCase()+' finger'));index=digit*2+(/^Proximal/.test(base)?0:/^Middle/.test(base)?4:8);label=base.replace('finger of foot','toe').replace('finger of hand','finger');}
 if(index<0)return null;
 return{id,name:label,color:hues[index%hues.length]};
}

export const areas={
 skull:{label:'Skull',macro:'Skull',core:n=>!neck.test(n)&&!/rib|sternum|Xiphoid/.test(n)&&!shoulder.test(n)&&!/Humerus|Radius|Ulna|Hip bone|Femur|Patella|Tibia|Fibula|Sacrum|Coccyx|Vertebra/.test(n)&&!hand.test(n)&&!foot.test(n)},
 neck:{label:'Neck',macro:'Spine',core:n=>neck.test(n),context:n=>/^Vertebra T[12]$/.test(n)},
 'thoracic-spine':{label:'Thoracic spine',macro:'Spine',core:n=>/^Vertebra T/.test(n),context:n=>/ rib$/.test(n)},
 'lower-back':{label:'Lower back',macro:'Spine',core:n=>/^Vertebra L/.test(n),context:n=>/^Sacrum$|^Vertebra T1[12]$/.test(n)},
 thorax:{label:'Thoracic cage',macro:'Thorax',core:n=>/ rib$|sternum|Xiphoid/.test(n),context:n=>/^Vertebra T|^Clavicle/.test(n)},
 shoulder:{label:'Shoulder girdle',macro:'Upper limb',sided:true,core:n=>shoulder.test(n),context:n=>/^Humerus/.test(n)},
 arm:{label:'Upper arm',macro:'Upper limb',sided:true,core:n=>/^Humerus/.test(n),context:n=>shoulder.test(n)||/^Radius|^Ulna/.test(n)},
 forearm:{label:'Forearm',macro:'Upper limb',sided:true,core:n=>/^Radius|^Ulna/.test(n),context:n=>/^Humerus/.test(n)||hand.test(n)},
 hand:{label:'Hand and wrist',macro:'Upper limb',sided:true,core:n=>hand.test(n),context:n=>/^Radius|^Ulna/.test(n)},
 pelvis:{label:'Pelvis',macro:'Pelvis',core:n=>/^Hip bone|^Sacrum|^Coccyx/.test(n),context:n=>/^Vertebra L5$|^Femur/.test(n)},
 thigh:{label:'Thigh',macro:'Lower limb',sided:true,core:n=>/^Femur/.test(n),context:n=>/^Hip bone|^Patella|^Tibia|^Fibula/.test(n)},
 knee:{label:'Knee',macro:'Lower limb',sided:true,core:n=>/^Patella/.test(n),context:n=>/^Femur|^Tibia|^Fibula/.test(n),padding:.11},
 leg:{label:'Leg',macro:'Lower limb',sided:true,core:n=>/^Tibia|^Fibula/.test(n),context:n=>/^Femur|^Patella/.test(n)||foot.test(n)},
 foot:{label:'Foot and ankle',macro:'Lower limb',sided:true,core:n=>foot.test(n),context:n=>/^Tibia|^Fibula/.test(n)},
};
export function areaForBone(name){
 if(!boneFamily(name))return null;
 const n=baseName(name);
 if(neck.test(n))return'neck';
 if(/^Vertebra T/.test(n))return'thoracic-spine';
 if(/^Vertebra L/.test(n))return'lower-back';
 if(/ rib$|sternum|Xiphoid/.test(n))return'thorax';
 if(shoulder.test(n))return'shoulder';
 if(/^Humerus/.test(n))return'arm';
 if(/^Radius|^Ulna/.test(n))return'forearm';
 if(hand.test(n))return'hand';
 if(/^Hip bone|^Sacrum|^Coccyx/.test(n))return'pelvis';
 if(/^Femur/.test(n))return'thigh';
 if(/^Patella/.test(n))return'knee';
 if(/^Tibia|^Fibula/.test(n))return'leg';
 if(foot.test(n))return'foot';
 return'skull';
}
export function inArea(name,id,side,{core=false}={}){
 const a=areas[id],n=baseName(name);
 if(!a||!isBone(name))return false;
 if(a.sided&&side&&boneSide(name)&&boneSide(name)!==side)return false;
 return !!(a.core(n)||(!core&&a.context?.(n)));
}
export function areaLabel(id,side){const label=areas[id]?.label||'Region';return areas[id]?.sided&&side?(side==='l'?'Left ':'Right ')+label[0].toLowerCase()+label.slice(1):label;}
export function navigationAction(focus,name,blocked=false){
 if(blocked||!areaForBone(name))return null;
 if(focus.level==='bone'&&focus.boneId===boneId(name))return null;
 if(focus.level!=='overview'&&(!focus.areaId||inArea(name,focus.areaId,focus.side)))return'bone';
 return'region';
}
