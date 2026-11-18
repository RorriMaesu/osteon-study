import {studyEvidence,studyNoteValue} from './mock-review-tools.js';

const fields=[['confusion','What to revisit'],['rule','Correct rule'],['retrieval','Recall question']];

export function renderStudyNote(row,{number,note,escape:e,renderFigure,links}){
  const {q,outcome}=row;
  const evidence=studyEvidence(row);
  const status=!row.answered?'Unanswered':outcome.earnedPoints>0?'Partial credit':'Missed';
  const currentDraft=note.studyDraft;
  const needsRubric=evidence.earned.length||evidence.missing.length||evidence.pending.length;
  const picture=q.type==='identify'
    ?`<div class="mock-figure mock-study-figure">${renderFigure(q)}</div>${evidence.orientation?`<p class="mock-study-orientation">View: ${e(evidence.orientation)}</p>`:''}`
    :'';
  return `<section data-study-question="${number}">
    <h2>Q${number} · ${e(q.topic)}</h2>
    <p>${status} · ${outcome.earnedPoints} / ${outcome.maxPoints} points${outcome.pendingPoints?' · '+outcome.pendingPoints+' pending':''}</p>
    <div class="mock-study-comparison" data-mock4-split>
      <p><strong>Your answer</strong> ${e(row.response||'No answer submitted.')}</p>
      ${q.type==='written'?'':`<p><strong>Correct answer</strong> ${e(evidence.correctAnswer)}</p>`}
    </div>
    ${picture}
    ${needsRubric?`<div class="mock-study-rubric" data-mock4-split>
      ${evidence.earned.length?`<p><strong>Earned credit</strong> ${e(evidence.earned.join(', '))}</p>`:''}
      ${evidence.missing.map(c=>`<p><strong>Confirmed gap · ${e(c.label)}</strong> ${e(c.answer)}</p>`).join('')}
      ${evidence.pending.length?`<p><strong>Still pending</strong> ${e(evidence.pending.join(', '))}</p>`:''}
      <p><strong>Model explanation</strong> ${e(evidence.correctAnswer)}</p>
    </div>`:`<p><strong>What to look for</strong> ${e(evidence.contrast||evidence.rule)}</p>`}
    <div class="mock-mini-actions" data-mock4-split>
      <button class="mock-btn mint" data-study-recall="${e(q.id)}">${picture?'Try without labels':'Recall this idea'}</button>
      <button class="mock-btn" data-mock-lesson="${e(q.id)}">Open section ${e(q.lesson)} ↗</button>
    </div>
    <p class="mock-study-source">${e(q.source||'Textbook section '+q.lesson)}${links?' · '+links:''}</p>
    ${currentDraft?.coaching?`<p class="mock-note"><strong>AI coaching · ${e(currentDraft.model)}</strong> ${e(currentDraft.coaching)}</p>`:''}
    <h3>Your editable notes</h3>
    ${fields.map(([field,title])=>`<label class="mock-study-field">${title}<textarea data-mock-note="${field}" data-question="${e(q.id)}" maxlength="2000" rows="2">${e(studyNoteValue(note,field))}</textarea></label>`).join('')}
    <div class="mock-note-candidate" data-mock4-split>
      <input aria-label="Card line for question ${number}" data-mock-candidate="${e(q.id)}" maxlength="180" value="${e(studyNoteValue(note,'cardDraft'))}">
      <select aria-label="Study card side" data-mock-side="${e(q.id)}"><option value="front" ${note.cardSide!=='back'?'selected':''}>Front</option><option value="back" ${note.cardSide==='back'?'selected':''}>Back</option></select>
      <button class="mock-btn" data-mock-add-note="${e(q.id)}">Add to card</button>
    </div>
  </section>`;
}

export function renderStudyRecall(item,{index,total,revealed,related,escape:e,renderFigure}){
  const {question}=item;
  return `<h2>Recall practice</h2><p>Item ${index+1} of ${total}. Answer aloud or on paper, then reveal the key.</p>
    <p><strong>${e(item.prompt)}</strong></p>
    ${item.figure?`<div class="mock-figure mock-study-figure">${renderFigure(question)}</div>`:''}
    ${revealed?`<h3>Answer</h3><p id="mock-study-recall-answer" tabindex="-1">${e(item.answer)}</p>
      <p>${e(question.source||'Textbook section '+question.lesson)}</p>
      ${related?`<button class="mock-btn" id="mock-study-recall-related">Try a related question</button>`:''}`:''}
    <div class="control-row mock-study-recall-actions">
      <button id="mock-study-recall-prev" ${index===0?'disabled':''}>Previous</button>
      ${revealed?'':`<button class="primary" id="mock-study-recall-reveal">Reveal answer</button>`}
      <button id="mock-study-recall-next" ${index===total-1?'disabled':''}>Next</button>
      <button id="mock-study-recall-close">Back to notes</button>
    </div>`;
}
