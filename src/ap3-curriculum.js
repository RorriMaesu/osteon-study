import immune from './ap3-curriculum-21.js';
import respiration from './ap3-curriculum-22.js';
import digestion from './ap3-curriculum-23.js';
import metabolism from './ap3-curriculum-24.js';
import urinary from './ap3-curriculum-25.js';
import fluids from './ap3-curriculum-26.js';
import reproduction from './ap3-curriculum-27.js';
import development from './ap3-curriculum-28.js';
import { sectionSources } from './ap3-curriculum-sources.js';

const textbook = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const course = [
  [21, 'The lymphatic and immune systems', immune],
  [22, 'The respiratory system', respiration],
  [23, 'The digestive system', digestion],
  [24, 'Metabolism and nutrition', metabolism],
  [25, 'The urinary system', urinary],
  [26, 'Fluid, electrolyte, and acid–base balance', fluids],
  [27, 'The reproductive system', reproduction],
  [28, 'Development and inheritance', development],
];

// Authors supply the key first. Vary its display position reproducibly so saved
// responses can be reviewed against the same version of each item.
function questionFromRow(row, position) {
  const [prompt, correct, distractorOne, distractorTwo, why] = row;
  const options = [distractorOne, distractorTwo];
  const answer = position % 3;
  options.splice(answer, 0, correct);
  return { prompt, options, answer, why };
}

export const chapters = course.map(([id, title, rows]) => ({
  id,
  title,
  sections: rows.map(({ id: sectionId, objective, explanation, worked, check }, index) => {
    const [sectionTitle, slug] = sectionSources[sectionId];
    const { prompt: question, options, answer, why } = questionFromRow(check, id + index);
    return {
      id: sectionId, title: sectionTitle, source: textbook + slug,
      objective, explanation, worked, question, options, answer, why,
    };
  }),
}));

export const examItems = course.flatMap(([chapterId, , rows]) =>
  rows.flatMap(({ id: section, exams }, index) =>
    exams.map((row, form) => ({
      id: `ap3-${section}-${form === 0 ? 'a' : 'b'}`,
      section,
      ...questionFromRow(row, chapterId + index * 2 + form + 1),
    })),
  ),
);
