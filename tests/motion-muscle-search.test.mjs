import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {indexMotionMuscles,searchMotionMuscles} from '../src/motion-muscle-search.js';

const asset=readFileSync(new URL('../assets/motion-pose-body.glb',import.meta.url));
const model=JSON.parse(asset.subarray(20,20+asset.readUInt32LE(12)));
const parts=model.nodes.map(node=>node.extras).filter(data=>data?.poseMuscle).map(data=>({
 key:data.muscleId,name:data.poseName,muscleName:data.poseMuscle,side:data.poseSide||'midline',
}));
const index=indexMotionMuscles(parts);
const search=query=>searchMotionMuscles(index,query);

test('whole-body search indexes each modeled part once',()=>{
 const entries=search('').map(result=>result.entry);
 assert.equal(entries.length,parts.length);
 assert.equal(new Set(entries.map(part=>part.key)).size,parts.length);
 for(const part of parts){
  assert(search(part.name+' '+part.side).some(result=>!result.close&&result.entry.key===part.key),part.key);
 }
});

test('misspelling points to named muscle heads and respects side',()=>{
 const hits=search('left gastrocnemus');
 assert.equal(hits.length,2);
 assert(hits.every(({entry,close})=>close&&entry.side==='left'&&/head of gastrocnemius/i.test(entry.name)));
 assert.deepEqual(search('gastrocnemus lateral R').map(hit=>hit.entry.side),['right']);
});

test('canonical wording and muscle-specific aliases rank ahead of close spelling',()=>{
 const exact=search('right gluteus medius');
 assert(exact.length>0);
 assert(exact.every(hit=>!hit.close&&/medius/i.test(hit.entry.name)));
 assert.match(search('left bicep')[0].entry.muscleName,/biceps brachii/i);
 assert(search('dorsi latissmus').some(hit=>hit.close&&/latissimus dorsi/i.test(hit.entry.name)));
 assert(search('SCM right').some(hit=>!hit.close&&/sternocleidomastoid/i.test(hit.entry.name)));
 assert.deepEqual(search('xyzzy'),[]);
});
