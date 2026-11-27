import {select,table} from './ap3-labs-experiments.js';

// Isolated medullary collecting-duct segment. The permeability settings
// express an illustrative fraction of equilibration during transit.
function ductTrial(adh,gradient){
  const outside=gradient?900:300;
  const fraction=adh?0.9:0.1;
  const osmolarity=300+fraction*(outside-300);
  const volume=3000/osmolarity; // 3 mOsm/min divided by mOsm/L, converted to mL/min.
  return {outside,osmolarity,volume,water:10-volume};
}
const baseline=ductTrial(0,1);
const comparison=['More concentrated, with less urine','The same concentration and volume','Less concentrated, with more urine'];

export const collectingDuct={
  title:'Test ADH and the medullary gradient',section:'25.8',
  intro:'Compare one medullary collecting duct with its baseline of low ADH and an intact medullary gradient. Every trial receives 10 mL/min of fluid at 300 mOsm/L. Solute delivery and transit conditions stay fixed while you set water permeability and the surrounding interstitial concentration independently.',
  controls:[
    {...select('adh','ADH',['Low','High']),initial:1},
    {...select('gradient','Medullary gradient',['Flattened','Intact']),initial:1}
  ],
  nextTrial({adh,gradient}){
    // One change per trial, circling all four combinations.
    return Number(adh)===Number(gradient)?{adh,gradient:1-Number(gradient)}:{adh:1-Number(adh),gradient};
  },
  run({adh,gradient}){
    const high=Number(adh)===1,intact=Number(gradient)===1,trial=ductTrial(high,intact);
    const key=intact?(high?0:1):2;
    const reason=!intact?'The interstitium and entering fluid are both at 300 mOsm/L. With the driving force removed, even a water-permeable duct has no net osmotic water flux in this segment.':
      high?'High ADH places more aquaporin-2 channels in the luminal membrane. The concentrated interstitium draws more water out, leaving a smaller, more concentrated urine volume.':
      'Both settings match the baseline. Low water permeability limits reabsorption even though the interstitium is concentrated.';
    const units=row=>[row.water.toFixed(1)+' mL/min',row.volume.toFixed(1)+' mL/min',row.osmolarity+' mOsm/L'];
    return {
      duct:{high,intact,water:trial.water},observation:table('Reference and selected conditions',['Setting','Reference','Trial'],[
        ['ADH','Low',high?'High':'Low'],['Medullary interstitium','900 mOsm/L',trial.outside+' mOsm/L']]),
      question:'Compared with the reference, what urine will leave this segment?',
      choices:[comparison[key],...comparison.filter((_,i)=>i!==key)],why:reason,
      result:table('Simulated water and solute balance',['Condition','Water recovered','Urine leaving','Urine concentration'],[
        ['Reference',...units(baseline)],['Your trial',...units(trial)]]),
      note:'This isolated-segment model holds solute flow at 3 mOsm/min. Actual kidneys also change upstream delivery, solute transport and urea recycling.',
      frames:[
        ['Membrane',high?'ADH recruits apical aquaporin-2 channels in principal cells.':'Low ADH leaves few apical water channels in principal cells.'],
        ['Driving force',intact?'Interstitial fluid at 900 mOsm/L supplies an outward osmotic drive.':'A flat gradient supplies no osmotic driving force at the inlet.'],
        ['Water balance',trial.water.toFixed(1)+' mL/min of water is recovered and '+trial.volume.toFixed(1)+' mL/min leaves as urine. Holding solute flow constant gives '+trial.osmolarity+' mOsm/L.']
      ]
    };
  }
};

export function renderCollectingDuct({high,intact,water},revealed){
  const channels=high?[48,68,88,108]:[78];
  const tissueRows=intact?[18,18,18]:[6,6,6];
  const particles=tissueRows.flatMap((n,j)=>Array.from({length:n},(_,i)=>{
    const x=245+(i%8)*7,y=47+j*27+Math.floor(i/8)*5;
    return '<circle cx="'+x+'" cy="'+y+'" r="1.5" fill="#e2bf89"/>';
  })).join('');
  const outflow=revealed&&water>0?channels.map(y=>
    '<path d="M126 '+y+' H214 m-6 -4 6 4 -6 4" stroke="#8ddce7" stroke-width="2" fill="none"/>').join(''):'';
  return '<figure style="max-width:35rem;margin:.75rem auto"><svg aria-hidden="true" viewBox="0 0 352 140" style="display:block;width:100%;height:auto"><rect x="8" y="28" width="134" height="100" rx="10" fill="#254a55"/><rect x="144" y="28" width="50" height="100" fill="#34565d"/><rect x="196" y="28" width="148" height="100" rx="10" fill="#19343b"/>'+
    '<g fill="currentColor" font-size="12" text-anchor="middle"><text x="74" y="17">Duct lumen</text><text x="168" y="17">Cell</text><text x="265" y="17">Medulla</text></g>'+
    '<path d="M68 45 v58 m-5 -6 5 6 5 -6" stroke="#f2dfbe" stroke-width="2" fill="none"/>'+
    channels.map(y=>'<rect x="138" y="'+(y-4)+'" width="12" height="8" rx="2" fill="#b4e3d3"/>').join('')+particles+outflow+
    '</svg><figcaption>Collecting-duct section · bars mark apical water channels. Dots represent interstitial solute.'+
    (revealed?(water>0?' Arrows show net water movement toward the medulla.':' Water entry and exit balance. Net water movement is zero.'):'')+'</figcaption></figure>';
}
