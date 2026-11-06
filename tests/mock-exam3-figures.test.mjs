import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {mockExam3Figures,renderMockFigure,mockFigureReady,preloadMockFigures} from '../src/mock-exam3-figures.js';

test('nine exact packet assets have source manifests and unmasked targets',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../assets/mock-exam3/manifest.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(mockExam3Figures).length,9);
 assert.equal(manifest.assets.length,9);
 for(let number=31;number<=39;number++){
  const p=mockExam3Figures[`exam3-q${number}`],m=manifest.assets.find(a=>a.assetId===p.assetId);
  assert.ok(p&&m);assert.equal(p.number,number);assert.ok(mockFigureReady({assetId:p.assetId}));
  const bytes=fs.readFileSync(new URL(`../${p.src}`,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256);
  assert.ok(p.point[0]>=0&&p.point[0]<p.size[0]&&p.point[1]>=0&&p.point[1]<p.size[1]);
  assert.ok(!p.masks.some(([x,y,w,h])=>p.point[0]>=x&&p.point[0]<=x+w&&p.point[1]>=y&&p.point[1]<=y+h));
  assert.match(p.credit,/permission/);assert.doesNotMatch(p.credit,/OpenStax|Rice University/);
 }
});

test('exam figure captions and accessible names do not reveal the canonical answer',()=>{
 for(const p of Object.values(mockExam3Figures)){
  const exam=renderMockFigure({assetId:p.assetId});
  assert.ok(!exam.toLowerCase().includes(p.name.toLowerCase()),p.assetId);
  assert.match(exam,/role="img"/);assert.match(exam,new RegExp(`Number ${p.number} marks`));
  assert.ok(renderMockFigure(p,{reveal:true}).includes(p.name));
 }
 assert.equal(mockFigureReady({assetId:'missing'}),false);
 assert.match(renderMockFigure({assetId:'missing'}),/unavailable/);
});

test('repeated figures receive distinct mask IDs and marker text is escaped',()=>{
 const a=renderMockFigure(31),b=renderMockFigure(31);
 assert.notEqual(a.match(/id="([^"]+)"/)[1],b.match(/id="([^"]+)"/)[1]);
 const html=renderMockFigure(31,{marker:'<script>'});
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});

test('asset preflight is explicitly unavailable outside a browser',async()=>{
 const result=await preloadMockFigures();assert.equal(result.ready,false);assert.equal(result.missing.length,9);
});
