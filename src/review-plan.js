import {inDivision} from './anatomy.js';

// Counts and the decks they open must use the same scope and timestamp.
export function reviewQueues(lab, concepts, progress, {division='All', region='All regions', now=Date.now()}={}) {
  const due = items => items.filter(t => Number.isFinite(progress.cards[t.id]?.due) && progress.cards[t.id].due <= now)
    .sort((a,b) => progress.cards[a.id].due-progress.cards[b.id].due);
  const allLab = due(lab), chapters = due(concepts);
  return {
    anatomy: allLab.filter(t => inDivision(t,division) && (region==='All regions' || t.region===region)),
    allAnatomy: allLab,
    chapters,
    all: [...allLab,...chapters].sort((a,b) => progress.cards[a.id].due-progress.cards[b.id].due)
  };
}

// Self-ratings and reading are not evidence of independently answering a question.
export function retrievalPlan(items, attempts) {
  const evidence = new Map();
  for (const a of attempts) {
    if (a.selfRated) continue;
    let entry = evidence.get(a.id);
    if (!entry) evidence.set(a.id,entry={latest:a,correctTimes:[]});
    if (a.at >= entry.latest.at) entry.latest=a;
    if (a.correct && !a.assisted) entry.correctTimes.push(a.at);
  }
  const unpracticed=[],revisit=[],retrieved=[],spaced=[];
  for (const item of items) {
    const entry=evidence.get(item.id);
    if (!entry) unpracticed.push(item);
    else if (!entry.latest.correct || entry.latest.assisted) revisit.push(item);
    else {
      retrieved.push(item);
      if (entry.correctTimes.some(at => entry.latest.at-at >= 86400000)) spaced.push(item);
    }
  }
  const oldestFirst=(a,b)=>evidence.get(a.id).latest.at-evidence.get(b.id).latest.at;
  revisit.sort(oldestFirst);retrieved.sort(oldestFirst);
  return {unpracticed,revisit,retrieved,spaced,next:[...revisit,...unpracticed,...retrieved]};
}
