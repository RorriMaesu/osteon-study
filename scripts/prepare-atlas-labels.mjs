// Write a Blender input manifest from the same source-backed terms used by the app.
import fs from 'node:fs';
import {allTerms} from '../src/data.js';
import '../src/representations.js';
import source from '../src/lab-list-source.json' with {type:'json'};
import models from '../assets/landmark-model-inventory.json' with {type:'json'};
const teacher=new Set(source.rows.flatMap(r=>r.termIds));
const entries=allTerms.map(t=>({id:t.id,name:t.name,type:t.type,region:t.region,teacher:teacher.has(t.id),pattern:t.representation.parentPattern||t.pattern,object:t.representation.object||null,kind:t.representation.kind,detailGroup:t.representation.detailGroup||null,retired:!!t.representation.retiredModel,held:t.representation.assessment==='learn-only',reference:t.representation.reference,points:t.representation.retiredModel?[]:t.representation.points||[]}));
const output=process.argv[2];if(!output)throw Error('Pass an output manifest path.');
fs.writeFileSync(output,JSON.stringify({schema:1,source:source.source.sha256,entries,models},null,2)+'\n');
console.log(JSON.stringify({entries:entries.length,teacher:entries.filter(t=>t.teacher).length,output}));
