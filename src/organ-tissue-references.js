const panels={
  thyroid:{
    title:'Thyroid follicles',image:'thyroid-follicles.webp',figure:'17.12c',
    alt:'Micrograph showing rings of follicular cells surrounding areas filled with colloid.',
    prompt:'Trace one ring of follicular cells. Compare its central colloid with the open follicle in the 3D model.'
  },
  'glandular-pancreas':{
    title:'Pancreatic islet',image:'islet.webp',figure:'17.18',
    alt:'OpenStax figure showing a pancreatic islet surrounded by exocrine tissue.',
    prompt:'Find the pale islet within the darker exocrine tissue. The 3D teaching colors distinguish endocrine cell types that are difficult to separate in this image.'
  }
};

export function hasTissueReference(id){return Object.hasOwn(panels,id);}

export function mountTissueReference(lesson,entry,pause){
  const panel=panels[entry.id];
  if(!panel)return;
  const open=lesson.querySelector('[data-oa-micrograph]');
  const dialog=document.createElement('dialog');
  dialog.className='oa-mechanism-dialog oa-micrograph';
  dialog.setAttribute('aria-labelledby','oa-micrograph-title');
  dialog.innerHTML='<header><h3 id="oa-micrograph-title"></h3><button type="button" autofocus>Close</button></header><p data-prompt></p><img><small>Micrograph © 2012 Regents of the University of Michigan Medical School. <a target="_blank" rel="noreferrer"></a></small>';
  dialog.querySelector('h3').textContent=panel.title;
  dialog.querySelector('[data-prompt]').textContent=panel.prompt;
  const image=dialog.querySelector('img'),source=dialog.querySelector('a');
  image.alt=panel.alt;source.href=entry.source;source.textContent='OpenStax A&P 2e, Fig. '+panel.figure+' ↗';
  lesson.append(dialog);
  open.onclick=()=>{pause();if(!image.hasAttribute('src'))image.src='assets/ap2-glands/'+panel.image;dialog.showModal();};
  dialog.querySelector('button').onclick=()=>dialog.close();
  dialog.onclose=()=>{if(open.isConnected)open.focus();};
}
