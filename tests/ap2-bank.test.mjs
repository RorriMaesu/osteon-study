import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, sections, sectionById, units, labFor } from '../src/ap2-library.js';
import { appliedItems } from '../src/ap2-applied.js';
import { writtenCases } from '../src/ap2-writing.js';
import { bank, examScopes, examItems, grade, correctGrade, submitDraft, score } from '../src/ap2-exam-core.js';
import { examBank as fallBank } from '../src/exam-bank.js';
import { selectExam } from '../src/exam-core.js';
import { publishedChapterIds } from '../src/course-catalog.js';
function assertPhrases(items, minimum = 1) {
  assert.ok(Array.isArray(items) && items.length >= minimum);
  for (const value of items) assert.ok(typeof value === 'string' && value.trim().length > 0);
}

test('A&P II contains the 49 numbered OpenStax sections with lessons, activities and original practice', () => {
  const sectionCounts = [5, 4, 3, 4, 5, 11, 6, 5, 6];
  assert.deepEqual(chapters.map(ch => ch.id), [12, 13, 14, 15, 16, 17, 18, 19, 20]);
  assert.equal(sections.length, 49);
  assert.equal(sectionById.size, sections.length);
  const prompts = new Set();
  for (const ch of chapters) {
    assert.ok(ch.title && ch.summary);
    assert.deepEqual(ch.sections.map(s => s.id), Array.from({ length: sectionCounts[ch.id - 12] }, (_, i) => `${ch.id}.${i + 1}`));
    for (const s of ch.sections) {
      assert.equal(sectionById.get(s.id), s);
      const url = new URL(s.source);
      assert.equal(url.origin, 'https://openstax.org');
      const slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
      assert.equal(url.pathname, `/books/anatomy-and-physiology-2e/pages/${s.id.replace('.', '-')}-${slug}`, s.id);
      assertPhrases(s.objectives, 2);
      assertPhrases(s.paragraphs, 2);
      assert.ok(s.activity.title && s.activity.prompt);
      const lab=labFor(s.id);
      assert.equal(typeof lab.mountLab,'function',s.id);
      assert.match(lab.renderLab(s.id),/<(?:button|select|input)\b/,s.id+' has an interactive practical');
      assert.ok(s.activity.steps.length >= 2);
      for (const step of s.activity.steps) assert.ok(step.label && step.detail);
      assert.ok(s.questions.length >= 3);
      for (const q of s.questions) {
        assertPhrases([q.prompt, q.why]);
        assertPhrases(q.choices, 3);
        assert.equal(new Set(q.choices).size, q.choices.length);
        assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length);
        assert.ok(!prompts.has(q.prompt), q.prompt);
        prompts.add(q.prompt);
      }
    }
  }
});

test('27 applied items provide an accessible original visual and typed practice for each chapter', () => {
  assert.equal(appliedItems.length, 27);
  assert.equal(new Set(bank.map(q => q.id)).size, bank.length);
  assert.equal(bank.filter(q=>q.pool==='recall').length, sections.reduce((total,s)=>total+s.questions.length,0));
  const visuals = new Set();
  for (const chapter of chapters) {
    const group = appliedItems.filter(item => Number(item.section.split('.')[0]) === chapter.id);
    assert.equal(group.length, 3);
    assert.ok(group.some(q => q.type === 'visual') && group.some(q => ['number', 'term'].includes(q.type)));
    for (const q of group) {
      assert.ok(sectionById.has(q.section));
      assert.match(q.id, /^ap2-\d+\.\d+-[a-z0-9-]+$/);
      assertPhrases([q.prompt, q.why]);
      if (q.type === 'visual') {
        assert.match(q.stimulus.svg, /<svg\b[^>]*viewBox=/);
        assert.match(q.stimulus.svg, /role="img"/);
        assert.ok(q.stimulus.alt.length > 25);
        assert.ok(!visuals.has(q.stimulus.svg), 'Each question uses its own figure');
        visuals.add(q.stimulus.svg);
        assertPhrases(q.choices, 3);
        assert.ok(Number.isInteger(q.answer) && q.choices[q.answer]);
      } else {
        assert.ok(['term', 'number'].includes(q.type));
        assertPhrases([q.expected]);
        assertPhrases(q.stimulus.columns, 2);
        assert.ok(q.stimulus.rows.length > 0);
        for (const row of q.stimulus.rows) {
          assert.equal(row.length, q.stimulus.columns.length);
          assertPhrases(row);
        }
        if (q.type === 'number') {
          assert.ok(Number.isFinite(Number(q.expected)) && Number.isFinite(q.tolerance) && q.tolerance >= 0);
          assert.ok(q.unit);
        }
      }
    }
  }
  assert.equal(visuals.size, 9);
});

test('nine independent written cases map to their chapters and stay outside the numeric score', () => {
  assert.deepEqual(Object.keys(writtenCases).map(Number), chapters.map(c => c.id));
  for (const ch of chapters) {
    const item = writtenCases[ch.id];
    assert.ok(ch.sections.some(s => s.id === item.section));
    assertPhrases([item.prompt, item.example]);
    assertPhrases(item.rubric, 2);
    assert.ok(item.rubric.length <= 3);
    assert.equal(new Set(item.rubric).size, item.rubric.length);
    assert.ok(bank.every(q => q.prompt !== item.prompt));
  }
});

test('chapter, unit and cumulative exams stratify by section and preserve their shuffled answer keys', () => {
  const chapterIds = chapters.map(ch => String(ch.id));
  assert.deepEqual(examScopes.map(s => s.id), [...chapterIds, ...units.map(u => u.id), 'all', 'balanced']);
  assert.equal(units.length, 4);
  assert.deepEqual(units.flatMap(u => u.chapters), chapters.map(ch => ch.id));
  const master = new Map(bank.map(q => [q.id, q]));
  for (const spec of examScopes) {
    const scopeSections = sections.filter(s => spec.chapters.includes(Number(s.id.split('.')[0])));
    const perSection = chapterIds.includes(spec.id) ? 2 : 1;
    for (const seed of [0.02, 0.87]) {
      const items = examItems(spec.id, () => seed);
      assert.equal(new Set(items.map(q => q.id)).size, items.length);
      if(spec.id!=='balanced')for (const s of scopeSections) assert.equal(items.filter(q => q.section === s.id && q.type === 'choice').length, perSection, `${spec.id} / ${s.id}`);
      assert.ok(items.every(q => scopeSections.some(s => s.id === q.section)));
      for (const ch of spec.chapters) {
        const applied = items.filter(q => q.type !== 'choice' && Number(q.section.split('.')[0]) === ch);
        assert.equal(applied.length, ['all','balanced'].includes(spec.id) ? 2 : 3);
        if(spec.id==='balanced')assert.equal(items.filter(q=>q.type==='choice'&&q.section.startsWith(ch+'.')).length,1);
        assert.ok(applied.some(q => q.type === 'visual'));
        assert.ok(applied.some(q => q.type === 'term' || q.type === 'number'));
      }
      for (const q of items) {
        const source = master.get(q.id);
        assert.ok(source);
        if (!q.choices) continue;
        assert.deepEqual([...q.choices].sort(), [...source.choices].sort());
        assert.equal(q.choices[q.answer], source.choices[source.answer]);
        assert.equal(grade(q, q.answer), 'correct');
      }
    }
  }
  assert.throws(() => examItems('unknown scope'));
});

test('numerical and typed grading credits canonical answers, accepted variants and clear spelling slips', () => {
  const find = slug => appliedItems.find(q => q.id.endsWith('-' + slug));
  for (const q of appliedItems.filter(q => q.type === 'term' || q.type === 'number')) {
    assert.equal(grade(q, q.expected), 'correct', q.id);
    for (const alias of q.aliases || []) assert.equal(grade(q, alias), 'correct', `${q.id} / ${alias}`);
    assert.equal(grade(q, '   '), 'blank');
  }
  const hemodynamic = find('cardiac-output');
  assert.equal(grade(hemodynamic, '5.460'), 'correct');
  for (const input of ['5460', '5.46 mL', '5.47', '5.46 and 6.0']) assert.equal(grade(hemodynamic, input), 'incorrect');
  const calcitriol = find('renal-messenger');
  assert.equal(grade(calcitriol, 'calcitrol'), 'spelling');
  assert.equal(correctGrade('spelling'), true);
  assert.equal(grade(calcitriol, 'calcitonin'), 'incorrect');
  assert.equal(correctGrade('pending'), false);
  const bloodType = find('typing-pattern');
  for (const invalid of ['negative', 'A', 'A+', 'AB negative', 'O negative', 'B negative']) {
    assert.ok(!correctGrade(grade(bloodType, invalid)), `Incorrect or incomplete blood type ${invalid}`);
  }
});

test('a submitted attempt scores one point per earned response and ignores repeat submissions', () => {
  const items = ['spike-slope','renal-messenger','cardiac-output','fetal-bypass'].map(slug => bank.find(q => q.id.endsWith('-' + slug)));
  const [choice, spelling, number] = items;
  const draft = { id: 'test-draft', scope: 'all', title: 'Exam test', started: 1, items, index: 0,
    responses: { [choice.id]: String(choice.answer), [spelling.id]: 'calcitrol', [number.id]: '5460' } };
  const state = { draft, reports: [], resume: '' };
  submitDraft(state, 'different-attempt', 2);
  assert.equal(state.reports.length, 0);
  submitDraft(state, draft.id, 3);
  assert.equal(state.draft, null);
  assert.equal(state.resume, 'ap2-report-test-draft');
  const [report] = state.reports;
  assert.equal(report.submitted, 3);
  assert.deepEqual(items.map(q => report.grades[q.id]), ['correct','spelling','incorrect','blank']);
  assert.deepEqual(score(report), { correct: 2, total: 4, pending: 0 });
  submitDraft(state, draft.id, 4);
  assert.equal(state.reports.length, 1);
});

test('the published fall catalog and its full-bank entry point exclude A&P II', () => {
  assert.deepEqual(publishedChapterIds, [1,2,3,4,5,6,7,8,9,10,11]);
  const springIds = new Set(bank.map(item => item.id));
  const fall = selectExam('bank', fallBank, () => 0.42);
  assert.equal(fall.length, fallBank.length);
  for (const item of fall) {
    assert.ok(!springIds.has(item.id) && !item.id.startsWith('ap2-'), item.id);
    assert.ok(publishedChapterIds.includes(Number(item.lesson.split('.')[0])), item.id);
  }
});
