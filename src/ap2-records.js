import {reviewMatches} from './answer-review-data.js';

export const AP2_KEY = 'osteon-ap2-v1';
const counts = [5,4,3,4,5,11,6,5,6];
export function validSection(id) {
  if (typeof id !== 'string' || !/^(1[2-9]|20)\.[1-9]\d?$/.test(id)) return false;
  const [chapter, section] = id.split('.').map(Number);
  return section <= counts[chapter-12];
}

export const newRecords = () => ({version:1, resume:'', studied:{}, checks:{}, draft:null, reports:[]});
const obj = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const line = (value, max=1500) => typeof value === 'string' && value.length <= max;
const nonempty = (value, max) => line(value,max) && !!value.trim();
const when = value => Number.isSafeInteger(value) && value >= 0;
export const validItemId = id => typeof id === 'string' && /^ap2-[\w.-]{2,80}$/.test(id);

function validStimulus(stimulus) {
  if (!obj(stimulus)) return false;
  if (stimulus.svg !== undefined) {
    return nonempty(stimulus.svg,100000) && /^\s*<svg[\s>]/i.test(stimulus.svg) &&
      (stimulus.alt === undefined || line(stimulus.alt,3000));
  }
  const {columns, rows} = stimulus;
  return Array.isArray(columns) && columns.length > 0 && columns.every(c => nonempty(c)) &&
    Array.isArray(rows) && rows.length > 0 && rows.every(row =>
      Array.isArray(row) && row.length === columns.length && row.every(c => line(c) || Number.isFinite(c)));
}

function validItem(item) {
  if (!obj(item) || !validItemId(item.id) || !validSection(item.section) ||
      !nonempty(item.prompt) || !nonempty(item.why,3000)) return false;
  if (item.stimulus !== undefined && !validStimulus(item.stimulus)) return false;
  if (item.type === 'visual' && !item.stimulus) return false;
  if (item.type === 'term' || item.type === 'number') {
    if (!nonempty(item.expected,250) || item.choices !== undefined) return false;
    if (item.aliases !== undefined && !(Array.isArray(item.aliases) && item.aliases.every(s => nonempty(s,250)))) return false;
    if (item.unit !== undefined && !line(item.unit,80)) return false;
    return item.type === 'term' || Number.isFinite(Number(item.expected)) &&
      (item.tolerance === undefined || Number.isFinite(item.tolerance) && item.tolerance >= 0);
  }
  return ['choice','visual'].includes(item.type) && Array.isArray(item.choices) &&
    item.choices.length >= 2 && item.choices.length <= 10 && item.choices.every(c => nonempty(c)) &&
    Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length;
}

function validResponse(item, value) {
  if (!item || !line(value,500)) return false;
  return !item.choices || value === '' || item.choices.some((_, index) => String(index) === value);
}

function validGrade(item, response, grade) {
  if (!response?.trim()) return grade === 'blank';
  if (item.choices) return grade === (response === String(item.answer) ? 'correct' : 'incorrect');
  if (item.type === 'number') return grade === 'correct' || grade === 'incorrect';
  // A term's original adjudication is part of the saved attempt, even if spelling rules later change.
  return ['correct','incorrect','pending','spelling'].includes(grade);
}

function validSession(session, submitted) {
  if (!obj(session) || !nonempty(session.id,100) || !/^[a-zA-Z0-9-]+$/.test(session.id) ||
      !nonempty(session.scope,100) || !nonempty(session.title,250) || !when(session.started) ||
      !Array.isArray(session.items) || !session.items.length || session.items.length > 400 ||
      !session.items.every(validItem) || !Number.isInteger(session.index) || session.index < 0 ||
      session.index >= session.items.length || !obj(session.responses)) return false;
  const items = new Map(session.items.map(item => [item.id,item]));
  if (items.size !== session.items.length || !Object.entries(session.responses).every(
    ([id,value]) => validResponse(items.get(id),value))) return false;

  if (!submitted) return session.submitted === undefined && session.grades === undefined && session.ai === undefined;
  if (!when(session.submitted) || !obj(session.grades) || Object.keys(session.grades).length !== items.size ||
      !session.items.every(item => validGrade(item,session.responses[item.id],session.grades[item.id]))) return false;
  if (session.ai === undefined) return true;
  return obj(session.ai) && Object.entries(session.ai).every(([id,review]) => {
    const item = items.get(id);
    return item?.type === 'term' && !!session.responses[id]?.trim() &&
      reviewMatches(review,{id,answer:item.expected},session.responses[id]) &&
      review.strictCorrect === ['correct','spelling'].includes(session.grades[id]);
  });
}

function validResume(records) {
  const route = records.resume;
  if (!line(route,120)) return false;
  if (!route) return true;
  if (route === 'ap2-session') return !!records.draft;
  if (route.startsWith('ap2-report-')) return records.reports.some(report => route === 'ap2-report-' + report.id);
  if (/^ap2-chapter-(1[2-9]|20)$/.test(route)) return true;
  const lesson = route.match(/^ap2-lesson-(\d+\.\d+)(?:\/(?:activity|figures|check))?$/);
  return !!lesson && validSection(lesson[1]);
}

export function validAP2Records(records) {
  if (!obj(records) || records.version !== 1 || !obj(records.studied) || !obj(records.checks) ||
      !Array.isArray(records.reports) || !records.reports.every(report => validSession(report,true)) ||
      !(records.draft === null || validSession(records.draft,false))) return false;
  if (!Object.entries(records.studied).every(([id,date]) => validSection(id) && when(date))) return false;
  if (!Object.entries(records.checks).every(([id,check]) => obj(check) && validSection(check.section) &&
      validItemId(id) && /^ap2-(\d+\.\d+)-q[1-9]\d*$/.exec(id)?.[1] === check.section &&
      when(check.at) && typeof check.correct === 'boolean')) return false;
  const sessionIds = new Set(records.reports.map(report => report.id));
  return sessionIds.size === records.reports.length && !sessionIds.has(records.draft?.id) && validResume(records);
}

export function createRecordsStore(storage,onProblem) {
  let memory = newRecords();
  let volatile = false;
  function read() {
    if (volatile) return memory;
    try {
      const raw=storage.getItem(AP2_KEY);
      if (raw === null) return (memory=newRecords());
      const value = JSON.parse(raw);
      if (!validAP2Records(value)) throw new Error('These A&P II records could not be read.');
      return (memory=value);
    } catch {
      volatile=true; onProblem?.('Existing A&P II storage could not be read. This tab will keep new work in memory.'); return memory;
    }
  }
  function update(change) {
    const value=structuredClone(read());
    change(value);
    if (!validAP2Records(value)) throw new Error('The A&P II record was invalid.');
    memory=value;
    if (!volatile) {
      try { storage.setItem(AP2_KEY, JSON.stringify(value)); }
      catch { volatile=true; onProblem?.('Browser storage is unavailable. Keep this tab open to retain your work.'); }
    }
    return value;
  }
  return {read,update, get volatile(){return volatile;}};
}
