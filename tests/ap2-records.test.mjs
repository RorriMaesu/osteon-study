import test from 'node:test';
import assert from 'node:assert/strict';
import {AP2_KEY,createRecordsStore,newRecords,validAP2Records,validSection} from '../src/ap2-records.js';
import {bank,examItems,examScopes,score,submitDraft} from '../src/ap2-exam-core.js';
import {sections} from '../src/ap2-library.js';
import {writtenCases} from '../src/ap2-writing.js';
import {interpretReview} from '../src/answer-judge.js';
import {createStudyBackup,restoreStudyBackup,validateStudyBackup} from '../src/study-backup.js';
import {STORAGE_KEY,blankProgress} from '../src/storage.js';

function memoryStorage() {
  const values = new Map();
  return {
    values,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key,value) { values.set(key,String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function draft(id, items, index=0) {
  return {id,scope:'retry',title:'Review · Nervous tissue',started:100,items:structuredClone(items),index,responses:{}};
}

function completedWork() {
  const work = newRecords();
  const items = ['choice','term','number','visual'].map(type => bank.find(q => q.type === type));
  const [choice,term,number] = items;
  work.studied['12.1'] = 85;
  work.checks[choice.id] = {section:choice.section,at:90,correct:true};
  work.draft = draft('submitted-one',items,2);
  work.draft.responses = {
    [choice.id]:String(choice.answer),[number.id]:number.expected,
    [term.id]:'the sequence of signals combining across short intervals'
  };
  submitDraft(work,'submitted-one',200);
  const report = work.reports[0];
  assert.equal(report.grades[term.id],'pending');
  const target = {id:term.id,answer:term.expected,aliases:term.aliases,reference:term.section,prompt:term.prompt,explanation:term.why};
  const result = interpretReview({
    verdict:'equivalent',confidence:'high',correctedAnswer:term.expected,
    explanation:'The description refers to inputs adding together over time.'
  },{target,response:report.responses[term.id],strictCorrect:false,allowOverride:true,model:'local-reviewer',now:250});
  report.ai = {[term.id]:result.review};
  return work;
}

function oldCourseProgress() {
  return {...blankProgress(),attempts:[{id:'skull-1',topic:'Skull',correct:false,assisted:false,mode:'review',at:100}]};
}

test('the records contract accepts every course section and every generated exam snapshot', () => {
  for (const section of sections) assert.equal(validSection(section.id),true,section.id);
  for (const invalid of ['11.1','12.6','16.6','17.12','20.7','21.1','12.01',12.1]) assert.equal(validSection(invalid),false);
  for (const scope of examScopes) {
    const work = newRecords();
    work.draft = {...draft('example',examItems(scope.id,() => .37)),scope:scope.id,title:scope.title};
    work.resume = 'ap2-session';
    assert.equal(validAP2Records(work),true,scope.id);
    submitDraft(work,'example',200);
    assert.equal(validAP2Records(work),true,scope.id);
  }
});

test('a complete backup restores both courses including an A&P II draft, original stimuli, frozen grades and local review', () => {
  const source = memoryStorage();
  const work = completedWork();
  const oldCourse = oldCourseProgress();
  const frozenReport = structuredClone(work.reports[0]);
  work.draft = draft('next-exam',examItems('20',() => .23),2);
  const currentItem = work.draft.items[work.draft.index];
  work.draft.responses[currentItem.id] = currentItem.choices ? '0' : 'half entered response';
  work.resume = 'ap2-session';
  source.setItem(AP2_KEY,JSON.stringify(work));
  source.setItem(STORAGE_KEY,JSON.stringify(oldCourse));

  const backup = JSON.parse(JSON.stringify(createStudyBackup(source,{now:300})));
  const target = memoryStorage();
  target.setItem(AP2_KEY,JSON.stringify(newRecords()));
  restoreStudyBackup(target,backup);
  const restored = createRecordsStore(target).read();
  assert.deepEqual(JSON.parse(target.getItem(STORAGE_KEY)),oldCourse);
  assert.deepEqual(restored,work);
  assert.deepEqual(restored.reports[0],frozenReport);
  assert.deepEqual(score(restored.reports[0]),{correct:2,total:4,pending:1});
});

test('old full backups and first-course progress-only backups leave existing A&P II work intact', () => {
  const target = memoryStorage();
  const existing = JSON.stringify(completedWork());
  target.setItem(AP2_KEY,existing);
  const oldBackup = createStudyBackup(memoryStorage());
  assert.equal(Object.hasOwn(oldBackup,'ap2'),false);
  restoreStudyBackup(target,oldBackup);
  assert.equal(target.getItem(AP2_KEY),existing);
  const legacy = {...oldCourseProgress(),ap2:{invalid:true}};
  assert.equal(validateStudyBackup(legacy).legacy,true);
  restoreStudyBackup(target,legacy);
  assert.equal(target.getItem(AP2_KEY),existing);
  assert.deepEqual(JSON.parse(target.getItem(STORAGE_KEY)).attempts,legacy.attempts);
});

test('independent writing and optional exam essays round-trip with their own rubric, answer and comparison status', () => {
  const work = completedWork();
  work.resume = 'ap2-writing-17';
  work.writing = {'12':{answer:'My study explanation.',compared:true},'17':{answer:'An unfinished thought.',compared:false}};
  work.draft = draft('exam-with-writing',[bank[0]]);
  work.draft.writing = Object.entries(writtenCases).map(([chapter,entry]) => ({
    ...structuredClone(entry),chapter:Number(chapter),answer:'My independent exam explanation for '+chapter
  }));
  const source = memoryStorage();
  source.setItem(AP2_KEY,JSON.stringify(work));
  const target = memoryStorage();
  restoreStudyBackup(target,createStudyBackup(source));
  const store = createRecordsStore(target), restored = store.read();
  assert.deepEqual(restored,work);
  store.update(r => submitDraft(r,'exam-with-writing',350));
  const submitted = store.read();
  assert.deepEqual(submitted.reports[0].writing,work.draft.writing);
  assert.deepEqual(submitted.writing,work.writing);
  assert.equal(score(submitted.reports[0]).total,1);
  for (const mutate of [
    r => {r.writing['11']={answer:'test',compared:false};},
    r => {r.writing['12'].compared='yes';},
    r => {r.writing['12'].answer='x'.repeat(2501);},
    r => {r.reports[0].writing[0].chapter=20;},
    r => {r.reports[0].writing[0].rubric='missing';},
    r => {r.reports[0].writing[0].answer='x'.repeat(2501);},
    r => {r.reports[0].writing.push(r.reports[0].writing[0]);},
    r => {r.reports[0].writing[1]=r.reports[0].writing[0];}
  ]) {
    const broken = structuredClone(submitted);
    mutate(broken);
    assert.equal(validAP2Records(broken),false);
  }
});

test('submitted item snapshots can outlive a question bank entry and its historical spelling rule', () => {
  const work = completedWork();
  const report = work.reports[0], term = report.items.find(q => q.type === 'term');
  const original = term.id;
  term.id = 'ap2-retired-archived-term';
  term.prompt = 'Question text from an older course edition';
  report.responses[term.id] = 'an old accepted spelling';
  report.grades[term.id] = 'spelling';
  delete report.responses[original];
  delete report.grades[original];
  delete report.ai[original];
  assert.equal(validAP2Records(work),true);
});

test('incompatible grades, malformed stimuli and mismatched evidence reject a whole backup before writes', () => {
  const target = memoryStorage();
  target.setItem(STORAGE_KEY,JSON.stringify(oldCourseProgress()));
  target.setItem(AP2_KEY,JSON.stringify(newRecords()));
  target.setItem('osteon-exams-v1','existing first-course draft');
  const source = memoryStorage();
  source.setItem(AP2_KEY,JSON.stringify(completedWork()));
  const original = createStudyBackup(source);
  const unchanged = new Map(target.values);
  const mutations = {
    'added score': r => { r.grades['ap2-extra-question']='correct'; },
    'missing score': r => { delete r.grades[r.items[0].id]; },
    'impossible choice grade': r => { r.grades[r.items[0].id]='pending'; },
    'incorrect choice key': r => { r.grades[r.items[0].id]='incorrect'; },
    'missing answer graded': r => { r.grades[r.items[3].id]='correct'; },
    'wrong choice index': r => { r.responses[r.items[0].id]='17'; },
    'foreign response': r => { r.responses['ap2-unrelated']='1'; },
    'missing visual': r => { delete r.items[3].stimulus; },
    'malformed table': r => { r.items[1].stimulus.rows=['not an array of cells']; },
    'malformed SVG': r => { r.items[3].stimulus.svg={}; },
    'bad AI schema': r => { r.ai[r.items[1].id].explanation=null; },
    'stale AI response': r => { r.ai[r.items[1].id].response='previous response'; },
    'stale AI target': r => { r.ai[r.items[1].id].target=r.items[0].id; },
    'foreign AI note': r => { r.ai['ap2-unrelated']=r.ai[r.items[1].id]; },
    'invalid number': r => { r.items[2].expected=' '; },
    'invalid tolerance': r => { r.items[2].tolerance=-1; },
    'malformed typed item': r => { r.items[2].choices=['a','b']; }
  };
  for (const [label,mutate] of Object.entries(mutations)) {
    const backup = structuredClone(original);
    mutate(backup.ap2.reports[0]);
    assert.throws(() => restoreStudyBackup(target,backup),/A&P II/,label);
    assert.deepEqual(target.values,unchanged,label);
  }
});

test('invalid navigation targets, duplicate sessions and mismatched recall evidence are rejected', () => {
  for (const [label,mutate] of [
    ['missing report',work => {work.resume='ap2-report-missing';}],
    ['missing draft',work => {work.resume='ap2-session';}],
    ['unknown lesson tab',work => {work.resume='ap2-lesson-12.1/unreachable';}],
    ['unknown chapter',work => {work.resume='ap2-chapter-80';}],
    ['duplicate report',work => {work.reports.push(structuredClone(work.reports[0]));}],
    ['reused draft ID',work => {work.draft=draft(work.reports[0].id,[bank[0]]);}],
    ['submitted fields in draft',work => {work.draft={...draft('new',[bank[0]]),grades:{}};}],
    ['wrong section',work => {Object.values(work.checks)[0].section='13.1';}]
  ]) {
    const work = completedWork();
    mutate(work);
    assert.equal(validAP2Records(work),false,label);
  }
  for (const route of ['','ap2-chapter-17','ap2-lesson-17.11','ap2-lesson-17.11/activity','ap2-lesson-17.11/figures','ap2-lesson-17.11/check']) {
    assert.equal(validAP2Records({...newRecords(),resume:route}),true,route);
  }
});

test('a failed write at the A&P II key rolls back earlier first-course writes', () => {
  const source = memoryStorage(), target = memoryStorage();
  source.setItem(AP2_KEY,JSON.stringify(completedWork()));
  target.setItem(AP2_KEY,JSON.stringify(newRecords()));
  target.setItem(STORAGE_KEY,JSON.stringify(oldCourseProgress()));
  target.setItem('osteon-exams-v1','existing exams');
  const before = new Map(target.values);
  let fail = true;
  const write = target.setItem.bind(target);
  target.setItem = (key,value) => {
    if (key === AP2_KEY && fail) { fail=false; throw Error('Storage is full'); }
    write(key,value);
  };
  assert.throws(() => restoreStudyBackup(target,createStudyBackup(source)),/could not restore/);
  assert.deepEqual(target.values,before);
});

test('separate stores re-read each other’s updates and a stale submission cannot close a new draft', () => {
  const storage = memoryStorage();
  const a = createRecordsStore(storage), b = createRecordsStore(storage);
  a.update(work => { work.studied['12.1']=1; });
  b.update(work => { work.checks['ap2-18.1-q1']={section:'18.1',at:2,correct:true}; });
  a.update(work => { work.draft=draft('first',[bank[0]]); });
  b.update(work => submitDraft(work,'first',200));
  a.update(work => { work.draft=draft('second',[bank[1]]); work.resume='ap2-session'; });
  const before = b.read();
  a.update(work => submitDraft(work,'first',300));
  assert.deepEqual(b.read(),before);
  assert.equal(before.draft.id,'second');
  assert.equal(before.reports.length,1);
  assert.equal(before.checks['ap2-18.1-q1'].correct,true);
  assert.equal(before.studied['12.1'],1);
  assert.equal(storage.getItem(STORAGE_KEY),null);
});

test('corrupt browser data is preserved and an unavailable store keeps new work in the current tab', () => {
  const storage = memoryStorage(), notices = [];
  storage.setItem(AP2_KEY,'broken JSON');
  const corrupt = createRecordsStore(storage,message => notices.push(message));
  corrupt.update(work => {work.studied['18.1']=10;});
  assert.equal(corrupt.volatile,true);
  assert.equal(corrupt.read().studied['18.1'],10);
  assert.equal(storage.getItem(AP2_KEY),'broken JSON');
  assert.equal(notices.length,1);
  assert.throws(() => createStudyBackup(storage),/A&P II/);

  const full = memoryStorage();
  full.setItem(AP2_KEY,JSON.stringify(completedWork()));
  const before = full.getItem(AP2_KEY);
  full.setItem = () => {throw Error('quota');};
  const store = createRecordsStore(full);
  store.update(work => {work.studied['20.2']=300;});
  assert.equal(store.read().reports.length,1);
  assert.equal(store.read().studied['20.2'],300);
  assert.equal(full.getItem(AP2_KEY),before);
  assert.throws(() => store.update(work => {work.draft={};}),/invalid/);
  assert.equal(store.read().draft,null);
});
