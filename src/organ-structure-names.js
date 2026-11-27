import {label} from './ap3-specimens-catalog.js';

const specific={
  body:{sigmoid_colon:'Sigmoid colon (approximate proximal boundary)'},
  adrenal:{medulla:'Adrenal medulla',fasciculata:'Zona fasciculata',glomerulosa:'Zona glomerulosa',reticularis:'Zona reticularis',capsule:'Adrenal capsule'},
  artery:{artery_intima:'Tunica intima',artery_media:'Tunica media',artery_externa:'Tunica externa',vein_intima:'Venous tunica intima',vein_media:'Venous tunica media',vein_externa:'Venous tunica externa',vein_leaflet_a:'Venous valve leaflets',vein_leaflet_b:'Venous valve leaflets'},
  'peripheral-nerve':{'First node':'Node of Ranvier (proximal)','Second node':'Node of Ranvier (distal)'},
  thyroid:{colloid_section:'Follicular colloid',parafollicular_cell:'Parafollicular cell (C cell)'},
  pineal:{pineal:'Pineal gland'}
};

export function organStructureName(entryId,raw){
  raw=raw.replace(/^(?:Node|Nerve) \| /,'');
  const fixed=specific[entryId]?.[raw];
  if(fixed)return fixed;
  if(entryId==='thyroid'&&/^follicle_cell_\d+_\d+$/.test(raw))return 'Thyroid follicular epithelium';
  if(entryId==='thyroid'&&/^cell_nucleus(?:\.\d+)?$/.test(raw))return 'Follicular cell nuclei';
  if(entryId==='glandular-pancreas'){
    const type=/^(alpha|beta|delta)_cell_\d+$/.exec(raw)?.[1];
    if(type)return 'Pancreatic islet '+type+' cells';
    if(/^acinar_cell_\d+_\d+$/.test(raw))return 'Pancreatic acinar cells';
    if(/^duct_(?:branch|collect)_\d+$/.test(raw))return 'Exocrine duct branches';
  }
  const papillary=/^VH_M_papillary_muscle_of_heart_(\w+)$/.exec(raw);
  if(papillary)return papillary[1][0].toUpperCase()+papillary[1].slice(1)+' papillary muscle';
  const isthmus=/^VH_F_isthmus_of_fallopian_tube_([LR])$/.exec(raw);
  if(isthmus)return 'Isthmus of uterine tube ('+(isthmus[1]==='L'?'left':'right')+')';
  if(raw==='VH_F_cornua')return 'Uterine horns (cornua)';
  const calyx=/^VH_F_(minor|major)_calyx_([LR])(?:_\w+)?$/.exec(raw);
  if(calyx)return (calyx[2]==='L'?'Left':'Right')+' '+calyx[1]+' calyces';
  if(entryId==='placenta'&&/^VH_F_umbilical_artery_[12]$/.test(raw))return 'Paired umbilical arteries';
  const atrium=/^(?:VH_M_)?(left|right)_(?:cardiac_)?atrium$/i.exec(raw);
  if(atrium)return atrium[1][0].toUpperCase()+atrium[1].slice(1)+' atrium';
  const name=raw.replace(/\.\d{3}$/,'').replace(/\.([lr])$/i,(_,s)=>s.toLowerCase()==='l'?' (left)':' (right)');
  return label(name).replace(/medial incisor/i,'central incisor').replace(/^Heart (left|right) ventricle$/i,(_,side)=>side[0].toUpperCase()+side.slice(1)+' ventricle');
}

export function organStructureGroups(entry,meshes,describe){
  const byTitle=new Map(),byRaw=new Map();
  for(const [raw,parts] of meshes){
    const title=describe?.(raw)||organStructureName(entry.id,raw);
    let group=byTitle.get(title);
    if(!group){group={title,terms:organSearchAliases(title),meshes:[],names:[],target:false};byTitle.set(title,group);}
    group.names.push(raw);
    group.meshes.push(...parts);group.target||=entry.targets.includes(raw);byRaw.set(raw,group);
  }
  for(const group of byTitle.values())group.meshes=[...new Set(group.meshes)];
  return {byRaw,groups:[...byTitle.values()].sort((a,b)=>Number(b.target)-Number(a.target)||a.title.localeCompare(b.title))};
}

export function organSearchAliases(title){
  if(/glomerular (?:capillary )?tuft/i.test(title))return 'glomerulus glomeruli';
  if(/glomerular capsule/i.test(title))return "Bowman Bowman’s Bowman's capsule";
  if(/mitral valve/i.test(title))return 'bicuspid left atrioventricular valve';
  if(/tricuspid valve/i.test(title))return 'right atrioventricular valve';
  return '';
}
