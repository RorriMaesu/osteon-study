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
    assert.ok(sourceAsset(view.displayImage.src).size > 1000, view.displayImage.src);
    assert.equal(new URL(view.sourceUrl).hostname, 'openstax.org');
    if (view.panel) {
      const [x,y,width,height] = view.panel;
      assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0, card.id);
      assert.ok(x + width <= view.width && y + height <= view.height, card.id);
      assert.deepEqual([view.displayImage.width,view.displayImage.height], [width,height], card.id);
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

test('gastrocnemius loads the dedicated OpenStax posterior crop with both head labels', () => {
  const view = muscleListOpenStaxFigure('ch11-gastrocnemius');
  assert.equal(view.number, '11.32');
  assert.match(view.label, /lateral and medial heads/);
  assert.match(view.src, /figure-11-32-posterior\.jpg$/);
  assert.equal(view.displayImage.src, view.src);
  assert.deepEqual([view.displayImage.width,view.displayImage.height], [695,800]);
  assert.equal(view.panel, undefined);
  assert.match(view.sourceUrl, /#fig-ch11_06_04$/);
});

test('flexor digitorum longus opens the labeled deep posterior panel as a standalone image', () => {
  const view = muscleListOpenStaxFigure('ch11-flexor-digitorum-longus');
  assert.equal(view.number, '11.32');
  assert.equal(view.label, 'Flexor digitorum longus');
  assert.match(view.displayImage.src, /panels\/11-32-1580-0-699-1358\.webp$/);
  assert.deepEqual([view.displayImage.width,view.displayImage.height], [699,1358]);
  assert.match(view.sourceUrl, /#fig-ch11_06_04$/);
});
