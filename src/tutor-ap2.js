import { sections, sectionById } from './ap2-library.js';

export function isAP2Context(context = {}) {
  return ['2', 'ap2'].includes(String(context.course ?? context.courseId ?? '').toLowerCase())
    || sectionById.has(context.reference);
}

export function ap2Reference(reference) {
  const section = sectionById.get(reference);
  if (!section) return null;
  return {
    course: 'ap2',
    reference: section.id,
    title: `Osteon A&P II §${section.id} · ${section.title}`,
    url: section.source
  };
}

export function ap2GuideLessons() {
  return sections.map(section => {
    const check = section.questions[0];
    const activity = section.activity;
    return {
      id: section.id,
      title: section.title,
      course: 'ap2',
      objective: section.objectives[0],
      recall: [check.prompt, `${check.choices[check.answer]} ${check.why}`],
      choices: check.choices,
      application: [activity.prompt, activity.steps.map(step => step.detail).join(' ')]
    };
  });
}

