import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateRawSync} from 'node:zlib';
import {muscleWorksheetPanels,muscleWorksheetTargets,worksheetPanelTargets,validWorksheetDraft} from '../src/muscle-worksheet-data.js';
import {worksheetPicture,worksheetViewBox} from '../src/muscle-worksheet.js';
import {worksheetZipEntries,inflateWorksheetEntry,crc32,readMuscleWorksheetFile,identifyWorksheetImage} from '../src/muscle-worksheet-import.js';
import {chapter11Muscles} from '../src/chapter11-muscles.js';

function archive(entries){
 const parts=[],directory=[];let offset=0;
 for(const [name,payload,method=0] of entries){
  const filename=Buffer.from(name),data=Buffer.from(payload),compressed=method===8?deflateRawSync(data):data,crc=crc32(data),local=Buffer.alloc(30),central=Buffer.alloc(46);
  local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(filename.length,26);
  central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(method,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(filename.length,28);central.writeUInt32LE(offset,42);
  parts.push(local,filename,compressed);directory.push(central,filename);offset+=local.length+filename.length+compressed.length;
 }
 const contents=Buffer.concat(parts),index=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(index.length,12);end.writeUInt32LE(contents.length,16);return Buffer.concat([contents,index,end]);
}
const doc=(extra=[])=>archive([['[Content_Types].xml','<Types/>'],['word/document.xml','<document/>'],...extra]);

test('local DOCX reader supports stored and raw-deflate media with integrity checks',async()=>{
 const bytes=doc([['word/media/image1.png','test image one',0],['word/media/image2.png','test image two',8]]),entries=worksheetZipEntries(bytes);
 assert.equal(entries.length,2);
 assert.equal(new TextDecoder().decode(await inflateWorksheetEntry(entries[0])),'test image one');
 assert.equal(new TextDecoder().decode(await inflateWorksheetEntry(entries[1])),'test image two');
 await assert.rejects(()=>inflateWorksheetEntry({...entries[1],crc:0}),/integrity/);
 await assert.rejects(()=>inflateWorksheetEntry({...entries[1],length:1}),/larger than declared/);
});

test('worksheet import rejects malformed archives, traversal, non-DOCX files and mismatched images',async()=>{
 assert.throws(()=>worksheetZipEntries(new Uint8Array(30)),/not a readable/);
 assert.throws(()=>worksheetZipEntries(archive([['word/media/image.png','x']])),/Word DOCX/);
 assert.throws(()=>worksheetZipEntries(doc([['word/media/../image.png','x']])),/invalid/);
 assert.throws(()=>worksheetZipEntries(doc([['word/media/image.png','x'],['word/media/image.png','y']])),/duplicate/);
 await assert.rejects(()=>readMuscleWorksheetFile(new File([doc([['word/media/image.png','unrecognized']])],'different.docx')),/No matching/);
 assert.equal(await identifyWorksheetImage(new Uint8Array([1,2,3])),null);
});

test('worksheet targets retain valid panels and matching course cards',()=>{
 assert.equal(new Set(muscleWorksheetPanels.map(panel=>panel.id)).size,muscleWorksheetPanels.length);
 for(const [id,target] of Object.entries(muscleWorksheetTargets)){
  assert.equal(target.id,id);const panel=muscleWorksheetPanels.find(panel=>panel.id===target.panelId);assert.ok(panel,id);
  const [x,y,w,h]=panel.bounds;assert.ok(x>=0&&y>=0&&x+w<=panel.width&&y+h<=panel.height,panel.id);
  assert.ok(target.point[0]>=x&&target.point[0]<=x+w&&target.point[1]>=y&&target.point[1]<=y+h,id);
  if(target.termId){const card=chapter11Muscles.find(card=>card.id===target.termId);assert.ok(card,id);if(target.source==='openstax')assert.ok(card.figures.includes(target.figure),id);}
 }
});

test('eleven numbered leg targets follow the original published key and retain endpoint order',()=>{
 const expected=['Extensor digitorum longus','Tibialis anterior','Fibularis longus','Gastrocnemius','Soleus','Flexor digitorum longus','Tibialis anterior','Extensor digitorum longus','Fibularis longus','Soleus','Gastrocnemius'];
 for(let i=1;i<=11;i++){const target=muscleWorksheetTargets['worksheet-leg-'+i];assert.equal(target.name,expected[i-1]);assert.equal(target.number,i);assert.match(target.verification.source,/purposegames/);}
 assert.deepEqual(worksheetPanelTargets('worksheet-leg-front').map(target=>target.number),[1,2,3,4,5,6]);
 assert.deepEqual(worksheetPanelTargets('worksheet-leg-side').map(target=>target.number),[7,8,9,10,11]);
});

test('label and locate drawings hide source answer labels and expose only numbered accessible markers',()=>{
 const panel=muscleWorksheetPanels.find(panel=>panel.figure==='11.7'),target=worksheetPanelTargets(panel.id)[0];
 const label=worksheetPicture(panel,{mode:'label',targetId:target.id});assert.match(label,/<rect /);assert.doesNotMatch(label,new RegExp(target.name,'i'));
 const locate=worksheetPicture(panel,{mode:'locate',targetId:target.id});assert.match(locate,/role="button" tabindex="0"/);assert.match(locate,/aria-label="Marker 1"/);assert.doesNotMatch(locate,new RegExp(target.name,'i'));
 assert.match(locate,/<svg x="/);assert.match(locate,/overflow="hidden"/);
});

test('zoom remains bounded and a saved draft cannot select a target from another panel',()=>{
 const panel=muscleWorksheetPanels[0],target=worksheetPanelTargets(panel.id)[0],draft={version:1,panel:panel.id,mode:'label',target:target.id,response:'orbicularis',assisted:false,finished:false,feedback:''};
 assert.ok(validWorksheetDraft(draft));assert.equal(validWorksheetDraft({...draft,target:'worksheet-leg-2'}),false);assert.equal(validWorksheetDraft({...draft,response:'x'.repeat(121)}),false);
 for(const zoom of [-1,1,2,200])for(const center of [[-1e6,-1e6],[1e6,1e6]]){const box=worksheetViewBox(panel,zoom,center),[x,y,w,h]=panel.bounds;assert.ok(box[0]>=x&&box[1]>=y);assert.ok(box[0]+box[2]<=x+w+.001&&box[1]+box[3]<=y+h+.001);}
});
