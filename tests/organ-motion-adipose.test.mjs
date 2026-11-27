import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Scene,Raycaster,Vector3,DoubleSide} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {adiposeLipolysis,mountAdiposeLipolysis} from '../src/organ-motion-adipose.js';
import {specimenAnimations,animationForTarget} from '../src/ap3-specimen-animations.js';
import {specimens} from '../src/ap3-specimens-catalog.js';

test('lipolysis opens just the selected adipocyte and releases three fatty acids and one glycerol into the model vessel',async()=>{
  const bytes=readFileSync(new URL('../'+adiposeLipolysis.asset,import.meta.url));
  const {scene:model}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const scene=new Scene();scene.add(model);
  const byName=new Map([...adiposeLipolysis.targets,...adiposeLipolysis.context].map(key=>[key,[model.getObjectByName(key)]]));
  const cells=byName.get('adipocytes')[0],vessel=byName.get('cutaneous_vessels')[0];
  const oldGeometry=cells.geometry,oldMaterial=cells.material,oldCount=oldGeometry.index.count;
  const motion=mountAdiposeLipolysis(adiposeLipolysis,{model,scene,invalidate(){}},byName);
  const fractionRemoved=1-cells.geometry.index.count/oldCount;
  assert.ok(fractionRemoved>.009&&fractionRemoved<.014,'one anterior half among 42 cells');
  const root=model.getObjectByName('Adipocyte lipid mobilization'),drop=root.getObjectByName('Illustrative lipid droplet');
  const products=root.children.filter(o=>/product/.test(o.name));
  assert.equal(products.filter(p=>p.name.startsWith('Fatty acid')).length,3);
  assert.equal(products.filter(p=>p.name.startsWith('Glycerol')).length,1);
  motion.set(0);const initial=drop.scale.clone();assert.ok(products.every(p=>!p.visible));
  motion.set(1);assert.ok(drop.scale.x<initial.x&&products.every(p=>p.visible));
  model.updateWorldMatrix(true,true);vessel.material.side=DoubleSide;
  for(const token of products){
    const p=token.position.clone();
    for(const z of [-1,1]){
      const hit=new Raycaster(p,new Vector3(0,0,z)).intersectObject(vessel)[0];
      assert.ok(hit&&hit.distance<.055,token.name+' inside the vessel');
    }
  }
  const palette=[...byName.values()].map(([o])=>o.material.color.getHex());assert.equal(new Set(palette).size,5);
  motion.set(0);assert.ok(drop.scale.equals(initial));motion.dispose();
  assert.equal(cells.geometry,oldGeometry);assert.equal(cells.material,oldMaterial);assert.equal(root.parent,null);
});
test('the chapter 24 adipose specimen opens its own lipid-mobilization lesson',()=>{
  const specimen=specimens.find(s=>s.id==='adipose'),choices=specimenAnimations(specimen);
  assert.equal(animationForTarget(specimen,'adipocytes',choices)?.id,adiposeLipolysis.id);
});
