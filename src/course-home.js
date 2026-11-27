import {activeChapters} from './chapters.js';
import {setLearningContext} from './learning-context.js';

const selectionKey = 'osteon-selected-course';
const returnKey = 'osteon-course-atlas-return';
let selected = '1';
function read(key, fallback = '') {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function remember(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Navigation also works without storage. */ }
}
export function selectedCourse() { return selected; }

export function initCourseHome({setView, escape}) {
  const root = document.querySelector('#courses-view');
  const picker = document.querySelector('#course-picker');
  const back = document.querySelector('#course-atlas-return');
  const motionBack = document.querySelector('#course-motion-return');
  selected = read(selectionKey) === '2' ? '2' : '1';
  picker.value = selected;
  const choose = course => { selected = course; picker.value = course; remember(selectionKey, course); };
  const link = (route, title) => `<a class="course-link" href="#${route}">${escape(title)}</a>`;
  const chapterCards = activeChapters.map(ch => link('lesson-' + ch.id + '.1', ch.id + '. ' + ch.title)).join('');
  const welcome = () => {
    const resume = read('osteon-course-resume-' + selected);
    return `<div class="course-hero"><div class="eyebrow">STUDY STUDIO</div><h1>Choose your course</h1></div><div class="course-grid">
    <article><h2>Anatomy &amp; Physiology I</h2><p>Chapters 1–11, the nervous tissue bridge, fall lab lists, and your saved mock exams.</p>${link('course-1','Open A&P I')}</article>
    <article><h2>Anatomy &amp; Physiology II</h2><p>Chapters 12–20. Study the nervous, endocrine, and cardiovascular systems.</p>${link('course-2','Open A&P II')}</article></div>
    ${resume && /^[\w./-]+$/.test(resume) ? link(resume,'Continue A&P ' + (selected === '1' ? 'I' : 'II') + ' · ' + courseRouteLabel(resume)) : ''}`;
  };
  function firstCourse() {
    const resume = read('osteon-course-resume-1');
    return `<div class="course-hero"><div class="eyebrow">FALL · BI 231</div><h1>Anatomy &amp; Physiology I</h1><p>Body organization, tissues, the skeleton, joints, and muscles.</p></div>
    <div class="course-actions">${resume && /^[\w./-]+$/.test(resume) ? link(resume,'Continue · ' + courseRouteLabel(resume)) : ''}${link('study','Study studio')}${link('exam-center','Chapter exams')}${link('exam4-results','Mock 4 results')}${link('progress','My progress & backups')}</div>
    <div class="course-grid"><article><h2>Chapters</h2><div class="course-links">${chapterCards}</div></article>
    <article><h2>Lab and exam practice</h2><div class="course-links">${[['practice','Practice lab'],['exam3','Mock Exam 3'],['exam4','Mock Exam 4'],['bone-list','Required bone list'],['muscle-list','Required muscle list'],['muscle-labeling','Muscle labeling'],['professor-muscle-review','Professor’s muscle review']].map(([r,t])=>link(r,t)).join('')}</div>
    <h2>Neural signaling bridge</h2><p>Review nervous tissue and skeletal muscle excitation before starting Chapter 12.</p><div class="course-links">${link('lesson-4.5','4.5 · Nervous tissue')}${link('lesson-10.3','10.3 · Muscle contraction and excitation')}${link('ap2-lesson-12.1','Continue to Chapter 12')}</div></article></div>`;
  }
  function open(route) {
    const isII = route === 'course-2' || route.startsWith('ap2-');
    if (route !== 'courses') choose(isII ? '2' : '1');
    setView('courses',{route});
    if (isII) { root.osteonAP2(route); return; }
    setLearningContext({type:'study',label:route === 'course-1' ? 'A&P I course home' : 'Course selection',text:''});
    root.innerHTML = `<div class="course-page">${route === 'courses' ? welcome() : firstCourse()}</div>`;
  }
  picker.onchange = () => { location.hash = picker.value === 'all' ? 'courses' : 'course-' + picker.value; };
  function sync(view, route) {
    if (view === 'atlas' || view === 'motion') {
      const labLink=document.querySelector('#atlas-organ-labs');
      if(labLink)labLink.hidden=selected!=='2';
      let ret = ''; try { ret = sessionStorage.getItem(returnKey) || ''; } catch {}
      back.hidden = !(selected === '2' && /^ap2-lesson-[\d.]+(?:\/(?:activity|figures|check))?$/.test(ret));
      const motionBack=document.querySelector('#course-motion-return');
      if(motionBack)motionBack.hidden=back.hidden;
      if (!back.hidden) {
        for(const a of [back,motionBack].filter(Boolean)){a.href='#'+ret;a.textContent='← Lesson '+ret.slice(11).split('/')[0];}
      }
      if (motionBack) { motionBack.hidden=back.hidden; if(!back.hidden){motionBack.href='#'+ret;motionBack.textContent=back.textContent;} }
      return;
    }
    back.hidden = true;
    if(motionBack)motionBack.hidden=true;
    if (view === 'courses') {
      if (route === 'courses') { picker.value='all'; return; }
      const active=route==='ap2-progress'?'progress':/^ap2-(exams|session|report|spotter)/.test(route)?'practice':'study';
      for(const b of document.querySelectorAll('.main-nav [data-view]')){
        b.classList.toggle('active',b.dataset.view===active);b.setAttribute('aria-current',b.dataset.view===active?'page':'false');
      }
      return;
    }
    choose('1');
    if (/^(lesson-\d+\.\d+|exam[34](?:-results(?:\/[\w-]+)?|-exam)?|exam-session|bone-list|muscle-list)$/.test(route)) remember('osteon-course-resume-1',route);
  }
  return { open, sync };
}
export function rememberAP2Route(route) {
  remember('osteon-course-resume-2',route);
  if (/^ap2-lesson-[\d.]+(?:\/(?:activity|figures|check))?$/.test(route)) {
    try { sessionStorage.setItem(returnKey,route); } catch {}
  }
}
export function courseRouteLabel(route) {
  if (route.includes('lesson-')) return 'Section ' + route.split('lesson-').pop().split('/')[0];
  if (route.startsWith('ap2-writing-')) return 'Written reasoning · Chapter ' + route.slice(12);
  if (route.startsWith('ap2-chapter-')) return 'Chapter ' + route.slice(12);
  if (route.includes('report') || route.includes('results')) return 'Exam results';
  if (route.includes('session') || route.endsWith('-exam')) return 'Saved exam';
  return ({exam3:'Mock Exam 3',exam4:'Mock Exam 4','bone-list':'Required bones','muscle-list':'Required muscles'})[route] || 'Study';
}
