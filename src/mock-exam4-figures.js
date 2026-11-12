import {muscleAssessmentFigure} from './muscle-exam-figures.js';
import {muscleFigureTargets} from './muscle-figure-targets.js';
import assets from './muscle-textbook-assets.json' with {type:'json'};

const plates={
 'micro-skeletal':{figure:'10.2',bounds:[5,4,624,291],label:'Long parallel fibers in a muscle tissue micrograph.'},
 'micro-smooth':{figure:'10.2',bounds:[5,370,624,291],label:'Muscle tissue micrograph with elongated nuclei.'},
 'cover-epimysium':{figure:'10.3',bounds:[65,44,1152,510],point:[662,117],label:'Upper part of a cutaway of skeletal muscle. A ring marks the target.'},
 'cover-perimysium':{figure:'10.3',bounds:[354,68,850,460],point:[1034,349],label:'Skeletal muscle cutaway with a bundle drawn away from the whole muscle. A ring marks the target.'},
 'calcium-troponin':{figure:'10.8',bounds:[147,495,351,292],point:[286,634],label:'Magnified filaments below released calcium. A ring marks a protein on the thin filament.'},
 'calcium-reticulum':{figure:'10.9',bounds:[112,59,385,340],point:[321,308],label:'Skeletal muscle relaxation diagram. A ring marks a compartment beneath the membrane.'},
};
function figureNumber(id){
 return plates[id]?.figure||muscleFigureTargets[id?.slice(14)]?.figure;
}
export function renderMockExam4Figure(question){
 const plate=plates[question.figure];
 if(!plate)return muscleAssessmentFigure(question.figure)||'<p role="status">This figure is unavailable.</p>';
 const asset=assets[plate.figure],[x,y,w,h]=plate.bounds;
 const radius=Math.min(w,h)*.03;
 const ring=plate.point?'<circle cx="'+plate.point[0]+'" cy="'+plate.point[1]+'" r="'+radius+'" fill="none" stroke="white" stroke-width="7"/><circle cx="'+plate.point[0]+'" cy="'+plate.point[1]+'" r="'+radius+'" fill="none" stroke="#9c2031" stroke-width="3.5"/>':'';
 return '<figure class="exam-figure mock4-plate"><svg viewBox="'+plate.bounds.join(' ')+'" role="img" aria-label="'+plate.label+'"><svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+plate.bounds.join(' ')+'" overflow="hidden"><image href="assets/muscle-textbook/'+asset.file+'" width="'+asset.width+'" height="'+asset.height+'"/>'+ring+'</svg></svg><figcaption>OpenStax A&amp;P 2e Figure '+plate.figure+' · cropped for assessment · CC BY-NC-SA 4.0</figcaption></figure>';
}

export async function preloadMockExam4Figures(questions){
 const numbers=[...new Set(questions.filter(q=>q.type==='identify').map(q=>figureNumber(q.figure)).filter(Boolean))];
 const states=await Promise.all(numbers.map(number=>new Promise(resolve=>{
  const img=new Image();
  const timer=setTimeout(()=>resolve(false),10000);
  img.onload=()=>{clearTimeout(timer);resolve(true);};
  img.onerror=()=>{clearTimeout(timer);resolve(false);};
  img.src='assets/muscle-textbook/'+assets[number].file;
 })));
 return {ready:states.every(Boolean)};
}
