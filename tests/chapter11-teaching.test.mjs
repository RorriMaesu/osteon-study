import test from 'node:test';
import assert from 'node:assert/strict';
import {chapter11Muscles} from '../src/chapter11-muscles.js';
import {chapter11Glossary} from '../src/chapter11-glossary.js';
import {chapter11Cases,fasciclePatterns,fasciclePatternSVG,pelvicRelationshipSVG,fourthPlantarLayerSVG,muscleCardMatches,muscleNameClue,figureTargetForCard} from '../src/chapter11-practice.js';
import {muscleNameExamples} from '../src/chapter11-activities.js';
import {muscleFigureTargets,musclePlateSVG} from '../src/muscle-figure-targets.js';
import assets from '../src/muscle-textbook-assets.json' with {type:'json'};

test('supplemental named structures retain the original course checklist and distinguish connective tissue',()=>{
 assert.equal(chapter11Muscles.filter(card=>card.courseChecklist).length,67);
 assert.equal(new Set(chapter11Muscles.map(card=>card.id)).size,chapter11Muscles.length);
 for(const name of ['Semispinalis cervicis','Semispinalis thoracis','Interspinales','Intertransversarii','Innermost intercostals','Compressor urethrae','Sphincter urethrovaginalis','Rhomboid major','Rhomboid minor']){
  const card=chapter11Muscles.find(card=>card.name===name);assert.ok(card,name);assert.equal(card.courseChecklist,false,name);assert.equal(card.sourceClass,'chapter-reference');
 }
 for(const name of ['Epicranial aponeurosis','Quadriceps tendon','Patellar ligament','Plantar aponeurosis'])assert.equal(chapter11Muscles.find(card=>card.name===name).kind,'connective tissue',name);
 for(const card of chapter11Muscles){assert.ok(Array.isArray(card.figures)&&Array.isArray(card.aliases),card.name);assert.ok(card.origin&&card.insertion&&card.action&&card.location,card.name);}
 assert.ok(chapter11Glossary.some(term=>term.name==='Carpal tunnel'));
 assert.ok(chapter11Glossary.some(term=>term.name==='Esophageal hiatus'));
});

test('group members are searchable and name recall supplies several distinguishing facts',()=>{
 const erector=chapter11Muscles.find(card=>card.name==='Erector spinae');
 assert.ok(muscleCardMatches(erector,'iliocostalis'));
 const quadratus=chapter11Muscles.find(card=>card.name==='Quadratus plantae');
 const clue=muscleNameClue(quadratus);assert.ok(clue.includes(quadratus.location));assert.ok(clue.includes(quadratus.action));assert.ok(clue.includes(quadratus.origin));
 for(const card of chapter11Muscles){const clue=muscleNameClue(card);assert.ok(clue.length>25,card.name);assert.ok(!clue.toLowerCase().includes(card.name.toLowerCase()),card.name);}
});

test('hand dorsal-interossei card opens its existing verified target and every matching target belongs to its card',()=>{
 const card=chapter11Muscles.find(card=>card.name==='Dorsal interossei of hand');
 assert.equal(figureTargetForCard(card,muscleFigureTargets)?.[0],'dorsal-interossei');
 for(const card of chapter11Muscles){const match=figureTargetForCard(card,muscleFigureTargets);if(match)assert.ok(card.figures.includes(match[1].figure),card.name);}
 for(const id of ['subclavius','pectoralis-minor','serratus-anterior','trapezius','rhomboid-minor','rhomboid-major','pectoralis-major','deltoid','latissimus-dorsi','biceps-brachii','triceps-brachii','flexor-carpi-radialis','vastus-medialis','psoas-major']){
  assert.ok(chapter11Muscles.some(card=>figureTargetForCard(card,muscleFigureTargets)?.[0]===id),id);
 }
});

test('all source pins stay within artwork and masks neither cover targets nor expose names in alternate text',()=>{
 for(const [id,item] of Object.entries(muscleFigureTargets)){
  const asset=assets[item.figure],[x,y,w,h]=item.panel,[px,py]=item.point;
  assert.ok(asset&&x>=0&&y>=0&&x+w<=asset.width&&y+h<=asset.height,id);
  assert.ok(px>=x&&px<=x+w&&py>=y&&py<=y+h,id);
  for(const [mx,my,mw,mh] of [item.cover,...(item.extraCovers||[])]){
   assert.ok(mx>=0&&my>=0&&mx+mw<=asset.width&&my+mh<=asset.height,id);
   assert.ok(!(px>=mx&&px<=mx+mw&&py>=my&&py<=my+mh),id);
  }
  const hidden=musclePlateSVG(item.figure,{targetId:id,hideLabel:true});
  assert.equal((hidden.match(/<rect /g)||[]).length,1+(item.extraCovers?.length||0),id);
  assert.ok(!hidden.toLowerCase().includes(item.name.toLowerCase()),id);
 }
});

test('active guided cases cover every regional section with valid distinct answer choices',()=>{
 const ids=[];
 for(const section of ['11.1','11.3','11.4','11.5','11.6']){
  const items=chapter11Cases[section];assert.ok(items.length>=5,section);
  for(const item of items){ids.push(item.id);assert.ok(item.key>=0&&item.key<item.options.length,item.id);assert.equal(new Set(item.options).size,item.options.length,item.id);assert.ok(item.prompt&&item.answer.length>50,item.id);}
 }
 assert.equal(new Set(ids).size,ids.length);
 const naming=new Set(muscleNameExamples.flatMap(([,parts])=>parts.map(part=>part[2])));
 assert.deepEqual([...naming].sort(),['Location','Shape','Fiber direction','Relative size','Relative position','Heads','Attachments','Action'].sort());
});

test('architecture and fourth-layer drawings remain explicit original relationship schematics',()=>{
 assert.equal(fasciclePatterns.length,7);
 const patterns=fasciclePatterns.map((_,i)=>fasciclePatternSVG(i));assert.equal(new Set(patterns).size,7);
 for(const svg of patterns)assert.doesNotMatch(svg,/NaN|undefined/);
 assert.match(patterns[1],/Q280 -5 460 130/);
 assert.match(pelvicRelationshipSVG(),/Not a specimen/);
 assert.match(fourthPlantarLayerSVG('plantar'),/Three plantar interossei on toes 3–5/);
 assert.match(fourthPlantarLayerSVG('dorsal'),/Four dorsal interossei abduct toes 2–4/);
 assert.notEqual(fourthPlantarLayerSVG('plantar'),fourthPlantarLayerSVG('dorsal'));
});
