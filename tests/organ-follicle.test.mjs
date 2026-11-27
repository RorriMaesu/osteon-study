import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createOrganMotion} from '../src/organ-atlas-catalog.js';
import {specimenAnimations} from '../src/ap3-specimen-animations.js';
import {follicleMotion,releaseSection} from '../src/organ-motion-follicle.js';

test('the spring follicle opens its seven-layer microscopic activity with a separate release section',async()=>{
  const entry=follicleMotion;
  assert.equal(specimenAnimations({id:'ovarian-follicle',asset:entry.asset})[0],entry);
  const raw=readFileSync(new URL('../'+entry.asset,import.meta.url));
  const {scene:model}=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
  const map=new Map(entry.targets.map(n=>[n,[model.getObjectByName(n)]]));
  assert.equal(map.size,7);for(const [n,[mesh]] of map)assert(mesh?.isMesh,n);
  const original=[...map.values()].map(([mesh])=>[mesh,mesh.material]);
  const motion=createOrganMotion(entry,{model,invalidate(){}},map);
  const corona=map.get('corona_radiata')[0];motion.set(0);
  const color=corona.material.color.getHex();motion.set(.3);assert.notEqual(corona.material.color.getHex(),color);
  motion.dispose();for(const [mesh,m] of original)assert.equal(mesh.material,m);
});

test('the release inset opens its wall before the secondary oocyte and corona cross it',()=>{
  assert.equal(releaseSection(0).gap,0);
  let last=0;
  for(let i=0;i<=100;i++){
    const {x,y,gap}=releaseSection(i/100);
    assert(x>=last);last=x;
    if(x>185&&x<226)assert(40*Math.sin(gap)>Math.abs(y-65)+12.4,'the cell and attached corona must clear both wall edges');
  }
  assert(releaseSection(1).x-12.4>212);
});
