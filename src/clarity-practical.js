// A focused review of the targets revised after the November practical feedback.
export const clarityTargets=Object.freeze(['jugular-foramen','lambdoid-suture','vertebral-canal','infraspinous-fossa','lesser-tubercle','costal-facets','radial-nerve-sulcus','anterior-border-of-tibia','shaft-of-humerus','acromioclavicular-facet','ischial-tuberosity','mandibular-foramina','superior-and-middle-nasal-conchae','tibial-tuberosity','anterior-drawer','posterior-drawer']);
export function initClarityPractical({viewer,setView}){
 if(new URLSearchParams(location.search).get('clarity')!=='1')return;
 setView('practice');
 document.body.dataset.precisionActive='true';
 const root=document.querySelector('#practice-view');
 root.innerHTML='<div class="section-intro"><div><div class="eyebrow">FOCUSED PRACTICAL</div><h1>See the <em>detail.</em></h1><p>Sixteen revised targets: skull openings, bone surfaces, the vertebral canal and knee movement.</p></div></div><div class="learning-panel"><p>Try identifying each target before opening a study cue. Amber patches and traces identify the extent of a feature; hollow endpoints identify specific locations. “Show target clearly” restores the intended view without counting as a hint.</p><p>Surface guides are representative areas, not complete anatomical segmentations. Reconstructed contours and the ethmoid cutaway are teaching aids.</p><button class="primary" id="clarity-start" disabled>Loading anatomy…</button><p>Your existing exam and bone-list drafts are preserved. Responses in this review are recorded as a separate practice session.</p></div>';
 const start=root.querySelector('#clarity-start');const ready=()=>{start.disabled=false;start.textContent='Start 16-target review ↗';};if(viewer.loaded)ready();else document.addEventListener('anatomyready',ready,{once:true});
 start.onclick=()=>document.dispatchEvent(new CustomEvent('landmarkqueue',{detail:clarityTargets}));
}
