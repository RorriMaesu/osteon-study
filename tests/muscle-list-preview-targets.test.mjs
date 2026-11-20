import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {muscleChecklistTargets} from '../src/muscle-checklist-bank.js';
import {muscleListPreviewTarget} from '../src/muscle-list-preview-targets.js';

test('every required card resolves to a distinct isolated image of the declared type', () => {
  const previews = muscleChecklistTargets.map(card => muscleListPreviewTarget(card.id));
  assert.equal(previews.length, 67);
  assert.equal(new Set(previews.map(target => target.src)).size, previews.length);
  for (const target of previews) {
    const data = readFileSync(new URL('../'+target.src, import.meta.url));
    assert.ok(target.caption);
    if (target.status === 'missing') {
      assert.ok(target.sourceUrl.startsWith('https://'));
      assert.equal(target.components.length, 0);
      assert.match(data.toString('utf8'), /<desc id="desc">[^<]+<\/desc>/);
    } else {
      assert.ok(target.components.length > 0 && target.components.every(c => c.id && !c.retired));
      assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    }
  }
  assert.equal(muscleListPreviewTarget('unknown'), null);
});

test('isolated previews retain complete modeled groups and name any representative example', () => {
  const target = slug => muscleListPreviewTarget('ch11-'+slug);
  const cuff = target('rotator-cuff').components;
  assert.deepEqual(cuff.map(c => c.muscleName).sort(), ['Infraspinatus muscle','Subscapularis muscle','Supraspinatus muscle','Teres minor muscle']);
  assert.ok(cuff.every(c => c.side === 'right'));
  assert.deepEqual(new Set(target('orbicularis-oris').components.map(c => c.side)), new Set(['left','right']));
  assert.match(target('pelvic-diaphragm').caption, /partial/i);
  for (const slug of ['aponeurosis','fascia','tendon-sheaths']) {
    const {caption, components} = target(slug);
    assert.equal(new Set(components.map(c => c.muscleName)).size, 1);
    assert.ok(caption.includes(components[0].muscleName));
  }
  const extensor = target('extensor-digitorum-longus').components;
  assert.deepEqual(extensor.map(c => c.sourceName), ['Extensor digitorum longus.r','Tendon of extensor digitorum longus.r']);
});
