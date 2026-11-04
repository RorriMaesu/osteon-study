import test from 'node:test';
import assert from 'node:assert/strict';
import {observablePinChoices,questionMode,identificationPoints} from '../src/practice-pin-policy.js';
const key={term:{id:'key'},point:[0,0,0]},covered={term:{id:'covered'},point:[1,0,0]},visible={term:{id:'visible'},point:[0,1,0]};
test('locating choices omit covered markers and never pit visible alternatives against a buried key',()=>{
 assert.deepEqual(observablePinChoices([key,covered,visible],'key',p=>p[0]===0),[key,visible]);
 assert.deepEqual(observablePinChoices([key,visible],'key',p=>p[1]===1),[]);
 assert.deepEqual(observablePinChoices([key,covered],'key',p=>p[0]===0),[key]);
});
test('curves are assessed by their profile, groups retain all points and a canal uses its chosen level',()=>{
 const points=[{label:'a'},{label:'b'},{label:'c'}];assert.deepEqual(identificationPoints({points,fitToContext:true}),[]);assert.deepEqual(identificationPoints({points,presentAllPoints:true}),points);assert.deepEqual(identificationPoints({points,singlePinIndex:1}),[points[1]]);
});
test('a shape target or temporary fallback uses name recall without changing later locating questions',()=>{
 assert.equal(questionMode('locate',{fitToContext:true,index:0}),'identify');
 assert.equal(questionMode('locate',{index:1,fallbackIndex:1}),'identify');
 assert.equal(questionMode('locate',{index:2,fallbackIndex:1}),'locate');
 assert.equal(questionMode('identify',{index:2}),'identify');
});
