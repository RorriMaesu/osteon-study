import {figureCovers} from './lesson-figure-covers.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

function inspectFigure(opener,f,custom){
  const panel=document.createElement('dialog');
  panel.className='lf-dialog';
  panel.setAttribute('aria-label','Inspect '+f.title);
  const presets=figureCovers[f.id]||[];
  panel.innerHTML='<header><div><small>'+escape(f.id?'Figure '+f.id:'Teaching diagram')+'</small><h2>'+escape(f.title)+'</h2></div><button type="button" data-close>Back to lesson</button></header>'+
    '<div class="lf-pan" tabindex="0" aria-label="Figure viewing area"><div class="lf-paper"><img alt=""><div class="lf-overlay" aria-hidden="true"></div></div></div>'+
    '<div class="lf-tools" aria-label="Figure controls"><button type="button" data-minus aria-label="Zoom out">−</button><button type="button" data-fit>Fit</button><button type="button" data-plus aria-label="Zoom in">+</button>'+
    '<button type="button" data-mask aria-pressed="false">Hide practice labels</button><button type="button" data-draw aria-pressed="false">Cover an area</button><button type="button" data-undo hidden>Undo cover</button></div>'+
    '<p class="lf-message" role="status"></p>';
  document.body.append(panel);
  const el=q=>panel.querySelector(q),pan=el('.lf-pan'),paper=el('.lf-paper'),img=el('img'),overlay=el('.lf-overlay');
  const status=el('.lf-message'),draw=el('[data-draw]'),mask=el('[data-mask]');
  let zoom=1,hidden=false,drawing=false,anchor=null,cursor=null,closed=false;
  function size(){
    if(!img.naturalWidth||!pan.clientWidth||!pan.clientHeight)return;
    const fit=Math.min(pan.clientWidth/img.naturalWidth,pan.clientHeight/img.naturalHeight);
    paper.style.width=Math.max(1,Math.floor(img.naturalWidth*fit*zoom))+'px';
    paper.style.height=Math.max(1,Math.floor(img.naturalHeight*fit*zoom))+'px';
    el('[data-minus]').disabled=zoom===1;
    el('[data-plus]').disabled=zoom>=4;
    el('[data-fit]').title=Math.round(zoom*100)+'% of fitted size';
  }
  function magnify(next){
    const x=(pan.scrollLeft+pan.clientWidth/2)/pan.scrollWidth;
    const y=(pan.scrollTop+pan.clientHeight/2)/pan.scrollHeight;
    zoom=clamp(next,1,4);size();
    pan.scrollLeft=x*pan.scrollWidth-pan.clientWidth/2;
    pan.scrollTop=y*pan.scrollHeight-pan.clientHeight/2;
  }
  function overlayBox(cls,x,y,w,h){
    const box=document.createElement('i');
    box.className=cls;
    Object.assign(box.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%'});
    overlay.append(box);
  }
  function paint(){
    overlay.replaceChildren();
    if(hidden)for(const rect of [...presets,...custom])overlayBox('lf-cover',...rect);
    if(drawing&&anchor)overlayBox('lf-marker',anchor[0],anchor[1],0,0);
    if(drawing&&cursor)overlayBox('lf-marker',cursor[0],cursor[1],0,0);
    mask.hidden=!presets.length&&!custom.length;
    mask.textContent=hidden?'Show practice labels':'Hide practice labels';mask.setAttribute('aria-pressed',String(hidden));
    draw.textContent=drawing?'Cancel cover':'Cover an area';draw.setAttribute('aria-pressed',String(drawing));
    el('[data-undo]').hidden=!custom.length;
    img.alt=hidden?'Figure with practice areas covered. Show practice labels to read the full description.':f.alt;
    paper.classList.toggle('lf-drawing',drawing);
  }
  function setCorner(point){
    if(!anchor){
      anchor=point;status.textContent='Choose the opposite corner.';paint();return;
    }
    const [x,y]=anchor,w=Math.abs(x-point[0]),h=Math.abs(y-point[1]);
    if(w<.5||h<.5){status.textContent='Move farther from the first corner.';return;}
    custom.push([Math.min(x,point[0]),Math.min(y,point[1]),w,h]);
    drawing=false;hidden=true;anchor=cursor=null;status.textContent='Area covered.';paint();draw.focus();
  }
  paper.onclick=event=>{
    if(!drawing)return;
    const rect=paper.getBoundingClientRect();
    setCorner([clamp((event.clientX-rect.left)*100/rect.width,0,100),clamp((event.clientY-rect.top)*100/rect.height,0,100)]);
  };
  pan.onkeydown=event=>{
    if(!drawing)return;
    const step=event.shiftKey?5:1,offset={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];
    if(offset){event.preventDefault();cursor=[clamp(cursor[0]+offset[0],0,100),clamp(cursor[1]+offset[1],0,100)];paint();status.textContent='Cursor '+cursor[0]+'%, '+cursor[1]+'%. Press Enter to place corner.';}
    else if(event.key==='Enter'||event.key===' '){event.preventDefault();setCorner([...cursor]);}
  };
  draw.onclick=()=>{
    drawing=!drawing;anchor=null;cursor=drawing?[50,50]:null;
    status.textContent=drawing?'Tap two opposite corners of a label. With a keyboard, move with the arrow keys and press Enter for each corner.':'';
    paint();if(drawing)pan.focus({preventScroll:true});
  };
  mask.onclick=()=>{hidden=!hidden;status.textContent='';paint();};
  el('[data-undo]').onclick=()=>{custom.pop();if(!presets.length&&!custom.length)hidden=false;status.textContent='Removed your last cover.';paint();};
  el('[data-plus]').onclick=()=>magnify(zoom*1.5);el('[data-minus]').onclick=()=>magnify(zoom/1.5);el('[data-fit]').onclick=()=>magnify(1);
  function leave(){if(panel.open)panel.close();}
  const resize=new ResizeObserver(size);
  panel.onclose=()=>{
    closed=true;resize.disconnect();window.removeEventListener('hashchange',leave);panel.remove();
    if(opener.isConnected)opener.focus({preventScroll:true});
  };
  el('[data-close]').onclick=leave;window.addEventListener('hashchange',leave);
  img.onload=()=>{if(!closed)size();};
  img.onerror=()=>{status.textContent='The image could not load. Return to the lesson for the original source.';};
  panel.showModal();el('[data-close]').focus();img.src=f.src;resize.observe(pan);size();paint();
}

export function mountLessonFigure(body,{figures,selected,onSelect,section,source}){
  const f=figures[selected],custom=[];
  const contextual=f.section&&f.section!==section;
  body.innerHTML='<figure class="ap2-art lf-inline"><div class="lf-bar">'+
    (figures.length>1?'<label>Figure <select data-figure>'+figures.map((a,i)=>'<option value="'+i+'" '+(i===selected?'selected':'')+'>'+escape(a.id+' · '+a.title)+'</option>').join('')+'</select></label>':'<strong>'+escape((f.id?f.id+' · ':'')+f.title)+'</strong>')+
    '<button type="button" data-lf-open>Focus figure</button></div>'+
    '<button type="button" class="lf-open-image" aria-label="Inspect '+escape(f.title)+'"><img src="'+escape(f.src)+'" alt="'+escape(f.alt)+'"></button>'+
    '<figcaption>'+(contextual?'Related figure from §'+escape(f.section)+' · ':'')+escape(f.id?'Fig. '+f.id+' · '+f.title:f.title)+
    '<details><summary>Description &amp; credits</summary><p>'+escape(f.alt)+'</p>'+
    (f.id?'OpenStax, Rice University. '+escape(f.credit||'')+' <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a>. <a href="'+escape(source)+'" target="_blank" rel="noreferrer">Access for free at openstax.org</a>.':'Osteon teaching diagram.')+
    ' <a href="'+escape(f.src)+'" target="_blank" rel="noreferrer" '+(f.id?'':'download="teaching-diagram.svg"')+'>'+ (f.id?'Open original image':'Save diagram')+'</a></details></figcaption></figure>';
  body.querySelector('[data-figure]')?.addEventListener('change',event=>onSelect(Number(event.target.value)));
  for(const button of body.querySelectorAll('[data-lf-open],.lf-open-image'))button.onclick=()=>inspectFigure(button,f,custom);
}
