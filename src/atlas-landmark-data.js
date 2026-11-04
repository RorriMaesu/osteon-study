import {allTerms,matches} from './data.js';
import './representations.js';
import source from './lab-list-source.json' with {type:'json'};
import authored from './atlas-label-anchors.json' with {type:'json'};
import {boneId} from './exploration.js';
import {inDivision} from './anatomy.js';

export const teacherIds=new Set(source.rows.flatMap(r=>r.termIds));
const parts=new Set(['manubrium','body-of-sternum','xiphoid-process']);
export const isOverlayLandmark=t=>t.type!=='bone'||parts.has(t.id);
export function category(t){return /ligament|joint|tissue|vessel|test/.test(t.type)?'joints':/microstructure|development/.test(t.type)||t.region==='Bone structure'?'development':/opening|cavity/.test(t.type)&&t.feature?.featureType!=='Articular feature'?'openings':'surfaces';}
export function featureGroup(t){
 const n=t.name.toLowerCase(),parent=t.representation?.parentPattern||t.pattern||'';
 if(t.region==='Bone structure')return /osteon|canalicul|lacuna|lamella|central canal|perforating canal|trabecul/.test(n)?'Microscopic bone':'Long-bone structure';
 if(/fontanel/.test(n))return 'Developmental sites';
 if(/labyrinth|cochlea|semicircular|vestibule|oval window|round window/.test(n))return 'Inner-ear spaces';
 if(t.region==='Skull')return /sinus|air cell/.test(n)?'Sinuses':/cranial fossa|sella|petrous|foramen ovale|rotundum|spinosum|lacerum|hypoglossal|carotid|jugular|internal acoustic/.test(n)?'Cranial base & interior':/suture|calvaria|pterion|nuchal|temporal line|occipital protuberance/.test(n)?'Vault & boundaries':'Face & lateral skull';
 if(t.region==='Spine')return /curvature/.test(n)?'Column overview':/sacr|coccy/.test(n+parent.toLowerCase())?'Sacrum & coccyx':/atlas|axis|dens|transverse foramen/.test(n+parent.toLowerCase())?'Cervical region':'Vertebral features & discs';
 if(t.region==='Thorax')return /stern|xiphoid|manubrium|jugular notch|clavicular notch/.test(n)?'Sternum':'Ribs & attachments';
 if(t.region==='Upper limb')return /scapul|glenoid|acrom|corac|clavicl/.test(n+parent.toLowerCase())?'Shoulder girdle':/humer|tubercle|capitulum|trochlea|fossa/.test(n+parent.toLowerCase())?'Humerus & elbow':/radius|ulna|radial|ulnar/.test(n+parent.toLowerCase())?'Forearm':'Wrist & hand';
 if(t.region==='Pelvis')return /sacr|sciatic|auricular/.test(n)?'Sacral & sciatic connections':/iliac|ilium/.test(n)?'Ilium':'Pubis, ischium & pelvic boundaries';
 if(t.region==='Lower limb')return /femur|femor|trochanter|patell|adductor|fovea/.test(n+parent.toLowerCase())?'Femur & knee':/tibia|fibula|malleol/.test(n+parent.toLowerCase())?'Leg & ankle':'Foot & arches';
 return /drawer|cruciate|collateral|patellar/.test(n)?'Knee':/femur|iliofemoral/.test(n)?'Hip':'Shoulder & other tissues';
}
export const atlasLandmarks=allTerms.filter(isOverlayLandmark).map(term=>({term,teacher:teacherIds.has(term.id),category:category(term),anchors:authored.anchors[term.id]||[],held:term.representation.assessment==='learn-only',retired:!!term.representation.retiredModel}));
export function anchorMatchesView(anchor,{visibleNames,detailGroup,bone,side}={}){
 if((anchor.detailGroup||null)!==(detailGroup||null))return false;
 if(visibleNames&&!visibleNames.has(anchor.parent))return false;
 if(bone&&boneId(anchor.parent)!==bone)return false;
 if(side&&/\.[lr]$/.test(anchor.parent)&&!anchor.parent.endsWith('.'+side))return false;
 return true;
}
export function scopedLandmarks({scope='teacher',division='All',visibleNames,detailGroup=null,bone=null,side=null}={}){
 return atlasLandmarks.filter(entry=>(scope!=='teacher'||entry.teacher)&&inDivision(entry.term,division)&&completeLandmarkContext(entry.term,visibleNames)).map(entry=>({...entry,viewAnchors:entry.anchors.filter(a=>anchorMatchesView(a,{visibleNames,detailGroup,bone,side}))})).filter(entry=>entry.viewAnchors.length);
}
export function completeLandmarkContext(term,visibleNames){const r=term.representation,required=r.requiredContext||(r.parentPattern?.includes('||')?r.parentPattern.split('||'):[]);return !visibleNames||required.every(pattern=>[...visibleNames].some(name=>matches(pattern,name)));}
export function findLandmarks({scope='teacher',division='All',query='',kind='all',region='All regions'}={}){
 const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return atlasLandmarks.filter(entry=>(scope!=='teacher'||entry.teacher)&&inDivision(entry.term,division)&&(kind==='all'||kind===entry.category)&&(region==='All regions'||entry.term.region===region)&&words.every(w=>[entry.term.name,...entry.term.aliases,entry.term.cue].join(' ').toLowerCase().includes(w))).sort((a,b)=>a.term.name.localeCompare(b.term.name));
}
// Labels are sparse and never overlap. If the viewport cannot accommodate one,
// the Find list still exposes it rather than placing a label over another term.
export function placeLabel(anchor,size,viewport,placed=[],reserved=[]){
 const {width:w,height:h,top=0}=viewport,bw=size.width/2+5,bh=size.height/2+5;
 if(w<2*bw||h-top<2*bh)return null;
 const candidates=[];
 for(let step=0;step<36;step++){const angle=step*2.4-1.1,r=55+Math.floor(step/6)*23;candidates.push({x:anchor.x+Math.cos(angle)*r,y:anchor.y+Math.sin(angle)*r});}
 for(let y=top+bh;y<h-bh;y+=2*bh+4)for(const x of [bw,w-bw])candidates.push({x,y});
 for(const p of candidates){p.x=Math.max(bw,Math.min(w-bw,p.x));p.y=Math.max(top+bh,Math.min(h-bh,p.y));const box={...p,bw,bh};if(![...placed,...reserved].some(q=>Math.abs(q.x-p.x)<q.bw+bw&&Math.abs(q.y-p.y)<q.bh+bh))return box;}
 return null;
}
export function overlayAllowed({quiz,referenceOpen,assessment}={}){return !quiz&&!referenceOpen&&!assessment;}
