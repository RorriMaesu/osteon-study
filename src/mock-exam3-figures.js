// Exact, cropped course-packet pixels. Label masks are presentation overlays;
// no generative anatomy is used. See assets/mock-exam3/manifest.json.
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const credit='BI 231 supplied laboratory illustration. Reproduced with permission.';
const definitions=[
 {number:31,size:[464,453],point:[205,133],bubble:[99,73],name:'Osteon',view:'Bone microanatomy. The marker follows the original bracket for the complete structural unit.',page:1,week:6,credit:'Pearson Education, Inc., publishing as Benjamin Cummings. Reproduced with permission.',masks:[]},
 {number:32,size:[258,254],point:[91,56],bubble:[205,22],name:'Parietal bone',view:'Lateral skull view.',page:2,week:6,masks:[[0,221,30,30]]},
 {number:33,size:[317,337],point:[213,124],bubble:[285,89],name:'Sphenoid bone',view:'Inferior skull view. Identify the bone containing the marked region.',page:2,week:6,masks:[[273,164,38,22]],polygons:['195,25 217,12 225,21 199,37']},
 {number:34,size:[356,416],point:[106,231],bubble:[28,246],name:'Pedicle',view:'Thoracic vertebra, superior view. The body is at the bottom of this source drawing.',page:2,week:6,clip:'160,19 205,19 206,97 223,127 249,146 300,110 335,103 353,135 352,163 319,178 277,209 281,246 299,271 298,329 275,366 236,395 194,411 138,396 111,377 92,345 79,305 82,267 100,241 101,215 80,190 40,168 18,137 18,112 40,101 68,110 101,133 124,145 149,135 164,111',masks:[]},
 {number:35,size:[475,227],point:[137,190],bubble:[57,192],name:'Glenoid cavity',view:'Superior region of the scapula, posterior view. The original spine, acromion and coracoid remain visible.',page:7,week:7,masks:[[0,0,390,52],[260,43,215,89],[0,110,118,55],[64,155,51,31],[403,120,72,34]]},
 {number:36,size:[230,855],point:[139,441],bubble:[-54,458],name:'Deltoid tuberosity',view:'Humerus, posterior view; proximal and distal ends are retained.',page:8,week:7,masks:[[0,145,36,35],[205,0,25,90],[0,555,70,65],[0,735,19,45],[0,250,15,28]]},
 {number:37,size:[373,525],point:[180,341],bubble:[69,363],name:'Acetabulum',view:'Anterior pelvic view, focused on one hip bone and adjacent sacrum.',page:4,week:7,masks:[[0,255,123,65],[0,334,108,43],[104,349,69,28],[88,391,100,59]]},
 {number:38,size:[215,870],point:[166,812],bubble:[273,778],name:'Medial malleolus',view:'Tibia and fibula, anterior view. Both ankle projections remain visible.',page:5,week:7,masks:[[0,218,30,35],[164,414,51,40],[200,166,15,37],[0,788,24,24]]},
 {number:39,size:[350,438],point:[285,210],bubble:[331,256],name:'Synovial membrane',view:'Section through a synovial joint. Follow the numbered leader to its endpoint.',page:7,week:7,masks:[]},
];

export const mockExam3Figures=Object.freeze(Object.fromEntries(definitions.map((d,i)=>{
 const assetId=`exam3-q${d.number}`;
 return [assetId,Object.freeze({...d,assetId,src:`assets/mock-exam3/plate-${String(i+1).padStart(2,'0')}.jpg`,credit:d.credit||credit,source:`Week ${d.week} lab packet, page ${d.page}`,ready:true})];
})));

function resolveFigure(q){
 if(typeof q==='string')return mockExam3Figures[q]||mockExam3Figures[`exam3-q${q}`];
 if(typeof q==='number')return mockExam3Figures[`exam3-q${q}`];
 return mockExam3Figures[q?.assetId]||mockExam3Figures[`exam3-q${q?.number||q?.target}`]||null;
}

export const mockFigureReady=q=>!!resolveFigure(q)?.ready;
let serial=0;

export function renderMockFigure(question,{reveal=false,marker}={}){
 const p=resolveFigure(question);
 if(!p)return '<div class="mock-figure-unavailable" role="status">This packet figure is unavailable. Your answer has been preserved.</div>';
 const [w,h]=p.size,cw=Math.max(w,h*.72),dx=(cw-w)/2,id=`mock-packet-${++serial}`;
 const radius=Math.max(14,Math.min(23,h*.028)),label=marker??p.number;
 const alt=`${p.view} Number ${label} marks the target.${reveal?` Correct identification: ${p.name}.`:''}`;
 const masks=p.masks.map(([x,y,width,height])=>`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="black"/>`).join('')+(p.polygons||[]).map(points=>`<polygon points="${points}" fill="black"/>`).join('');
 const clipped=p.clip?` clip-path="url(#${id}-clip)"`:'';
 return `<figure class="exam-figure mock-packet-figure${reveal?' is-revealed':''}" data-packet-asset="${safe(p.assetId)}"><div class="mock-packet-plate"><svg viewBox="0 0 ${cw} ${h}" role="img" aria-label="${safe(alt)}" style="display:block;width:100%;max-height:560px;background:#fff;border-radius:14px"><defs><mask id="${id}-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="white"/>${masks}</mask>${p.clip?`<clipPath id="${id}-clip"><polygon points="${p.clip}"/></clipPath>`:''}</defs><g transform="translate(${dx} 0)"><image href="${safe(p.src)}" width="${w}" height="${h}" preserveAspectRatio="none" mask="url(#${id}-mask)"${clipped} style="filter:grayscale(1) contrast(1.65) brightness(1.4)"/><path d="M${p.bubble[0]} ${p.bubble[1]}L${p.point[0]} ${p.point[1]}" stroke="#fff" stroke-width="5"/><path d="M${p.bubble[0]} ${p.bubble[1]}L${p.point[0]} ${p.point[1]}" stroke="#98622f" stroke-width="2.2"/><circle cx="${p.point[0]}" cy="${p.point[1]}" r="3.8" fill="#f3a976" stroke="#312a21" stroke-width="1"/><circle cx="${p.bubble[0]}" cy="${p.bubble[1]}" r="${radius}" fill="#f3b181" stroke="#312a21" stroke-width="1.6"/><text x="${p.bubble[0]}" y="${p.bubble[1]+radius*.36}" text-anchor="middle" fill="#222c29" font-family="system-ui,sans-serif" font-weight="750" font-size="${radius*1.02}">${safe(label)}</text></g></svg></div>${reveal?`<div class="mock-packet-answer"><span>Verified target</span><strong>${safe(p.name)}</strong></div>`:''}<figcaption><b>${safe(p.source)}</b> · ${safe(p.view)}<br><span>${safe(p.credit)} Original packet pixels, cropped and label-masked for recall.</span></figcaption></figure>`;
}

// Preflight actual assets before a complete scored attempt; no silent substitution.
export async function preloadMockFigures({signal}={}){
 const images=Object.values(mockExam3Figures);
 if(typeof Image==='undefined')return {ready:false,missing:images.map(p=>p.assetId)};
 const loaded=await Promise.all(images.map(p=>new Promise(resolve=>{
  const image=new Image();let finished=false;
  const settle=ok=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);image.onload=null;image.onerror=null;resolve({id:p.assetId,ok});};
  const abort=()=>settle(false),timer=setTimeout(()=>settle(false),12000);
  image.onload=()=>settle(image.naturalWidth>0);image.onerror=()=>settle(false);
  signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted){abort();return;}image.src=p.src;
 })));
 const missing=loaded.filter(x=>!x.ok).map(x=>x.id);return {ready:missing.length===0,missing};
}
