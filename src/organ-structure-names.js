import {label} from './ap3-specimens-catalog.js';

const specific={
  adrenal:{medulla:'Adrenal medulla',fasciculata:'Zona fasciculata',glomerulosa:'Zona glomerulosa',reticularis:'Zona reticularis',capsule:'Adrenal capsule'},
  artery:{artery_intima:'Tunica intima',artery_media:'Tunica media',artery_externa:'Tunica externa'},
  'peripheral-nerve':{'First node':'Node of Ranvier (proximal)','Second node':'Node of Ranvier (distal)'},
  thyroid:{colloid_section:'Follicular colloid',parafollicular_cell:'Parafollicular cell (C cell)'},
  pineal:{pineal:'Pineal gland'}
};

export function organStructureName(entryId,raw){
  const fixed=specific[entryId]?.[raw];
  if(fixed)return fixed;
  if(entryId==='thyroid'&&/^follicle_cell_\d+_\d+$/.test(raw))return 'Thyroid follicular epithelium';
  if(entryId==='glandular-pancreas'){
    const type=/^(alpha|beta|delta)_cell_\d+$/.exec(raw)?.[1];
    if(type)return 'Pancreatic islet '+type+' cells';
  }
  const calyx=/^VH_F_(minor|major)_calyx_([LR])(?:_\w+)?$/.exec(raw);
  if(calyx)return (calyx[2]==='L'?'Left':'Right')+' '+calyx[1]+' calyces';
  if(entryId==='placenta'&&/^VH_F_umbilical_artery_[12]$/.test(raw))return 'Paired umbilical arteries';
  const name=raw.replace(/\.\d{3}$/,'').replace(/\.([lr])$/i,(_,s)=>s.toLowerCase()==='l'?' (left)':' (right)');
  return label(name).replace(/medial incisor/i,'central incisor').replace(/^Heart (left|right) ventricle$/i,(_,side)=>side[0].toUpperCase()+side.slice(1)+' ventricle');
}

export function organStructureGroups(entry,meshes){
  const byTitle=new Map(),byRaw=new Map();
  for(const [raw,parts] of meshes){
    const title=organStructureName(entry.id,raw);
    let group=byTitle.get(title);
    if(!group){group={title,meshes:[],target:false};byTitle.set(title,group);}
    group.meshes.push(...parts);group.target||=entry.targets.includes(raw);byRaw.set(raw,group);
  }
  return {byRaw,groups:[...byTitle.values()].sort((a,b)=>Number(b.target)-Number(a.target)||a.title.localeCompare(b.title))};
}
