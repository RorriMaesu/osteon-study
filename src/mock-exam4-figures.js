import {muscleAssessmentFigure} from './muscle-exam-figures.js';
import {muscleFigureTargets} from './muscle-figure-targets.js';
import assets from './muscle-textbook-assets.json' with {type:'json'};
import {mockExam4MicroPlates} from './mock-exam4-micro-plates.js';
import {mockExam4FormCPlates} from './mock-exam4-form-c-plates.js';

export const mockExam4MatchingPlates={
 ...mockExam4MicroPlates,
 ...mockExam4FormCPlates,
 'coverings-r5':{
  ...mockExam4MicroPlates.coverings,
  label:'Cutaway of a whole muscle and a bundle pulled out in cross section. Four numbered markers point to structures at different levels of organization.',
  markerOffsets:{4:[-94,9]},
  markers:[
   ...mockExam4MicroPlates.coverings.markers,
   {number:4,point:[850,155],term:'Skeletal muscle fiber'},
  ],
 },
 'muscle-tissues':{
  figure:'10.2',
  label:'Three numbered light micrographs. Panel 1 shows parallel fibers with transverse stripes and elongated peripheral nuclei. Panel 2 shows elongated central nuclei and no visible stripes. Panel 3 shows branching fibers with prominent central nuclei.',
  panels:[
   {bounds:[102,19,275,266]},
   {bounds:[187,382,275,266]},
   {bounds:[102,748,275,266]},
  ],
  markerOffsets:{1:[-78,-71],2:[-78,-71],3:[-78,-71]},
  markers:[
   {number:1,point:[155,70],term:'Skeletal muscle'},
   {number:2,point:[238,435],term:'Smooth muscle'},
   {number:3,point:[156,799],term:'Cardiac muscle'},
  ],
 },
 face:{
  figure:'11.10',bounds:[0,20,995,934],
  label:'Lateral view of the superficial face and jaw. Four numbered markers.',
  masks:[[9,61,191,48],[9,817,170,51]],
  markerOffsets:{3:[68,27],4:[-63,31]},
  markers:[
   {number:1,point:muscleFigureTargets.temporalis.point,term:'Temporalis'},
   {number:2,point:[309,538],term:'Orbicularis oculi'},
   {number:3,point:muscleFigureTargets.masseter.point,term:'Masseter'},
   {number:4,point:[300,788],term:'Orbicularis oris'},
  ],
 },
 shoulder:{
  figure:'11.23',
  label:'Two posterior views of the left shoulder, superficial and deep. Four numbered markers.',
  panels:[
   {bounds:[1030,25,945,901],label:'Superficial posterior'},
   {bounds:[1430,1210,493,470],label:'Deep posterior'},
  ],
  masks:[[950,255,138,48],[950,484,289,58],[1355,1167,226,61],[1750,1668,177,85]],
  markerOffsets:{3:[103,-31],4:[-84,-36]},
  markers:[
   {number:1,point:[1278,320],term:'Deltoid'},
   {number:2,point:[1495,631],term:'Latissimus dorsi'},
   {number:3,point:[1740,1273],term:'Supraspinatus'},
   {number:4,point:[1800,1370],term:'Infraspinatus'},
  ],
 },
 leg:{
  figure:'11.32',
  label:'Anterior and posterior views of the right lower leg. Four numbered markers.',
  panels:[
   {bounds:[398,12,328,1224],label:'Anterior'},
   {bounds:[1214,12,319,1224],label:'Posterior'},
  ],
  markers:[
   {number:1,point:[561,375],term:'Tibialis anterior'},
   {number:2,point:[1350,331],term:'Gastrocnemius'},
   {number:3,point:[1400,645],term:'Soleus'},
   {number:4,point:[1354,960],term:'Calcaneal tendon'},
  ],
 },
};


const plates={
 'micro-skeletal':{figure:'10.2',bounds:[5,4,624,291],label:'Long parallel fibers in a muscle tissue micrograph.'},
 'micro-smooth':{figure:'10.2',bounds:[5,370,624,291],label:'Muscle tissue micrograph with elongated nuclei.'},
 'cover-epimysium':{figure:'10.3',bounds:[65,44,1152,510],point:[662,117],label:'Upper part of a cutaway of skeletal muscle. A ring marks the target.'},
 'cover-perimysium':{figure:'10.3',bounds:[354,68,850,460],point:[1034,349],label:'Skeletal muscle cutaway with a bundle drawn away from the whole muscle. A ring marks the target.'},
 'calcium-troponin':{figure:'10.8',bounds:[147,495,351,292],point:[286,634],label:'Magnified filaments below released calcium. A ring marks a protein on the thin filament.'},
 'calcium-reticulum':{figure:'10.9',bounds:[112,59,385,340],point:[321,308],label:'Skeletal muscle relaxation diagram. A ring marks a compartment beneath the membrane.'},
 'sarcomere-z-disc':{figure:'10.10',bounds:[120,48,830,480],point:[245,153],label:'A magnified sarcomere with a ring centered on the dark green zigzag at the left boundary.'},
 'quiz-forearm-extensor':{figure:'11.25',bounds:[1256,980,1125,847],point:[1886,1329],masks:[[2030,1588,351,54]],
  label:'Superficial dorsal view of the left forearm. A ring marks a muscle belly above the wrist.'},
 'quiz-gastrocnemius':{figure:'11.32',bounds:[843,47,695,805],point:[1346,315],masks:[[843,167,292,101],[843,333,292,108]],
  label:'Posterior view of the right lower leg with superficial tissue cut back. A ring marks one of the upper calf muscle heads.'},
};
function figureNumber(id){
 return mockExam4MatchingPlates[id]?.figure||plates[id]?.figure||muscleFigureTargets[id?.slice(14)]?.figure;
}

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function drawMatchingMarker({number,point},bounds,answer,fontSize,offset){
 const [x,y,w,h]=bounds,[px,py]=point;
 const unit=h/600;
 const radius=fontSize*.72*unit;
 const [dx,dy]=offset||[(px<x+w/2?1:-1)*fontSize*1.9,-fontSize*.82];
 const labelX=clamp(px+dx*unit,x+radius*1.16,x+w-radius*1.16);
 const labelY=clamp(py+dy*unit,y+radius*1.16,y+h-radius*1.16);
 const correct=answer==='Marker '+number;
 const fill=correct?'#187249':'#182e35';
 const stroke=correct?'#187249':'#7e2133';
 return `<g aria-hidden="true" data-matching-marker="${number}"><path d="M${px} ${py}L${labelX} ${labelY}" fill="none" stroke="#fff" stroke-width="${6*unit}"/><path d="M${px} ${py}L${labelX} ${labelY}" fill="none" stroke="${stroke}" stroke-width="${2.6*unit}"/><circle cx="${px}" cy="${py}" r="${8*unit}" fill="#fff" stroke="${stroke}" stroke-width="${2.8*unit}"/><circle cx="${labelX}" cy="${labelY}" r="${radius}" fill="${fill}" stroke="#fff" stroke-width="${2.6*unit}"/><text x="${labelX}" y="${labelY}" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="${fontSize*unit}" font-weight="700">${number}</text></g>`;
}

function renderMatchingPlate(plate,answer){
 const asset=assets[plate.figure];
 const panels=plate.panels||[{bounds:plate.bounds}];
 const height=600,gap=14;
 const widths=panels.map(({bounds:[,,w,h]})=>Math.round(w*height/h));
 const width=widths.reduce((sum,panelWidth)=>sum+panelWidth,0)+gap*(panels.length-1);
 const fontSize=Math.max(33,Math.ceil(width*12/320));
 const orientationSize=Math.min(37,fontSize);
 const viewportHeight=height+(plate.panels?orientationSize+16:0);
 const masks=[
  ...(plate.masks||[]).map(([x,y,width,height])=>`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#fff"/>`),
  ...(plate.maskPolygons||[]).map(points=>`<polygon points="${points}" fill="#fff"/>`),
 ].join('');
 let left=0;
 const artwork=panels.map(({bounds,label},i)=>{
  const [x,y,w,h]=bounds,panelWidth=widths[i];
  const marks=plate.markers.filter(({point:[px,py]})=>px>=x&&px<x+w&&py>=y&&py<y+h)
   .map(marker=>drawMatchingMarker(marker,bounds,answer,fontSize,plate.markerOffsets?.[marker.number])).join('');
  const panel=`<svg x="${left}" y="0" width="${panelWidth}" height="${height}" viewBox="${bounds.join(' ')}" overflow="hidden"><image href="assets/muscle-textbook/${asset.file}" width="${asset.width}" height="${asset.height}"/>${masks}${marks}</svg>`;
  const orientation=label?`<text x="${left+panelWidth/2}" y="${height+orientationSize}" text-anchor="middle" fill="#172c34" font-family="system-ui, sans-serif" font-weight="600" font-size="${orientationSize}">${label}</text>`:'';
  left+=panelWidth+gap;
  return panel+orientation;
 }).join('');
 const alt=plate.label+(answer?' Correct location: '+answer+'.':'');
 return `<figure class="exam-figure mock4-plate mock4-matching-plate"><svg viewBox="0 0 ${width} ${viewportHeight}" role="img" aria-label="${alt}"><rect width="${width}" height="${viewportHeight}" fill="#fff"/>${artwork}</svg><figcaption>OpenStax Fig. ${plate.figure} · adapted · CC BY-NC-SA 4.0</figcaption></figure>`;
}

export function renderMockExam4Figure(question,{reveal=false}={}){
 const matchingPlate=mockExam4MatchingPlates[question.figure];
 if(matchingPlate)return renderMatchingPlate(matchingPlate,reveal?question.answer:'');
 const plate=plates[question.figure];
 if(!plate)return (question.figure&&muscleAssessmentFigure(question.figure,{compactCaption:true}))||'<p role="status">This figure is unavailable.</p>';
 const asset=assets[plate.figure],[x,y,w,h]=plate.bounds;
 const radius=Math.min(w,h)*.03;
 const masks=(plate.masks||[]).map(([x,y,width,height])=>`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#fff"/>`).join('');
 const ring=plate.point?'<circle cx="'+plate.point[0]+'" cy="'+plate.point[1]+'" r="'+radius+'" fill="none" stroke="white" stroke-width="7"/><circle cx="'+plate.point[0]+'" cy="'+plate.point[1]+'" r="'+radius+'" fill="none" stroke="#9c2031" stroke-width="3.5"/>':'';
 return '<figure class="exam-figure mock4-plate"><svg viewBox="'+plate.bounds.join(' ')+'" role="img" aria-label="'+plate.label+'"><svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+plate.bounds.join(' ')+'" overflow="hidden"><image href="assets/muscle-textbook/'+asset.file+'" width="'+asset.width+'" height="'+asset.height+'"/>'+masks+ring+'</svg></svg><figcaption>OpenStax A&amp;P 2e Figure '+plate.figure+' · cropped for assessment · CC BY-NC-SA 4.0</figcaption></figure>';
}

export async function preloadMockExam4Figures(questions){
 const numbers=[...new Set(questions.map(q=>figureNumber(q.figure)).filter(Boolean))];
 const states=await Promise.all(numbers.map(number=>new Promise(resolve=>{
  const img=new Image();
  const timer=setTimeout(()=>resolve(false),10000);
  img.onload=()=>{clearTimeout(timer);resolve(true);};
  img.onerror=()=>{clearTimeout(timer);resolve(false);};
  img.src='assets/muscle-textbook/'+assets[number].file;
 })));
 return {ready:states.every(Boolean)};
}
