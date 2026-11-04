import {allTerms} from './data.js';
import {questions} from './learning-data.js';
import {getLearningContext} from './learning-context.js';
export function issueDraft({id,title,reference,release='unknown'}={}){
 const name=String(title||'General app feedback').slice(0,200),body=`Item: ${String(id||'general').slice(0,150)}\nSource: ${String(reference||'Not specified').slice(0,150)}\nRelease: ${String(release).slice(0,100)}\n\nWhat looks wrong or confusing?\n\nExpected behavior or source correction:\n\nOptional steps to reproduce:\n`;
 return {title:'Review: '+name,body,url:'https://github.com/RorriMaesu/osteon-study/issues/new?'+new URLSearchParams({title:'Review: '+name,body}).toString()};
}
export function initIssueReporter({dialog,escape:e}){
 const button=document.createElement('button');button.className='text-btn';button.type='button';button.textContent='Report an issue';document.querySelector('.footer-links')?.append(button);
 if(!button.isConnected)document.querySelector('footer')?.append(button);
 const show=id=>{const context=getLearningContext(),term=allTerms.find(t=>t.id===(id||context.termId)),question=questions.find(q=>q.id===(id||context.questionId)),item=question||term,script=[...document.scripts].find(s=>s.src.includes('app.js')),release=script?.getAttribute('src')||'unknown',draft=issueDraft({id:item?.id,title:question?.prompt||term?.name,reference:question?.source||term?.source||term?.representation?.reference||term?.feature?.section,release});dialog(`<h2>Help improve this item</h2><p>This draft includes the item ID, source and app version. Your answers, progress and tutor conversation are excluded.</p><p><b>${e(draft.title)}</b></p><a class="primary button-link" href="${e(draft.url)}" target="_blank" rel="noreferrer">Open GitHub issue draft</a><p class="tiny">Review and submit it yourself in GitHub. Nothing is sent by opening this dialog. You can add a screenshot there if it helps.</p><details><summary>Preview included details</summary><pre class="report-preview">${e(draft.body)}</pre></details>`);};
 button.onclick=()=>show();document.addEventListener('click',ev=>{const b=ev.target.closest('[data-report-item]');if(b)show(b.dataset.reportItem);});
}
