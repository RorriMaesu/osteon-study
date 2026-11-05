import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {muscleKind,muscleGroup,muscleDepth,sourceBase} from '../src/muscle-taxonomy.js';
import {auditMuscleCoverage} from '../src/muscle-coverage.js';
import reviews from '../src/muscle-geometry-review.json' with {type:'json'};
import checklist from '../src/muscle-reference-checklist.json' with {type:'json'};
const root=fileURLToPath(new URL('../',import.meta.url)),file=path.join(root,'src/muscle-models.json'),manifest=JSON.parse(fs.readFileSync(file,'utf8')),update=process.argv.includes('--update');
for(const c of manifest.components){
 const kind=muscleKind(c.sourceName),group=muscleGroup(c),depth=muscleDepth(c);
 if(update){c.kind=kind;c.muscleName=group;c.depth=depth;if(reviews.reviews[sourceBase(c.sourceName)])c.geometryReview=reviews.reviews[sourceBase(c.sourceName)];}
 else if(c.kind!==kind||c.muscleName!==group||c.depth!==depth)throw Error('Stale classification/group: '+c.id);
}
for(const asset of Object.values(manifest.assets))if(createHash('sha256').update(fs.readFileSync(path.join(root,'assets',asset.file))).digest('hex')!==asset.sha256)throw Error('Model hash differs: '+asset.file);
if(update)fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
const audit=auditMuscleCoverage(manifest.components),csvCell=v=>'"'+String(v??'').replaceAll('"','""')+'"',writeCSV=(name,rows)=>fs.writeFileSync(path.join(root,name),'\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\n')+'\n');
writeCSV('MUSCLE-COVERAGE.csv',[
 ['ID','Display name','Original source name','Muscle group','Side','Region','Kind','Depth subset','Review status','Assessment','Source-label correction','Asset','Known geometry issue'],
 ...manifest.components.map(c=>[c.id,c.name,c.sourceName,c.muscleName,c.side,c.region,c.kind,c.depth,c.status,c.assessment,c.nameCorrection,manifest.assets[c.region].file,c.geometryReview?.note||''])
]);
writeCSV('MUSCLE-REFERENCE-AUDIT.csv',[
 ['Check ID','TA2 term ID','Reference name','Region','Status','Listed inconstant in TA2','Sex scope','Matched or candidate component IDs','Note','Attachment certified'],
 ...audit.rows.map(r=>[r.id,r.ta2,r.name,r.region,r.status,r.inconstantInTA2?'Yes':'No',r.sexScope||'not sex-specific',r.componentIds.join(' | '),r.note||r.variationNote||'', 'No'])
]);
fs.writeFileSync(path.join(root,'muscle-audit-summary.json'),JSON.stringify({schema:1,referenceChecks:audit.referenceChecks,muscleParts:audit.muscleParts,supportParts:audit.supportParts,counts:audit.counts,geometryCertified:false,sourceSHA256:manifest.sourceSHA256},null,2)+'\n');
const labels={'named-geometry':'Named geometry found','represented-by-components':'Composite represented by components','no-named-mesh':'No named source mesh','not-separately-resolved':'Not separately resolved','partial-model':'Partial model','needs-anatomical-review':'Anatomical naming/attachment review','side-review':'Side review'};
const gaps=audit.rows.filter(r=>!['named-geometry','represented-by-components'].includes(r.status));
const lines=[
 '# Muscle accuracy and completeness audit','',
 '**The current muscle atlas is incomplete. Named geometry is not a certificate of anatomical accuracy.**','',
 `The source exports ${audit.componentCount} components. Correct tissue classification gives **${audit.muscleParts} muscle parts and ${audit.supportParts} supporting components**. Parts include separate heads, sides and aggregate groups; they are not counts of distinct human muscles. The previous 485-muscle-part figure included 25 connective components and excluded both tensor fasciae latae meshes. This audit corrects those classifications. Original mesh identities and all geometry are preserved.`,'',
 '## What was checked','',
 `- A finite flat checklist of **${audit.referenceChecks} reference entries**, based on named TA2 skeletal-muscle terms, selected serial groups, common composites and one additional clinical pelvic-floor check. This is not every anatomical variant, a reproduction of TA2 hierarchy, or a universal muscle count.`,
 '- Every shipped component against the source inventory, original ID, side and asset hash.',
 '- Read-only Blender 4.5 examination of all 669 source components (462 corrected muscle parts and 207 supporting components), including connectivity, finite coordinates and world-space bounds. The original source hash is unchanged. This is structural inspection, not a visual or anatomical certification of every surface.',
 '- Independent OpenStax regional muscle names, university anatomy tables, and published anatomical studies for identified gaps.',
 '- Normal variation, sex-specific structures, source naming ambiguity, unsegmented groups and complete absence of a named model are recorded separately.','',
 '| Checklist result | Entries |','|---|---:|',...Object.entries(audit.counts).map(([k,v])=>`| ${labels[k]} | ${v} |`),'',
 '“No named source mesh” does not prove that all corresponding tissue is physically absent: it establishes that the learner cannot reliably select and identify that named structure in this atlas. Inconstant and sex-specific entries are included in this count; they must not all be called omissions from one normal specimen. All attachment certification fields remain No.','',
 '## Concrete corrections in this release','',
 '- Both tensor fasciae latae meshes are now muscles and are visible with supporting tissues switched off.',
 '- Linea alba, intermuscular septa, iliotibial tracts, tendinous arches and digital sheaths are supporting tissues, not muscles.',
 '- Named heads/parts are grouped into the corresponding whole muscle for search and selection, with individual source parts retained.',
 '- Incomplete groups and naming concerns appear beside the selected structure. The browser exposes a Known gaps report. No missing anatomy is replaced by an invented pin or generic shape.','',
 '## Incomplete or unresolved geometry','',
 '- **Palmar interossei:** one localized connected mesh per hand. The usual three digit-2/4/5 palmar interossei are not separately demonstrated. A possible pollical interosseous is tracked separately as a variant; conventions may count it as a fourth.',
 '- **Foot lumbricals:** one localized connected mesh per foot; four distinct lumbricals are not demonstrated.',
 '- **Oblique arytenoid:** only its ary-epiglottic extension is named.',
 '- **Semispinalis capitis:** no separately named mesh. The nearby source spinalis capitis needs attachment-based review before deciding between omission, fusion and mislabeling.',
 '- **Pelvic floor:** the puboanalis source must not automatically be relabeled puborectalis. The sling and attachment relationships need independent review.',
 '- **Chondroglossus, ceratoglossus, articularis cubiti and articularis genus:** not separately resolved. Neighboring larger muscles do not establish their individual identity.','',
 '## All open checklist findings','',
 '| Reference entry | Region | Finding | Variation/sex/note |','|---|---|---|---|',
 ...gaps.map(r=>`| ${r.name} | ${r.region} | ${labels[r.status]} | ${[r.inconstantInTA2?'Listed inconstant in TA2':'',r.sexScope||'',r.note||r.variationNote||''].filter(Boolean).join('; ').replaceAll('|','/')} |`),'',
 'The [complete flat checklist](MUSCLE-REFERENCE-AUDIT.csv) includes both open findings and named matches. [Source component coverage](MUSCLE-COVERAGE.csv) retains every original mesh name.','',
 '## Correction order and acceptance criteria','',
 '1. Reconstruct and individually label the missing palmar interossei and foot lumbricals from verified references. Back up every affected GLB and Blender project before each change.',
 '2. Add absent high-priority course anatomy: palmaris brevis; intrinsic tongue and styloglossus; soft-palate muscles; perineal muscles and male/female urethral-sphincter anatomy. Provide sex-specific views instead of superimposing incompatible anatomy.',
 '3. Resolve semispinalis/spinalis capitis and pelvic-floor attachment relationships. Review articularis muscles, subcostales, intertransversarii, auricular/middle-ear muscles and remaining open entries. Document variants instead of implying that all variants coexist in one specimen.',
 '4. For each muscle verify origin area, insertion area, tendon route, muscle belly, neighboring structures, side, relevant group members, selectable identity and uncluttered default view. Use independent anatomical review before marking a feature certified.',
 '5. Validate multiple views, desktop and touch selection, exports and backups. Moving muscle rigs and precision attachment scoring stay disabled until their mapping is reviewed.','',
 '## Scope still separate','',...checklist.scopeExclusions.map(s=>'- '+s),'',
 '## References','',
 '- FIPAT. *Terminologia Anatomica*, 2nd ed. (2019), individual terms: [TA2Viewer](https://ta2viewer.openanatomy.org/). [AACA description and endorsement](https://clinical-anatomy.org/Clinical_Anatomical_Terminology). The [source-model terminology CSV](https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/TA2.csv) is a convenience index and may contain transcription errors.',
 ...checklist.references.map((u,i)=>`- [OpenStax regional anatomy reference ${i+1}](${u}).`),
 '- [Texas Tech anatomy tables: hand](https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html), including palmar-interosseous counting conventions.',
 '- [Plantar intrinsic muscle ultrasound and anatomical relationships](https://pmc.ncbi.nlm.nih.gov/articles/PMC10508328/).',
 '- [Blender geometry inspection summary](muscle-geometry-inspection.json) and [read-only inspection script](scripts/blender/inspect_muscle_geometry.py).',
 '- [Levator ani anatomy evaluated by origin–insertion pairs](https://pmc.ncbi.nlm.nih.gov/articles/PMC1415268/).','',
 'Rebuild this report with `node scripts/audit-muscles.mjs`. This audit identifies source and interface limitations; it does not certify every surface or attachment as anatomically correct.',''
];
fs.writeFileSync(path.join(root,'MUSCLE-ACCURACY-AUDIT.md'),lines.join('\n'));
console.log(JSON.stringify({referenceChecks:audit.referenceChecks,muscleParts:audit.muscleParts,supportParts:audit.supportParts,counts:audit.counts,assetHashes:'match'}));
