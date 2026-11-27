import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, examItems } from '../src/ap3-curriculum.js';
import { chapterLabs, renderLab } from '../src/ap3-labs.js';
import { excretion, heat, ventilation, waterShift } from '../src/ap3-labs-experiments.js';
import { acidBase, pedigree } from '../src/ap3-labs-evidence.js';

test('each numbered section has its own source, worked example, check, and two independent exam prompts', () => {
  const lengths = [7, 7, 7, 7, 10, 5, 3, 7];
  const prompts = new Set();
  const ids = new Set();
  const assertNewPrompt = prompt => {
    assert.ok(!prompts.has(prompt), prompt);
    prompts.add(prompt);
  };
  const assertOptions = question => {
    assert.ok(question.options.length >= 3);
    assert.equal(new Set(question.options).size, question.options.length);
    assert.ok(Number.isInteger(question.answer));
    assert.ok(question.options[question.answer]);
    assert.ok(question.why.length > 25);
  };
  for (const [chapterIndex, chapter] of chapters.entries()) {
    assert.equal(chapter.id, chapterIndex + 21);
    assert.equal(chapter.sections.length, lengths[chapterIndex]);
    for (const [i, s] of chapter.sections.entries()) {
      assert.equal(s.id, chapter.id + '.' + (i + 1));
      assert.ok(s.source.startsWith('https://openstax.org/books/anatomy-and-physiology-2e/pages/' + s.id.replace('.', '-') + '-'));
      for (const field of ['objective','explanation','worked']) assert.ok(s[field].length >= 30, s.id + ' ' + field);
      assertNewPrompt(s.question);
      assertOptions(s);
      const items = examItems.filter(q => q.section === s.id);
      assert.deepEqual(items.map(q => q.id), ['ap3-' + s.id + '-a', 'ap3-' + s.id + '-b']);
      for (const q of items) {
        assert.ok(!ids.has(q.id)); ids.add(q.id);
        assertNewPrompt(q.prompt); assertOptions(q);
      }
    }
  }
  assert.equal(ids.size,106);
  assert.equal(prompts.size,159);
});

function variations(controls) {
  return controls.reduce((states, c) => states.flatMap(state => {
    const values = c.labels ? c.labels.map((_, i) => i) : [c.min, c.initial, c.max];
    return [...new Set(values)].map(value => ({...state, [c.key]:value}));
  }), [{}]);
}

test('all chapter labs produce complete observations and alternative choices at the limits of their controls', () => {
  const sections = new Set(chapters.flatMap(c => c.sections.map(s => s.id)));
  for (const [chapterId, list] of Object.entries(chapterLabs)) {
    assert.ok(renderLab(chapterId).includes('data-ap3-activity'));
    for (const activity of list) {
      assert.ok(sections.has(activity.section));
      if (activity.routes) {
        for (const route of activity.routes) {
          assert.ok(route.steps.length >= 3);
          for (const [key, foil1, foil2, why] of route.steps) {
            assert.equal(new Set([key, foil1, foil2]).size,3);
            assert.ok(why.length > 25);
          }
        }
      } else for (const inputs of variations(activity.controls)) {
        const result = activity.run(inputs);
        assert.equal(new Set(result.choices).size,result.choices.length);
        assert.ok(result.question && result.why && result.observation.caption);
        assert.ok(result.frames.length >= 2);
        for (const observation of [result.observation,result.result].filter(Boolean)) {
          assert.ok(observation.rows.every(row => row.length === observation.headers.length));
        }
        for (const plot of [result.plot,result.plotAfter].filter(Boolean)) {
          assert.ok(plot.rows.every(row => row.every(Number.isFinite)));
        }
        assert.doesNotMatch(JSON.stringify(result),/NaN|undefined|Infinity/);
      }
    }
  }
});

test('water, mass, heat and ventilation models retain direction, units and zero crossings', () => {
  const water = v => waterShift.run({initialVol:1,outside:v});
  assert.equal(water(200).choices[0],'Water enters the cell');
  assert.equal(water(300).choices[0],'No net water movement');
  assert.equal(water(400).choices[0],'Water exits the cell');
  assert.match(water(400).frames.at(-1)[1],/0\.75 L/);
  assert.equal(excretion.run({reabs:40,secrete:40}).choices[0],'Equal to filtered load');
  assert.match(excretion.run({reabs:100,secrete:0}).frames.at(-1)[1],/0 mg\/min excreted/);
  assert.equal(heat.run({evap:160}).choices[0],'Stored heat stays constant');
  assert.match(heat.run({evap:200}).frames.at(-1)[1],/[-−]2\.4 kJ/);
  assert.match(ventilation.run({dead:150}).frames.at(-1)[1],/4\.20 L\/min.+3\.00 L\/min/);
});

test('the four illustrative gas panels agree with the bicarbonate equation and the known phenotype conditions the pedigree', () => {
  for(let i=0; i<4; i++) {
    const [pH, co2, bicarb] = acidBase.run({panel:i}).observation.rows[0];
    assert.ok(Math.abs(pH - (6.1 + Math.log10(bicarb/(0.03*co2)))) < 0.015);
  }
  assert.deepEqual([0,1,2].map(evidence => pedigree.run({evidence}).choices[0]),['1/2','2/3','0']);
});
