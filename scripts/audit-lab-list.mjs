import fs from 'node:fs';
import {terms,matches} from '../src/data.js';
import {pointKinds} from '../src/representations.js';
import {labListSource,listEntries,listQuestions,listStats,entryStatus} from '../src/lab-list.js';

const root=new URL('../',import.meta.url),nodes=[];
for(const file of ['skeleton','course-tissues','landmark-details']){
 const b=fs.readFileSync(new URL(`assets/${file}.glb`,root)),d=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 nodes.push(...d.nodes.filter(n=>n.mesh!==undefined).map(n=>({file: file+'.glb',...n})));
}
const records=listEntries().map(({term:t,rows})=>{
 const r=t.representation,supported=r.assessment!=='learn-only'&&(r.kind==='mesh'||pointKinds.includes(r.kind));
 const geometry=supported?nodes.filter(n=>r.detailGroup?n.extras?.detailGroup===r.detailGroup&&(!r.object||n.extras.zname.startsWith(r.object)):!n.extras?.detailGroup&&matches(r.parentPattern||t.pattern,n.extras?.zname||'')).map(n=>n.extras.zname):[];
 if(r.kind==='mesh'&&!geometry.length)throw new Error('Missing geometry: '+t.name);
 if(supported&&!geometry.length)throw new Error('Missing 3D parent: '+t.name);
 if(pointKinds.includes(r.kind)&&r.assessment!=='learn-only'&&(!r.points?.length||r.points.some(p=>p.point.length!==3||!p.point.every(Number.isFinite))))throw new Error('Missing finite target: '+t.name);
 return {id:t.id,name:t.name,region:t.region,sourceRows:rows.map(r=>r.id),sourceWording:rows.map(r=>r.sourceLabel),sourceSections:rows.map(r=>r.lab+' · '+r.section),status:entryStatus(t),kind:r.kind,assessment:r.assessment||'supported',reference:r.reference,geometry,aliases:t.aliases};
});
if(records.length!==terms.length||new Set(records.map(r=>r.id)).size!==177)throw new Error('Lab coverage mismatch');
const stats=listStats(),report={reviewed:'2026-10-29',source:labListSource.source,sourceItems:labListSource.rows.length,stats,scopeCounts:Object.fromEntries(['all','lab6','lab7','shoulder'].map(s=>[s,listStats(s)])),records};
fs.writeFileSync(new URL('bone-list-review.json',root),JSON.stringify(report,null,2)+'\n');
const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
fs.writeFileSync(new URL('BONE-LIST-CHECKLIST.csv',root),'Canonical name,Source wording,Source section,Region,Test format,OpenStax section,Atlas ID\r\n'+records.map(r=>[r.name,r.sourceWording.join(' / '),r.sourceSections.join(' / '),r.region,r.status,r.reference,r.id].map(csv).join(',')).join('\r\n')+'\r\n');
const rows=records.map(r=>`| ${r.name} | ${r.sourceWording.join(' / ')} | ${r.region} | ${r.status} |`).join('\n');
const counts=listQuestions().filter(t=>t.type==='count').map(t=>`| ${t.testLabel} | ${t.name} | ${t.cue} |`).join('\n');
fs.writeFileSync(new URL('BONE-LIST-REVIEW.md',root),`# BI 231 bone-list reconciliation

Reviewed **October 29, 2026** against **BI 231 Lab 6 and 7 Bone List F24.doc**. The original document is not redistributed. Its SHA-256 is \`${labListSource.source.sha256}\`.

**Every required named item maps to the learning suite.** The 152 mapped source items/context groups expand to **177 unique study entries**, retaining the original IDs. Combined labels are split where appropriate; metacarpals and metatarsals include their numbered 1–5 targets as well as the group. Sacrum and coccyx appear in both labs and are tested once in a full-document run.

The dedicated **Bone list test** has **182 questions**: **173 3D identification questions**, **two drawer movement questions**, **two source-recall questions**, and **five vertebral count blanks**. Open Practice lab → Open my bone-list test, or [open it directly](https://rorrimaesu.github.io/osteon-study/?lablist=1#practice).

| Scope | Named entries | Questions | Source assignment |
| --- | ---: | ---: | --- |
| Entire document | 177 | 182 | Every unique entry, plus the five count blanks |
| Lab 6 | 80 | 85 | Axial skeleton, including count blanks |
| Lab 7 bone test | 95 | 95 | Limbs, pelvis, hip and knee; includes the repeated sacrum/coccyx |
| Shoulder muscle test | 4 | 4 | Four ligaments explicitly assigned to the muscle test on the sheet |

The separate scopes overlap at sacrum and coccyx, so their counts should not be added to infer the unique full-list total. Search filters the checklist; it does not silently narrow the selected test scope. A 10- or 20-question session and a missed-item retry are clearly identified as subsets.

## Label and coverage checks

- Matched every document item, combined pair/group, numbered range and term to its canonical atlas ID. No supplemental textbook-only item is substituted for a missing required item.
- Resolved every whole-structure selector against the actual shipped skeleton, tissue and detail model files. Checked that all supported reference targets have finite 3D coordinates and representation metadata. Existing geometry/source-anchor and accuracy-review tests remain applicable.
- Retained parent context for ambiguous source wording such as head, styloid process and body. The model shows qualified names such as **Head of radius**. A generic answer such as head does not identify which structure was learned.
- Display corrected anatomical spellings while retaining the sheet's accepted variants: **nucleus pulposus** / nucleus pulposis, **annulus fibrosus** / annulus fibrosis, **medial (vertebral) border of scapula** / vertebral boarder, **fontanelles** / fontanels, and **optic canal** / optic foramen.
- Kept the ethmoid's superior/middle conchae distinct from the independent inferior nasal concha bones. The source's sacral auricular surface is mapped to the sacrum, and the humeral and femoral epicondyles remain separate.

These checks establish source reconciliation, label identity and model/reference availability. They do not certify every coordinate independently or claim that a reference pin outlines a complete surface. The [existing per-entry accuracy review](accuracy.html) and source illustrations supply the anatomical evidence and limitations.

## Two remaining spatial limitations

**Fontanelles:** newborn fibrous gaps cannot be identified on an adult skull. The withdrawn crude newborn reconstruction is not reintroduced. The atlas provides the labeled newborn comparison and a bundled, rotatable UCSF fetal-skull scan with qualified developmental site guides. Some junctions are narrowed or closed, so individually verified open-fontanelle targets remain pending. The test asks for the source term from its definition.

**Ethmoidal air cells and sinus openings:** the adult reference locates the air-cell region, but individual drainage openings are not fully mapped. The test uses group-name source recall, not an asserted opening location. These two questions are explicitly labeled **Source recall**. Their original spatial-scoring holds remain intact.

## Integrated model access — November 2, 2026

Turn on **Landmarks** above the 3D viewer to see feature labels directly on the specimen. **Find landmarks** searches and focuses the teacher's features within this same viewer; the separate landmark bank is optional. Small label batches, specimen-side labels and an Off switch keep the view readable. Regional navigation retains associated ligament, disc, artery and joint-tissue geometry.

The [in-view coverage checklist](ATLAS-LANDMARK-COVERAGE.csv) accounts for all 177 IDs: 59 direct bone entries and 118 landmark/tissue/reference entries. The 173 spatial / 2 source / 2 movement split remains unchanged. The native fetal specimen adds developmental region/site references, with the labeled newborn comparison available in the viewer; it does not establish six open fontanelles. Individual ethmoid drainage ostia remain unverified.

## Count blanks

| Source topic | Accepted typical count | Explanation |
| --- | --- | --- |
${counts}

## Test behavior

Names and labeled pins remain hidden until the answer is checked. A cue, reveal or tutor assistance is recorded separately from independent correctness. Save & exit and reload preserve the current order and submitted answers; Continue starts at the next unanswered question. A cue used on an unanswered question stays recorded after reload. Submitted responses also enter the existing learning history. The dedicated test record and results export retain the document identity and test scope. Storage is local to the browser.

Results identify 3D, source recall, movement and count evidence separately. Retry missed / assisted makes a clearly scoped new run. Correct answers and repeated immediate attempts are practice evidence, not a guarantee of mastery. The original source reconciliation preserved model geometry; the later integrated layer adds backed-up Blender annotation projects and the separately licensed native developmental specimen.

## Complete named-item checklist

[Download CSV](BONE-LIST-CHECKLIST.csv) · [Machine-readable audit](bone-list-review.json)

| Standard label | Source wording, with parent context retained | Region | Test format |
| --- | --- | --- | --- |
${rows}
`);
console.log(JSON.stringify({sourceItems:labListSource.rows.length,...stats,unmapped:0}));
