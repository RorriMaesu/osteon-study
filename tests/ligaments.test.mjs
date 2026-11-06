import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ligamentByMesh,ligamentInScope,ligamentSurfaces,ligamentTerms} from '../src/ligament-data.js';
import manifest from '../src/ligament-models.json' with {type:'json'};
import {adultVisibility} from '../src/model-visibility.js';
import {atlasMatches} from '../src/atlas-search.js';
import {areas} from '../src/exploration.js';

function readAsset(name){
 const file=readFileSync(new URL('../assets/'+name+'.glb',import.meta.url));
 const json=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
 return {file,names:json.nodes.filter(n=>n.mesh!=null).map(n=>n.extras?.zname)};
}
test('every published ligament maps to one surface in its designated GLB',()=>{
 assert.equal(ligamentByMesh.size,ligamentSurfaces.length);
 assert.equal(new Set(ligamentTerms.map(t=>t.id)).size,ligamentTerms.length);
 const assets=Object.fromEntries(['ligaments','course-tissues','landmark-details'].map(key=>[key,readAsset(key)]));
 assert.equal(createHash('sha256').update(assets.ligaments.file).digest('hex'),manifest.assetSha256);
 assert.equal(assets.ligaments.names.length,ligamentSurfaces.filter(r=>r.asset==='ligaments').length);
 for(const record of ligamentSurfaces){
  assert.deepEqual(Object.keys(assets).flatMap(asset=>assets[asset].names.filter(n=>n===record.sourceName).map(()=>asset)),[record.asset],record.sourceName);
  assert.ok(record.faces>0&&record.areas.length&&record.areas.every(a=>areas[a]),record.sourceName);
  if(record.side)assert.ok((record.boundsBlender[0][0]+record.boundsBlender[1][0])*(record.side==='r'?-1:1)>0,record.sourceName);
 }
});

test('ligaments follow side and region, honor peeling, and stay hidden from practice',()=>{
 const record=ligamentByMesh.get('Anterior talofibular ligament.r');
 assert.equal(ligamentInScope(record,{region:'All regions',focus:{}}),true);
 assert.equal(ligamentInScope(record,{region:'All regions',focus:{areaId:'hand',side:'r'}}),false);
 assert.equal(ligamentInScope(record,{region:'Lower limb',focus:{areaId:'foot',side:'l'}}),false);
 assert.equal(ligamentInScope(record,{region:'Lower limb',focus:{areaId:'foot',side:'r'}}),true);
 const mesh={name:record.sourceName,tissue:true,ligament:record};
 const base={division:'All',discs:true,tissues:false,inScope:true};
 assert.equal(adultVisibility(mesh,{...base,ligaments:true}).visible,true);
 assert.equal(adultVisibility(mesh,{...base,ligaments:true,division:'Axial'}).visible,false);
 assert.equal(adultVisibility(mesh,{...base,ligaments:true,hidden:true}).visible,false);
 assert.equal(adultVisibility(mesh,{...base,ligaments:true,isolated:true,boneView:true}).visible,true);
 assert.equal(adultVisibility(mesh,{...base,ligaments:false,tissues:true}).visible,false);
 const legacy={name:'Anterior cruciate ligament.r',tissue:true,ligament:ligamentByMesh.get('Anterior cruciate ligament.r')};
 assert.equal(adultVisibility(legacy,{...base,selected:true}).visible,true);
 assert.equal(adultVisibility(legacy,{...base,ligaments:false,tissues:true}).visible,false);
 assert.equal(adultVisibility(legacy,{...base,tissues:true}).visible,true);
});

test('common abbreviations and side-corrected names can be found in the explorer',()=>{
 assert.deepEqual(atlasMatches(ligamentTerms,'ACL').slice(0,2).map(t=>t.name),['Anterior cruciate ligament (left)','Anterior cruciate ligament (right)']);
 assert.equal(atlasMatches(ligamentTerms,'transverse atlantal ligament')[0].name,'Transverse ligament of atlas');
 assert.equal(ligamentByMesh.get('Lateral temporomandibular ligament.l').side,'r');
});
