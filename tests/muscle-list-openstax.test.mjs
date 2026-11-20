import test from 'node:test';
import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import {muscleChecklistTargets} from '../src/muscle-checklist-bank.js';
import {muscleListOpenStaxFigure} from '../src/muscle-list-openstax.js';

const sourceAsset = src => statSync(new URL('../'+src,import.meta.url));

test('all required muscle cards resolve to local OpenStax artwork and a section link', () => {
  for (const card of muscleChecklistTargets) {
    const view = muscleListOpenStaxFigure(card.id);
    assert.ok(view?.label, card.id);
    assert.ok(sourceAsset(view.src).size > 1000, view.src);
    assert.equal(new URL(view.sourceUrl).hostname, 'openstax.org');
    if (view.panel) {
      const [x,y,width,height] = view.panel;
      assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0, card.id);
      assert.ok(x + width <= view.width && y + height <= view.height, card.id);
      if (view.annotation) {
        const [targetX,targetY] = view.annotation.point;
        assert.ok(targetX > x && targetY > y && targetX < x + width && targetY < y + height, card.id);
      }
    }
    if (view.supplement) assert.ok(sourceAsset(view.supplement.src).size > 1000, card.id);
  }
  assert.equal(muscleListOpenStaxFigure('ch11-unknown'), null);
});

test('the figure metadata identifies author labels, tissue examples and supplemental plates accurately', () => {
  const figure = slug => muscleListOpenStaxFigure('ch11-'+slug);
  assert.equal(figure('external-urethral-sphincter').number, '25.4');
  for (const name of ['flexor', 'extensor']) {
    const view = figure(name+'-retinaculum-of-wrist');
    assert.equal(view.number, '11.25');
    assert.equal(view.status, 'labeled');
  }
  assert.equal(figure('zygomaticus-major').status, 'annotated');
  assert.equal(figure('fascia').status, 'example');
  assert.equal(figure('fascia').number, '5.2');
  assert.equal(figure('aponeurosis').status, 'example');
  for (const name of ['vastus-intermedius','tendon-sheaths']) {
    const view = figure(name);
    assert.equal(view.status, 'reference');
    assert.match(view.supplement.label, /Gray’s Anatomy/);
  }
});
