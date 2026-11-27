import {makeCourseSearch} from './ap2-term-search.js';
import {chapters} from './ap3-curriculum.js';
import {chapterLabs} from './ap3-labs.js';
import {labRoute, springLessonLabs} from './ap3-lab-links.js';
import {specimens} from './ap3-specimens-catalog.js';
import figures from './ap3-figures.json' with {type:'json'};

export const springTargetKey=id=>id.replace(/[^\w-]+/g,'-');
export const specimenRoute=(id,target)=>'ap3-specimen-'+id+(target?'/target/'+springTargetKey(target):'');
const vocabulary=text=>text.replace(/\bcounter[\s\u2010-\u2015-]+current\b/gi,'countercurrent');
const labTerms={
  '22.5':'oxygen content saturation hemoglobin haemoglobin Bohr effect partial pressure oxygen transport',
  '25.8':'collecting duct vasopressin ADH aquaporins medullary gradient water balance',
  '25.9':'countercurrent multiplier countercurrent exchange nephron loop renal medulla',
  '26.5':'blood gas ABG bicarbonate pH PCO2 acid–base compensation',
  '28.7':'pedigree Punnett square genotype phenotype allele inheritance'
};

export function springSearchEntries(){
  const rows=[],used=new Set();
  function add(kind,section,title,text,route,specimen){
    if(used.has(route))return;
    used.add(route);rows.push({kind,section,title,text:vocabulary(text),route,specimen});
  }
  for(const chapter of chapters){
    for(const s of chapter.sections)add('Lesson',s.id,s.title,[s.objective,s.explanation,s.worked,labTerms[s.id]||''].join(' '),'ap3-lesson-'+s.id);
    chapterLabs[chapter.id].forEach((lab,index)=>{
      const links=Object.entries(springLessonLabs).filter(([section,rec])=>String(rec.chapter||section.split('.')[0])===String(chapter.id)&&rec.activity===index&&!rec.related);
      const terms=links.map(([section,rec])=>rec.label+' '+(labTerms[section]||'')).join(' ');
      add('Activity',lab.section,lab.title,[lab.intro||'',terms].join(' '),labRoute(chapter.id,index));
    });
  }
  for(const s of specimens){
    add('3D model',String(s.chapter),s.title,s.description,specimenRoute(s.id));
    for(const t of s.targets)add('3D structure',String(s.chapter),t.label,s.title+' '+(t.detail||''),specimenRoute(s.id,t.id),s.title);
  }
  for(const [id,f] of Object.entries(figures.figures)){
    // A few figures appear as contextual evidence in multiple lessons.
    const section=figures.sections[f.section]?.includes(id)?f.section:Object.keys(figures.sections).find(s=>figures.sections[s].includes(id));
    if(section)add('Figure',section,f.title,'Figure '+id+' '+f.alt,'ap3-lesson-'+section+'/figures/'+id);
  }
  return rows;
}
export function openSpringSearch({root,page,hero,link,e}){
  page(hero('A&P III','Find a lesson or activity')+'<section class="course-card"><div class="ap2-index-controls">'+
    '<label>Topic or anatomical term<input type="search" data-find autocomplete="off" placeholder="Try nephron, collecting duct, or lactation"></label>'+
    '<label>Show<select data-find-kind><option value="">All resources</option>'+['Lesson','Activity','3D model','3D structure','Figure'].map(k=>'<option>'+k+'</option>').join('')+'</select></label></div><div data-matches></div></section>');
  const input=root.querySelector('[data-find]'),kind=root.querySelector('[data-find-kind]'),out=root.querySelector('[data-matches]');
  const find=makeCourseSearch(springSearchEntries());
  function filter(){
    const query=vocabulary(input.value.trim());
    const {items,suggestion}=find(query,row=>kind.value?row.kind===kind.value:query||row.kind==='Lesson');
    const message=(suggestion?'Closest spelling “'+suggestion+'” · ':'')+(items.length?items.length+' matching resources':'No matches. Try another term or choose All resources.');
    out.innerHTML='<p role="status">'+e(message)+'</p><div class="course-links">'+items.map(r=>link(r.route,r.title+' · '+(r.specimen?r.specimen+' · ':'')+r.kind+' · '+r.section)).join('')+'</div>';
  }
  input.oninput=kind.onchange=filter;filter();input.focus({preventScroll:true});
}
