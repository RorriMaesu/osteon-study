# Release verification — complete course suite

## Automated checks

Thirteen automated checks pass. They cover real mesh mappings; course and supplement ID uniqueness; rib-category overlap; numbered/regional bone distinctions; twelve sections and all 104 question answer/distractor sets; 237 glossary entries; precise synonyms; assisted/self-rated score separation; review intervals and import validation; all 177 graded representations; anatomical leader endpoint provenance and parent-model bounds; figure/crop/target integrity; all 124 reading assets; and section destinations. COVERAGE.csv and coverage-summary.json are regenerated from the final source data.

The course audit has 177 concepts: 82 named mesh/group exercises, 47 source landmark pin mappings, 46 textbook diagram exercises and two knee movement concepts. No course concept lacks a graded representation. The 352 scene objects include the initial 271 objects and 81 course tissues. These are scene-object and concept counts, not biological bone counts.

## Source and geometry review

Blender 4.5.1 was used to inspect the original Z-Anatomy source and export required tissues. Annotation leaders have label ends and anatomical ends. The retained mappings use anatomical endpoints (vertex 1), transformed into the web model frame. Endpoint-to-skeleton proximity and relevant parent bounds were checked. Unreliable axial leaders were rejected and replaced with targets on source textbook figures. This is a consistency check rather than independent anatomical validation.

Textbook target coordinates were reviewed against original illustrations. SVG views clip to the anatomical crop, mask residual labels and mark reference locations. The adult mandibular symphysis is explicitly a fusion site; the vertebral-canal target marks a representative vertebral foramen; the pelvic-brim pin marks one component of its boundary; ethmoidal targets show air cells, with drainage relationships taught separately. Fontanelles use a newborn skull figure. Drawer tests assess tibial movement and ACL/PCL restraint.

The integrated reader includes every PDF page 213–298 from the supplied edition (chapters 6 and 7), plus appendicular pages 299–324 and selected joint pages 358–369. The final chapter page 298 contains only the source page footer and is preserved rather than silently omitted. Original page images retain source appearance; extracted text is searchable and readable, with complex figure layout preserved in the image view.

## Browser evidence

The built static app was exercised in the browser:

- Verified an actual frontal-sinus mesh answer after peeling the covering frontal bone and turning Peel off. Sinus-volume meshes are included in answer raycasting.
- Loaded all 352 anatomical objects and inspected the adult skeleton and added tissue selections.
- Selected a source landmark, completed a correct 3D pin answer and verified 1/1 unassisted results.
- Completed a newborn fontanelle target by keyboard, with source labels hidden.
- Completed a ten-item spine session spanning diagrams and meshes; ten reveals produced ten assisted attempts and zero independent credit.
- Rejected an incorrect typed bone; accepted the correct singular synonym; rejected a parent bone as the answer to its landmark; verified disabled/locked submissions.
- Completed the anterior-drawer movement/ACL pairing and a patellar-ligament diagram exercise.
- Searched full chapter text, opened a matching source page and switched to accessible extracted text.
- Checked return navigation restores the specimen to the atlas and restores the selected structure’s details.
- Checked a 390 × 844 CSS-pixel phone viewport: no horizontal overflow, seven viewer controls at least 44 pixels wide and 47 pixels high, and numbered target choices 44 pixels high. Temporary viewport override was reset after testing.
- Earlier release checks also covered actual canvas mesh clicks, peeling/restoration, concept quiz feedback, glossary cards, review scheduling, backup validation and progress persistence after reload.

No console errors were reported in the tested mixed course flow. Reduced-motion source disables transitions/camera easing and shows a static knee movement endpoint. Separate device-level reduced-motion emulation was not available.

## Practical limits

Pins locate reference points; they are not complete surface segmentations. Diagram target selection tests localization within the provided view, and a changed viewpoint remains useful for transfer. Bone-group categories can overlap. The reference specimen does not depict every normal variation. Neither every individual landmark nor the question bank has undergone independent instructor/anatomist review. The course checklist and assigned chapter source content are covered; a finite bank cannot guarantee every possible examination question.

Progress is stored locally. Reading status and self-rated cards are separate from independently scored accuracy. One correct response or a repeated immediate answer is not a claim of durable mastery.

GitHub Pages verification is performed after publication against the new commit and its asset versions.
