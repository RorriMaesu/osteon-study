export const muscleRegions={'head-neck':'Head & neck','trunk-back':'Trunk & back','shoulder-arm':'Shoulder & upper arm','forearm-hand':'Forearm & hand','pelvis-leg-foot':'Pelvis, leg & foot'};
export const muscleScopeNames={...muscleRegions,'upper-limb':'Entire upper limb',spine:'Spine & neck',all:'Whole body'};
export function muscleScopeRegions(region){return region==='all'?Object.keys(muscleRegions):region==='upper-limb'?['shoulder-arm','forearm-hand']:region==='spine'?['head-neck','trunk-back']:[region];}
export function componentVisible(c,s){return !c.retired&&s.enabled&&!s.quiz&&!s.activeDetail&&!s.hidden.has(c.id)&&muscleScopeRegions(s.region).includes(c.region)&&(s.side==='both'||c.side===s.side||c.side==='midline'||c.side==='bilateral')&&(s.support||c.kind==='muscle')&&(s.depth==='all'||c.depth===s.depth)&&(!s.focused||(s.selectedIds?s.selectedIds.has(c.id):c.id===s.selected));}
export function muscleBoneContext(name,region,side){
 if(region==='upper-limb'||region==='spine')return muscleScopeRegions(region).some(r=>muscleBoneContext(name,r,side));
 if(side!=='both'&&/\.[lr]$/.test(name)&&!name.endsWith(side==='right'?'.r':'.l'))return false;
 return ({'shoulder-arm':/^(Clavicle|Scapula|Humerus|Radius|Ulna)/,'forearm-hand':/^(Humerus|Radius|Ulna)|of hand|carpal|Scaphoid|Lunate|Triquetrum|Pisiform|Trapez|Capitate|Hamate/i,'head-neck':/frontal|parietal|occipital|temporal|zygomatic|sphenoid|ethmoid|palatine|nasal|lacrimal|vomer|mandib|maxill|Vertebra C|Atlas|Axis|Hyoid|Clavicle|Manubrium|First rib|Thyroid cartilage|Cricoid cartilage|Arytenoid cartilage|Corniculate cartilage|Intervertebral disc C|Nucleus pulposus C/i,'trunk-back':/rib|vertebra|Sternum|Manubrium|Xiphoid|Scapula|Clavicle|Hip bone|Sacrum|Coccyx|cartilage/i,'pelvis-leg-foot':/Hip bone|Sacrum|Coccyx|Femur|Patella|Tibia|Fibula|Talus|Calcaneus|Navicular|Cuboid|cuneiform|metatarsal|of foot|symphysis/i}[region]||/.*/).test(name);
}
export function componentColor(name){let h=0;for(const c of name)h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;return ['#b97765','#b69bc8','#70b7aa','#dfb867','#8eaed1','#d48d9b','#a8b66c','#c58f58'][h%8];}
export function muscleLabelPosition({width,height,ax,ay,rightEdge=width,labelWidth=230}){
 const right=Math.min(width,rightEdge);if(right<80||ax<0||ax>right||ay<0||ay>height)return null;
 const half=Math.min(labelWidth/2+6,right/2-8),preferred=ax<right/2?ax-130:ax+130,alternate=ax<right/2?ax+130:ax-130;
 const candidate=preferred-half>=8&&preferred+half<=right-8?preferred:alternate;
 return {x:right<600?right/2:Math.max(half+8,Math.min(right-half-8,candidate)),y:right<600?25:Math.max(25,Math.min(height-35,ay-35))};
}
const pilotFacts=[
 [/biceps brachii/i,'Biceps brachii','Long head: supraglenoid tubercle; short head: coracoid process.','Radial tuberosity, with the bicipital aponeurosis also transmitting force into forearm fascia.','Flexes the elbow and supinates the forearm; also assists shoulder flexion.'],
 [/triceps brachii/i,'Triceps brachii','Long head: infraglenoid tubercle; other heads: posterior humerus on the corresponding sides of the radial groove.','Olecranon of the ulna through the triceps tendon.','Extends the elbow; the long head also crosses the shoulder.'],
 [/deltoid muscle/i,'Deltoid','Lateral clavicle, acromion and spine of the scapula, according to the part.','Deltoid tuberosity of the humerus.','Acromial fibers abduct; anterior and posterior parts contribute different flexion and rotation actions.'],
 [/^Brachialis/i,'Brachialis','Distal anterior humerus.','Ulnar tuberosity and coronoid-process region.','Flexes the elbow.'],
 [/Coracobrachialis/i,'Coracobrachialis','Coracoid process.','Medial humeral shaft.','Assists shoulder flexion and adduction.'],
 [/Supraspinatus/i,'Supraspinatus','Supraspinous fossa.','Superior facet of the greater tubercle and adjacent capsule.','Assists initiation of abduction and contributes to rotator-cuff stabilization.'],
 [/Infraspinatus/i,'Infraspinatus','Infraspinous fossa.','Middle facet of the greater tubercle and adjacent capsule.','Laterally rotates the humerus and stabilizes the shoulder.'],
 [/Teres minor/i,'Teres minor','Lateral scapular border.','Inferior facet of the greater tubercle and adjacent capsule.','Laterally rotates the humerus and contributes to cuff stabilization.'],
 [/Subscapularis/i,'Subscapularis','Subscapular fossa.','Lesser tubercle and adjacent capsule.','Medially rotates the humerus and stabilizes the shoulder.']
];
export function muscleFacts(c){if(c.teaching)return c.teaching;const row=pilotFacts.find(([rx])=>rx.test(c.sourceName));return row?{name:row[1],origin:row[2],insertion:row[3],action:row[4],reference:'11.5'}:null;}
