import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {correctEyeWinding} from '../src/organ-eye-winding.js';

test('the mirrored left eye renders outward surfaces and restores the donor buffers',async()=>{
  const bytes=readFileSync(new URL('../assets/organ-atlas/registered-organs.glb',import.meta.url));
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  for(const part of ['sclera','iris','cornea','lens','retina']){
    const left=scene.getObjectByName(part+'_left'),right=scene.getObjectByName(part+'_right'),original=left.geometry;
    const restore=correctEyeWinding(left,left.name);
    assert.ok(restore,part);
    assert.equal(correctEyeWinding(right,right.name),undefined);
    assert.equal(correctEyeWinding(left,left.name),undefined);
    assert.deepEqual(left.geometry.attributes.position.array,original.attributes.position.array);
    const i=original.index.getX(0),n=new Vector3().fromBufferAttribute(original.attributes.normal,i);
    assert.ok(n.dot(new Vector3().fromBufferAttribute(left.geometry.attributes.normal,i))<-.99);
    assert.equal(left.geometry.index.getX(1),original.index.getX(2));
    restore();assert.equal(left.geometry,original);
  }
});
