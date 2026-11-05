# Muscle accuracy and completeness audit

**The current muscle atlas is incomplete. Named geometry is not a certificate of anatomical accuracy.**

The atlas displays 679 active components (4 superseded objects are retained for rollback). Correct tissue classification gives **472 muscle parts and 207 supporting components**. Parts include separate heads, sides and aggregate groups; they are not counts of distinct human muscles. The previous 485-muscle-part figure included 25 connective components and excluded both tensor fasciae latae meshes. This audit corrects those classifications. Original mesh identities are preserved. Four incomplete aggregate objects are retained in the rollback record and model files but are hidden from selection and rendering; 14 recovered source surfaces replace them.

## What was checked

- A finite flat checklist of **226 reference entries**, based on named TA2 skeletal-muscle terms, selected serial groups, common composites and one additional clinical pelvic-floor check. This is not every anatomical variant, a reproduction of TA2 hierarchy, or a universal muscle count.
- Every shipped component against the source inventory, original ID, side and asset hash.
- Read-only Blender 4.5 examination of all 669 source components (462 corrected muscle parts and 207 supporting components), including connectivity, finite coordinates and world-space bounds. The original source hash is unchanged. This is structural inspection, not a visual or anatomical certification of every surface.
- Independent OpenStax regional muscle names, university anatomy tables, and published anatomical studies for identified gaps.
- Normal variation, sex-specific structures, source naming ambiguity, unsegmented groups and complete absence of a named model are recorded separately.

| Checklist result | Entries |
|---|---:|
| Named geometry found | 160 |
| Group represented by named components | 8 |
| No named source mesh | 51 |
| Not separately resolved | 4 |
| Partial model | 1 |
| Anatomical naming/attachment review | 2 |

“No named source mesh” does not prove that all corresponding tissue is physically absent: it establishes that the learner cannot reliably select and identify that named structure in this atlas. Inconstant and sex-specific entries are included in this count; they must not all be called omissions from one normal specimen. All attachment certification fields remain No.

## Concrete corrections in this release

- Both tensor fasciae latae meshes are now muscles and are visible with supporting tissues switched off.
- Linea alba, intermuscular septa, iliotibial tracts, tendinous arches and digital sheaths are supporting tissues, not muscles.
- Named heads/parts are grouped into the corresponding whole muscle for search and selection, with individual source parts retained.
- Incomplete groups and naming concerns appear beside the selected structure. The browser exposes a Known gaps report. The hand/foot repairs use original source anatomy. No missing anatomy is replaced by an invented pin or generic shape.

## Recovered groups and remaining unresolved geometry

- **Palmar interossei, repaired:** three individual digit-2/4/5 surfaces per hand, recovered from the original BodyParts3D 4.3 set. Major connected members were separated and small source fragments assigned to their nearest member. The optional pollical variant remains a separate open entry.
- **Foot lumbricals, repaired:** all four named source surfaces per foot are separately selectable. Individual origins, insertions and actions are provided. Regional registration is checked against corresponding metatarsals and held-out proximal phalanges; this is not a certificate of attachment anatomy.
- **Oblique arytenoid:** only its ary-epiglottic extension is named.
- **Semispinalis capitis:** no separately named mesh. The nearby source spinalis capitis needs attachment-based review before deciding between omission, fusion and mislabeling.
- **Pelvic floor:** the puboanalis source must not automatically be relabeled puborectalis. The sling and attachment relationships need independent review.
- **Chondroglossus, ceratoglossus, articularis cubiti and articularis genus:** not separately resolved. Neighboring larger muscles do not establish their individual identity.

## All open checklist findings

| Reference entry | Region | Finding | Variation/sex/note |
|---|---|---|---|
| Transversus menti muscle | head-neck | No named source mesh | Variable anatomy requires a documented specimen choice; lack of a named model is not proof that the structure is absent in all people. |
| Auricularis anterior muscle | head-neck | No named source mesh |  |
| Auricularis superior muscle | head-neck | No named source mesh |  |
| Auricularis posterior muscle | head-neck | No named source mesh |  |
| Helicis major muscle | head-neck | No named source mesh |  |
| Helicis minor muscle | head-neck | No named source mesh |  |
| Tragicus muscle | head-neck | No named source mesh |  |
| (Muscle of terminal notch) | head-neck | No named source mesh | Listed inconstant in TA2 |
| Pyramidal muscle of auricle | head-neck | No named source mesh |  |
| Antitragicus muscle | head-neck | No named source mesh |  |
| Transverse muscle of auricle | head-neck | No named source mesh |  |
| Oblique muscle of auricle | head-neck | No named source mesh |  |
| Tensor tympani | head-neck | No named source mesh |  |
| Stapedius muscle | head-neck | No named source mesh |  |
| (Pterygoideus proprius muscle) | head-neck | No named source mesh | Listed inconstant in TA2 |
| Chondroglossus muscle | head-neck | Not separately resolved | The hyoglossus mesh is present, but this named subdivision is not separately identified. Review geometry and terminology before adding overlapping tissue. |
| Ceratoglossus muscle | head-neck | Not separately resolved | The hyoglossus mesh is present, but this named subdivision is not separately identified. Review geometry and terminology before adding overlapping tissue. |
| Styloglossus muscle | head-neck | No named source mesh |  |
| Superior longitudinal lingual muscle | head-neck | No named source mesh |  |
| Inferior longitudinal lingual muscle | head-neck | No named source mesh |  |
| Transversus linguae muscle | head-neck | No named source mesh |  |
| Verticalis linguae muscle | head-neck | No named source mesh |  |
| Levator veli palatini | head-neck | No named source mesh |  |
| Tensor veli palatini | head-neck | No named source mesh |  |
| Musculus uvulae | head-neck | No named source mesh |  |
| Palatoglossus muscle | head-neck | No named source mesh |  |
| (Scalenus minimus muscle) | head-neck | No named source mesh | Listed inconstant in TA2 |
| Salpingopharyngeus muscle | head-neck | No named source mesh |  |
| (Ceratocricoid muscle) | head-neck | No named source mesh | Listed inconstant in TA2 |
| Vocalis muscle | head-neck | No named source mesh |  |
| Oblique arytenoid muscle | head-neck | Partial model | Only the ary-epiglottic extension is named. It does not establish that the main oblique arytenoid portion is modeled. |
| (Transversus nuchae muscle) | trunk-back | No named source mesh | Listed inconstant in TA2 |
| Anterior intertransversarii colli muscles | trunk-back | No named source mesh |  |
| Lateral posterior intertransversarii colli muscles | trunk-back | No named source mesh |  |
| Semispinalis capitis muscle | trunk-back | Anatomical naming/attachment review | No separately named semispinalis capitis mesh. The source spinalis capitis mesh needs attachment-based review before deciding whether this is omission, fusion, or mislabeling. |
| Medial intertransversarii lumborum muscles | trunk-back | No named source mesh |  |
| Thoracic intertransversarii muscles | trunk-back | No named source mesh |  |
| Medial posterior intertransversarii colli muscles | trunk-back | No named source mesh |  |
| (Sternalis muscle) | trunk-back | No named source mesh | Listed inconstant in TA2 |
| Subcostal muscles | trunk-back | No named source mesh |  |
| Cremaster | trunk-back | No named source mesh | male |
| Puboperinealis muscle | pelvis-leg-foot | No named source mesh |  |
| Puboprostaticus muscle | pelvis-leg-foot | No named source mesh | male |
| Pubovaginalis muscle | pelvis-leg-foot | No named source mesh | female |
| Superficial transverse perineal muscle | pelvis-leg-foot | No named source mesh |  |
| Ischiocavernosus muscle | pelvis-leg-foot | No named source mesh |  |
| Bulbospongiosus muscle | pelvis-leg-foot | No named source mesh |  |
| Deep transverse perineal muscle | pelvis-leg-foot | No named source mesh |  |
| Male external urethral sphincter (part of muscular system) | pelvis-leg-foot | No named source mesh | male |
| Female external urethral sphincter (muscular system) | pelvis-leg-foot | No named source mesh | female |
| Compressor urethrae | pelvis-leg-foot | No named source mesh | female |
| Sphincter urethrovaginalis | pelvis-leg-foot | No named source mesh | female |
| Articularis cubiti muscle | shoulder-arm | Not separately resolved | No separately identified articularis cubiti. Review the deep triceps/capsular relationship before claiming the component is present or reconstructing it. |
| Palmaris brevis muscle | forearm-hand | No named source mesh |  |
| (Pollical palmar interosseus muscle) | forearm-hand | No named source mesh | Listed inconstant in TA2 |
| Psoas minor | pelvis-leg-foot | No named source mesh | Variable anatomy requires a documented specimen choice; lack of a named model is not proof that the structure is absent in all people. |
| Articularis genus muscle | pelvis-leg-foot | Not separately resolved | No separately identified articularis genus. A vastus intermedius mesh alone does not establish its presence. |
| Puborectalis | pelvis-leg-foot | Anatomical naming/attachment review | Pelvic-floor nomenclature varies. Do not equate puboanalis with puborectalis automatically. Verify the anorectal sling and origin-insertion relationships. |

The [complete flat checklist](MUSCLE-REFERENCE-AUDIT.csv) includes both open findings and named matches. [Source component coverage](MUSCLE-COVERAGE.csv) retains every original mesh name.

## Correction order and acceptance criteria

1. Completed the hand/foot group recovery in Blender 4.5 with hash-verified backups before every model save/export. [Reproducible repair recipe and source hashes](model-sources/muscle-repairs.json) preserve the original surfaces, transforms and segmentation. Subsequent original-only rebuilds are blocked to prevent wiping these repairs.
2. Add absent high-priority course anatomy: palmaris brevis; intrinsic tongue and styloglossus; soft-palate muscles; perineal muscles and male/female urethral-sphincter anatomy. Provide sex-specific views instead of superimposing incompatible anatomy.
3. Resolve semispinalis/spinalis capitis and pelvic-floor attachment relationships. Review articularis muscles, subcostales, intertransversarii, auricular/middle-ear muscles and remaining open entries. Document variants instead of implying that all variants coexist in one specimen.
4. For each muscle verify origin area, insertion area, tendon route, muscle belly, neighboring structures, side, relevant group members, selectable identity and uncluttered default view. Use independent anatomical review before marking a feature certified.
5. Validate multiple views, desktop and touch selection, exports and backups. Moving muscle rigs and precision attachment scoring stay disabled until their mapping is reviewed.

## Scope still separate

- Microscopic smooth-muscle layers and cardiomyocytes are taught in Chapter 10 but are not supplied by this skeletal-muscle model layer.
- Visceral smooth muscles, intrinsic ocular smooth muscles, cardiac muscular structures, anatomical variants beyond this finite checklist, precise attachment footprints and every regional fascicle require separate scope and review.
- The source terminology CSV is a convenience index, not an independent anatomical authority. The checklist is not a certified transcription of every TA2 term.

## References

- FIPAT. *Terminologia Anatomica*, 2nd ed. (2019), individual terms: [TA2Viewer](https://ta2viewer.openanatomy.org/). [AACA description and endorsement](https://clinical-anatomy.org/Clinical_Anatomical_Terminology). The [source-model terminology CSV](https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/TA2.csv) is a convenience index and may contain transcription errors.
- [OpenStax regional anatomy reference 1](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back).
- [OpenStax regional anatomy reference 2](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax).
- [OpenStax regional anatomy reference 3](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs).
- [OpenStax regional anatomy reference 4](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs).
- [Texas Tech anatomy tables: hand](https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html), including palmar-interosseous counting conventions.
- [Plantar intrinsic muscle ultrasound and anatomical relationships](https://pmc.ncbi.nlm.nih.gov/articles/PMC10508328/).
- [Original BodyParts3D source and download service](https://lifesciencedb.jp/bp3d/) · [current CC BY 4.0 license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html).
- [Blender geometry inspection summary](muscle-geometry-inspection.json) and [read-only inspection script](scripts/blender/inspect_muscle_geometry.py).
- [Levator ani anatomy evaluated by origin–insertion pairs](https://pmc.ncbi.nlm.nih.gov/articles/PMC1415268/).

Rebuild this report with `node scripts/audit-muscles.mjs`. This audit identifies source and interface limitations; it does not certify every surface or attachment as anatomically correct.
