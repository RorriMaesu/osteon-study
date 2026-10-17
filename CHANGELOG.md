# Release notes

## Stage 9 — Local tutor and verification

- Added a browser-to-loopback Ollama tutor, installed-model metadata checks, cancellable streaming chat and source readings from local textbook retrieval.
- Added official installer links with OS override, app handoff, guided origin configuration and optional setup/hardware-report downloads.
- Added limited browser hardware reporting, manual/report memory inputs, model-fit suggestions, measured speed tests and explicit optional model downloads.
- Integrated selection, lesson, reading and assessment context. Tutor use marks unanswered attempts assisted before generation; AI does not award mastery.
- Added bounded history, separate chat clearing, phone layout, failure/retry states, narrow checks for observed misconceptions and direct-explanation handling.

## Stage 8 — Skull colors and divisions

- Colored 22 cranial/facial bones in 14 bilateral families with a grouped clickable legend. Associated ear ossicles remain distinct; teeth and sinus volumes are not counted as skull bones.
- Added strict All / Axial / Appendicular intersections for meshes, search and anatomy practice. Sacrum/coccyx are axial; hip bones and pubic symphysis context appendicular; mixed pelvis targets stay in All.
- Preserve family hues during selection and switch colors off for scored practice.


## Stage 7 — Final live verification

- Made the source sinus-volume meshes available to raycasting and location practice. Both available sinus groups are shown for these questions; covering bones can be peeled away before answering.
- Verified the distinction between source mesh geometry, landmark reference points and textbook targets through complete browser sessions.


## Stage 6 — Complete course practice and integrated textbook

- Added graded exercises for every course item: 82 3D structure/group targets, 47 reference pin mappings, 46 source diagram targets and two movement concepts.
- Exported 81 course tissues from the original Z-Anatomy model using Blender 4.5, including ligaments, discs, nuclei pulposi and vertebral arteries.
- Rejected unreliable annotation leaders; retained anatomical endpoints with provenance and model-alignment checks. Added connector lines to separate crowded numbered pins.
- Added whole-source reading for chapters 6 and 7, plus lab readings: 124 page images, searchable extracted text, accessible reading mode and direct section navigation.
- Added unpracticed-first, random and due-item sessions, typed identification, missed-item retries and one-target practice from the atlas.
- Corrected landmark name checking so a parent-bone name is never accepted as the landmark.
- Cropped and clipped source figures; masked residual answer labels. Labeled source figures mark attempts as assisted.
- Expanded the authored question bank to 104, adding transfer questions on gross/microscopic bone structure, ossification, fracture distinctions, calcium regulation, skull passages and development.
- Extended the coverage audit and automated checks to source targets, endpoint provenance, every reading page and section destination.


## Stage 5 — Browser review and coverage audit

- Verified complete 3D and chapter sessions, independent versus assisted results, glossary recall and progress persistence.
- Added surface peeling and restoration so covered structures can be reached without relying on preselected labels.
- Increased all six mobile viewer controls to at least 44 pixels high; confirmed no horizontal overflow at 390 pixels wide.
- Published a concept-by-concept coverage CSV and summary: 64 exact groups, 96 parent-context entries and 17 recall-only entries.
- Added decoder licensing, reproducible dependency lock and maintenance instructions.
- Corrected early-load navigation edge cases and stricter progress import validation.
- Documented the boundary between a usable bone-study release and future precision landmark geometry.

## Stage 2 — Interactive anatomical atlas

- Added the real 271-object Z-Anatomy skeleton with locally bundled three.js and Draco decoder.
- Built a responsive specimen workspace, search, region filters, mesh selection, animated camera framing, isolation, X-ray context and explicit rotation control.
- Transcribed 177 course concepts, including numbered metacarpals/metatarsals, and 16 supplementary atlas entries.
- Separated exact selectable structures from parent-bone context and recall-only entries.
- Reviewed the rendered skeleton in the browser and corrected an ethmoidal-air-cell entry that would otherwise have incorrectly counted a whole-bone match as an exact target.
- Preserved the supplied 2026 textbook edition's CC BY-NC-SA 4.0 attribution.

## Stage 1 — Planning and deployment foundation

- Verified the supplied textbook edition and chapter boundaries.
- Distinguished chapter content from the additional lab 7 appendicular and joint structures.
- Established a retrieval practice ladder, full section map, design system and staged verification plan.
- Selected a separately named anatomical skeleton with published reuse terms.
- Identified exact landmark mapping as a separate quality requirement from whole-bone selection.
## Stage 3 — Retrieval practice and local progress

- Added 3D locate and typed identification sessions with side-aware mesh names, frozen answer states and corrective explanations.
- Added all 177 course recall cards, self-rating, scheduled review and a due queue.
- Separated independent correctness, assisted attempts, card ratings and lessons read.
- Added progress export/import and deliberate local reset.
- Browser-tested mode navigation and incorrect identification feedback; corrected session-result navigation so it retains the results screen.
## Stage 4 — Complete chapter study studio

- Added all twelve sections from chapters 6 and 7, with objectives, teaching notes, comparisons, retrieval prompts and application explanations.
- Added 56 authored concept questions and definition practice generated from the 237 textbook key terms.
- Added guided bone classification, osteon schematic, endochondral and fracture sequencing, calcium feedback, vertebral comparison and rib attachment activities.
- Added direct links to the full textbook sections and figures; these teaching notes supplement the complete source.
- Included the full chapter glossary with its original content license and attribution.
- Added content and behavior checks for course-to-model mapping, chapter coverage, questions, answer aliases, progress accounting and backup validation.
- Final live review also corrected compressed-transfer percentages and reserved clear specimen space above the camera controls.

- Versioned application and stylesheet URLs by content hash after a live browser retained a cached prior-stage stylesheet.
