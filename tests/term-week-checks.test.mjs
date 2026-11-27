import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters as winterChapters} from '../src/ap2-library.js';
import {chapters as springChapters} from '../src/ap3-curriculum.js';
import {makeWinterMock, winterScopes} from '../src/term-mock-winter.js';
import {makeSpringMock, springScopes} from '../src/term-mock-spring.js';
import {termExamWeeks, termExamSources} from '../src/term-exam-weeks.js';
import {makeWeekCheck, chapterBreakdown} from '../src/term-week-checks.js';
import {courseMockStore, validTermRun} from '../src/term-mock-records.js';
import {gradeTermItem, scoreTermAttempt} from '../src/term-mock-review.js';
import {createRecordsStore} from '../src/ap2-records.js';
import {springStore} from '../src/ap3-records.js';
import {createStudyBackup, restoreStudyBackup} from '../src/study-backup.js';

const terms = [
  {course: 'ap2', chapters: winterChapters, scopes: winterScopes, make: makeWinterMock,
    start: '2027-01-04', milestones: [3, 5, 7, 10, 11], store: createRecordsStore},
  {course: 'ap3', chapters: springChapters, scopes: springScopes, make: makeSpringMock,
    start: '2027-03-29', milestones: [3, 5, 8, 10, 11], store: springStore}
];
const forms = ['A', 'B', 'C'];
const chapterOf = section => Number(section.split('.')[0]);

function storage() {
  const data = new Map();
  return {
    get length() { return data.size; },
    key: i => [...data.keys()][i], getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key)
  };
}

for (const {course, chapters, scopes, make, start, milestones, store} of terms) {
  const plan = termExamWeeks[course];
  const sections = chapters.flatMap(ch => ch.sections);
  const lesson = new Map(sections.map(s => [s.id, s]));
  const weekly = (week, form) => makeWeekCheck(course, week, form, scopes, make);

  test(course + ' assigns every section once and schedules checkpoints only after the readings', () => {
    assert.equal(plan.length, 11);
    assert.deepEqual(plan.flatMap(w => w.sections), sections.map(s => s.id));
    assert.deepEqual(plan.filter(w => w.scope).map(w => w.week), milestones);
    assert.deepEqual(plan.filter(w => w.scope).map(w => w.scope), ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'all']);
    const studied = new Set();
    for (const [index, week] of plan.entries()) {
      assert.equal(week.week, index + 1);
      assert.equal(Date.parse(week.weekOf), Date.parse(start) + index * 7 * 86400000);
      assert.ok(week.title && week.focus && week.checkpoint);
      week.sections.forEach(id => studied.add(id));
      if (week.scope) {
        const milestone = scopes.find(s => s.id === week.scope);
        const due = sections.filter(s => milestone.chapters.includes(chapterOf(s.id)));
        assert.ok(due.length);
        assert.ok(due.every(s => studied.has(s.id)), week.scope + ' tests unread chapters');
      }
    }
    assert.deepEqual(plan.at(-1).sections, []);
    for (const outOfRange of [0, 11, 12]) assert.throws(() => weekly(outOfRange, 'A'), RangeError);
    assert.throws(() => weekly(1, 'D'), RangeError);
  });

  for (const week of plan.filter(w => w.sections.length)) {
    test(course + ' week ' + week.week + ' forms cover the assigned sections, with reproducible scorable snapshots', () => {
      const studied = new Set(plan.slice(0, week.week).flatMap(w => w.sections));
      const studiedChapters = new Set([...studied].map(chapterOf));
      const formStems = new Set();
      for (const form of forms) {
        const items = weekly(week.week, form);
        assert.deepEqual(new Set(items.map(q => q.section)), new Set(week.sections));
        assert.deepEqual(items, JSON.parse(JSON.stringify(weekly(week.week, form))));
        assert.equal(new Set(items.map(q => q.id)).size, items.length);
        assert.equal(new Set(items.map(q => q.prompt)).size, items.length);
        assert.ok(items.some(q => q.type === 'evidence'), 'The week needs an evidence station');
        assert.ok(items.some(q => q.type === 'short' || q.type === 'written'), 'The week needs a recall or explanation task');
        for (const q of items) {
          assert.ok(lesson.get(q.section)?.source.startsWith('https://openstax.org/'), q.section);
          assert.ok((q.relatedSections || []).every(s => studied.has(s)), q.id);
          assert.ok((q.relatedChapters || []).every(ch => studiedChapters.has(ch)), q.id);
        }
        formStems.add(items.map(q => q.prompt).sort().join('\n'));

        const run = {course, id: 'weekly-attempt', version: 1, created: 100,
          form, scope: 'week-' + week.week, title: week.title, mode: 'coached', index: 0,
          items, answers: {}, flags: {}, reviews: {}, assisted: {}};
        assert.ok(validTermRun(run, course));
        const firstChoice = items.find(q => q.type === 'choice');
        run.answers[firstChoice.id] = String(firstChoice.answer);
        const writing = items.find(q => q.type === 'written');
        if (writing) run.answers[writing.id] = 'My explanation is ready for rubric review.';
        run.grades = Object.fromEntries(items.map(q => [q.id, gradeTermItem(q, run.answers[q.id])]));
        run.submitted = 120;
        assert.ok(validTermRun(run, course));
        assert.ok(!validTermRun({...run, scope: 'week-11'}, course));
        const score = scoreTermAttempt(run);
        const lines = chapterBreakdown(score.rows);
        assert.deepEqual(lines.map(l => l.chapter), [...new Set(week.sections.map(chapterOf))]);
        for (const line of lines) {
          const bucket = items.filter(q => chapterOf(q.section) === line.chapter);
          assert.equal(line.questions, bucket.length);
          assert.equal(line.possible, bucket.reduce((n, q) => n + q.points, 0));
          assert.equal(line.earned, Number(bucket.includes(firstChoice)));
          assert.equal(line.pending, bucket.includes(writing) ? writing.points : 0);
        }
      }
      assert.equal(formStems.size, 3, 'Changing the form should change the questions.');
    });
  }

  test(course + ' weekly attempts survive leaving, submission, regeneration and study backup restore', () => {
    const device = storage(), restored = storage();
    const db = courseMockStore(course, store(device));
    const questions = weekly(1, 'B');
    const original = db.start({scope: 'week-1', form: 'B', mode: 'independent', title: plan[0].title, items: questions});
    const first = questions.find(q => q.type === 'choice');
    db.update(original.id, 'draft', run => {
      run.index = 1;
      run.answers[first.id] = String(first.answer);
      run.flags[first.id] = true;
    });
    const reopened = courseMockStore(course, store(device));
    assert.equal(reopened.get(original.id).index, 1);
    reopened.update(original.id, 'draft', run => {
      run.grades = Object.fromEntries(run.items.map(q => [q.id, gradeTermItem(q, run.answers[q.id])]));
      run.submitted = Date.now();
    });
    const saved = reopened.get(original.id);
    const anotherRun = weekly(1, 'B');
    anotherRun[0].prompt = 'Edit only the new copy';
    restoreStudyBackup(restored, JSON.parse(JSON.stringify(createStudyBackup(device))));
    const recovered = courseMockStore(course, store(restored)).get(original.id);
    assert.deepEqual(recovered, saved);
    assert.equal(recovered.items[0].prompt, questions[0].prompt);
    assert.equal(scoreTermAttempt(recovered).earned, 1);
  });
}

test('weekly selection discards future section and chapter dependencies even on in-week questions', () => {
  const section = '12.1';
  const makeItem = (prompt, meta = {}) => ({type: 'choice', section, prompt, ...meta});
  const make = () => [
    makeItem('Requires a future section', {relatedSections: ['13.1']}),
    makeItem('Requires a future chapter', {relatedChapters: [13]}),
    ...termExamWeeks.ap2[0].sections.map(id => makeItem('Current topic ' + id, {section: id}))
  ];
  const result = makeWeekCheck('ap2', 1, 'A', [{id: 'unit-1', chapters: [12, 13, 14]}], make);
  assert.ok(result.every(q => q.prompt.startsWith('Current topic')));
  assert.deepEqual(result.map(q => q.section), termExamWeeks.ap2[0].sections);
});

test('the forecast points to institutional dates, course outcomes and the textbook', () => {
  assert.ok(termExamSources.every(s => s.title && new URL(s.url).protocol === 'https:'));
  const urls = termExamSources.map(s => s.url);
  for (const pattern of [/umpqua.edu.*academic-calendar/, /oregon.gov.*232Z/, /oregon.gov.*233Z/, /openstax.org/]) {
    assert.ok(urls.some(url => pattern.test(url)), String(pattern));
  }
});
