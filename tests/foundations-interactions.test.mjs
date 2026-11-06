import test from 'node:test';
import assert from 'node:assert/strict';
import {foundationsVisuals} from '../src/visual-foundations.js';
import {fractureSVG,repairSVG} from '../src/fracture-diagrams.js';

test('the mitral valve depicts distinct forward-flow and sealing positions',()=>{
 const art=foundationsVisuals['1.1'].art;
 assert.match(art(1),/--valve-angle:0deg/);
 assert.match(art(2),/--valve-angle:-53deg/);
 assert.match(art(2),/--valve-angle:53deg/);
});

test('fracture pattern stays fixed when the skin is opened',()=>{
 const closed=fractureSVG('oblique',{skinStatus:'closed'});
 const open=fractureSVG('oblique',{skinStatus:'open'});
 const line=svg=>svg.match(/class="fracture-line" d="([^"]+)"/)[1];
 assert.equal(line(open),line(closed));
 assert.match(open,/data-wound-channel/);
 assert.doesNotMatch(closed,/data-wound-channel/);
 assert.match(fractureSVG('open'),/data-wound-channel/);
 assert.match(repairSVG('hematoma'),/L146 147V25Z/);
 assert.doesNotMatch(repairSVG('remodeled'),/L146 147V25Z/);
});
