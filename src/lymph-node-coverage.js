import {lymphNodeRecords,lymphNodeTermByKey,lymphRegions,lymphNodeStatus} from './lymph-node-data.js';

const region=document.querySelector('#node-region'),rows=document.querySelector('#node-rows');
for(const [key,name] of Object.entries(lymphRegions)){
 if(lymphNodeRecords.some(r=>r.bucket===key))region.add(new Option(name,key));
}
function render(){
 const data=lymphNodeRecords.filter(r=>region.value==='all'||r.bucket===region.value);
 const count=status=>data.filter(r=>r.status===status).length;
 document.querySelector('#node-totals').textContent=`${data.length} source meshes · ${count('landmark-checked')} position checked · ${count('source-aligned')} source position · ${count('withheld')} withheld`;
 rows.replaceChildren(...data.map(r=>{
  const row=document.createElement('tr'),term=lymphNodeTermByKey.get(r.key);
  const cell=row.insertCell();
  if(term){
   const link=document.createElement('a');
   link.href='./?lymph-node='+encodeURIComponent(r.key)+'#atlas';
   link.textContent=term.name;
   cell.append(link);
  }else{
   cell.textContent=r.name+(r.side?' ('+(r.side==='l'?'left':'right')+')':'');
  }
  row.insertCell().textContent=lymphRegions[r.bucket];
  const review=row.insertCell();
  review.textContent=lymphNodeStatus[r.status]+(r.reason?' · '+r.reason:'');
  if(r.fit||r.references.length){
   const details=document.createElement('details'),summary=document.createElement('summary'),note=document.createElement('p');
   summary.textContent='Blender check';
   note.textContent=[r.fit,...r.references.map(ref=>ref.name+' · '+ref.centerToSurfaceMm+' mm from mesh center to surface')].filter(Boolean).join(' / ');
   details.append(summary,note);
   review.append(details);
  }
  return row;
 }));
}
region.addEventListener('change',render);
render();
