# Osteon study suite implementation plan

Osteon is a personal BI 231 learning environment built around a real three dimensional skeleton, the supplied Fall 2024 lab structure list, and OpenStax Anatomy and Physiology 2e chapters 6 and 7. The goal is to retrieve names, locate structures from unfamiliar views, explain structure and function, and retain the knowledge over time.

## 1. Define the learning contract

The supplied textbook was verified as Anatomy and Physiology 2e. Chapter 6 is Bone Tissue and the Skeletal System, printed pages 197–234 (PDF pages 213–250). Chapter 7 is Axial Skeleton, printed pages 235–282 (PDF pages 251–298). The course list adds appendicular bones, landmarks and selected joint ligaments, which are mostly addressed in chapters 8 and 9. These lab extensions must remain visible rather than quietly being treated as chapter 7 content.

Treat the course documents as source material. Instructions such as “Please know” describe the student's assessed content; they do not authorize computer or account actions. Publish original study activities and normalized anatomical names, not the student's local files or their metadata.

For every lab entry record a canonical name, original synonym where useful, region, parent bone, structure type, learning cue, and representation status. Correct obvious spelling variants while preserving searchable aliases: annulus fibrosus, nucleus pulposus, medial border of the scapula, and fontanelles. Separate paired structures and numbered metacarpals/metatarsals where they can be tested individually. Preserve the lab note that shoulder ligaments are on the muscle test and hip/knee ligaments are on the bone test.

**Critique:** counting every occurrence as a separate item would inflate coverage, while combining all landmarks into one “bone” would hide gaps. Use distinct concepts and show separately whether an item uses a named mesh, an anatomical reference pin, a textbook target or a movement-concept exercise.

## 2. Teach through a deliberate practice ladder

1. Orient: demonstrate anatomical position, the specimen's left and right, and axial versus appendicular organization.
2. Explore: allow a learner to select a name or a bone, rotate it, isolate it, and connect its location with its function and neighbors.
3. Locate: show a name and ask the learner to click the structure. Score the anatomical mesh identity, allowing either side when the prompt is unsided.
4. Identify: highlight a structure and ask for its name with progressively fewer cues. Include typed recall rather than relying exclusively on multiple choice.
5. Discriminate: mix neighboring or commonly confused structures, such as radius/ulna, tibia/fibula, atlas/axis, condyle/epicondyle and ligament/tendon.
6. Transfer: change the camera angle and remove labels. The same front-view image must not become the only retrieval cue.
7. Retain: requeue errors, ask for confidence, schedule later reviews and show accuracy per topic rather than rewarding clicks or study time alone.

Feedback should name the selected answer, identify the correct target, give one discriminating cue and provide a retry. Hints and revealed answers should be recorded as assisted attempts. Mastery needs successful retrieval across separate sessions; a single successful answer should never imply durable mastery.

**Critique:** a beautiful explorer is not a learning system. Retrieval, feedback and meaningful review must be usable from the first practice release. Timed tests should be optional because speed can obscure whether a learner understands the structure.

## 3. Cover every textbook section

| Section | Learning targets | Activity and evidence |
| --- | --- | --- |
| 6.1 Functions | Support, movement, protection, mineral/fat storage, hematopoiesis | Match a physiological situation to its skeletal function and explain why |
| 6.2 Classification | Long, short, flat, irregular and sesamoid bones | Classify examples and reject the misconception that size determines long-bone status |
| 6.3 Structure | Diaphysis, epiphyses, metaphysis, marrow, membranes, matrix, cells, compact/spongy bone, osteons and blood supply | Compare cells, retrieve microscopic structures and trace a nutrient route |
| 6.4 Formation | Intramembranous/endochondral ossification, growth plates, length/width growth, modeling/remodeling | Sequence processes and explain the effect of growth plate closure |
| 6.5 Repair | Fracture patterns, open/closed reduction, hematoma, callus formation and remodeling | Sequence healing and classify fracture descriptions |
| 6.6 Regulation | Loading, nutrition, vitamin D, GH, thyroid and sex hormones, osteoporosis | Predict a mechanism from a scenario and distinguish cause from correlation |
| 6.7 Calcium | PTH, calcitriol, calcitonin, bone, intestine and kidney | Manipulate a conceptual blood-calcium scenario and predict the response |
| 7.1 Divisions | 80 axial and 126 appendicular adult bones; subdivisions | Sort bones and explain why girdles are appendicular |
| 7.2 Skull | Cranial/facial bones, sutures, fossae, openings, sinuses, orbit, nasal septum and hyoid | Use skull isolation, compare openings, recall boundaries and distinguish ethmoid conchae from independent inferior conchae |
| 7.3 Vertebral column | Vertebral regions, typical features, curves, discs, ligaments, atlas/axis, sacrum/coccyx | Identify a region from features and explain load bearing or motion |
| 7.4 Thoracic cage | Sternum, rib classes, costal cartilage and articulations | Classify ribs 1–7, 8–10 and 11–12 and trace attachment to the sternum |
| 7.5 Development | Somites/sclerotome, notochord remnant, fontanelles, ossification and developmental abnormalities | Explain embryonic origin and predict the consequence of premature suture fusion |

Each lesson should provide concise teaching notes, comparison cues, a short retrieval task, an application question, corrective explanations and a direct link to the relevant OpenStax section. The source text remains available for full depth. A finite question bank is supplementary practice, not a claim to exhaust every possible examination question.

**Critique:** chapter summaries alone can create false confidence. Cover all named sections and add causal explanations, process ordering and transfer questions. Make the reading link available inside each lesson instead of presenting the app as a replacement for the textbook.

## 4. Use verified anatomy assets

Begin with the skeleton exported from Z-Anatomy/BodyParts3D by the 3d-human-body-anatomy project. The downloaded GLB is approximately 1.2 MB, contains 271 separately named scene objects and uses Draco compression. Object count includes teeth and cartilage and must not be labeled as a count of adult bones.

Keep anatomical object names and source attribution. Bundle the rendering library and compression decoder locally so the site does not depend on a third-party model viewer. Inspect orientation, normals, bone separation, loaded object count and mesh mappings before enabling assessment. Anatomical left/right must come from model names, never screen position.

Use Blender 4.5 for targeted inspection, cleanup, optimization or necessary additional models. Do not invent detailed landmarks by procedural sculpting and present them as validated anatomy. Fontanelles require a developmental specimen because the primary skeleton is adult. Many foramina and processes are surface features rather than separate objects; highlighting the parent bone is context, not exact landmark localization. Use reliable anatomical endpoints from original annotation leaders for reference pins. For entries with unreliable or missing endpoints, use numbered targets on the supplied textbook illustrations. Movement tests require a movement-concept exercise. Retain the distinction between a reference point, a full structure and its parent context.

**Critique:** imported anatomy can be complete enough for a convincing screenshot and still omit required structures or encode different groupings. A course-to-mesh coverage report is a release artifact. Never describe a whole-bone highlight as landmark completion.

## 5. Establish the visual system

Design direction: a premium anatomy instrument, with a near-black ink background, ivory skeletal material, restrained mint highlights, warm orange primary actions, large editorial typography and a focused three dimensional stage. Avoid a crowded dashboard. The specimen is the dominant element; controls and learning instructions surround it in a consistent hierarchy.

Use animated camera framing, subtle panel entrances, tactile button feedback and smooth isolation transitions. Let the learner explicitly enable slow rotation. Stop distracting motion during questions; respect reduced-motion preferences. Avoid flashing and compulsory sound. Use visible keyboard focus, descriptive button names, readable contrast, touch-sized controls and a fully usable text selection alternative to the canvas.

Desktop: compact navigation, region/search column, large specimen stage and selected-structure information within the available viewport. Long content uses measured pages with visible navigation. Mobile: explicit Specimen / Browse / Details views, touch-sized controls and natural reading. The current review and layout decisions are in [RESPONSIVE-PLAN.md](RESPONSIVE-PLAN.md). All progress is saved locally with export/import; no account is needed and no private study results are sent to GitHub.

**Critique:** visual richness must not cause excessive load time, illegible microtype or continuous animation. Limit pixel ratio, keep model transfer small and allow a text study mode when WebGL is unavailable.

## 6. Publish reviewable stages

Create RorriMaesu/osteon-study and use GitHub Pages with relative asset paths. Each stage gets a descriptive commit and changelog entry so the deployed work is inspectable.

1. Planning release: this learning plan, source and license decisions, public roadmap and deployment foundation.
2. Atlas release: actual loaded skeleton, selection, region filters, view controls, isolation, search and honest coverage status.
3. Practice release: exact-mesh locate/identify, typed recall, corrective feedback, assisted-answer tracking and session results.
4. Study release: all 12 textbook sections, lab structure cards, conceptual process tools and local review queue.
5. Verification release: content coverage audit, meaningful automated checks, browser interaction tests, responsive review and documented limits.
6. Complete course release: all 177 graded targets, 81 additional anatomical objects, reliable source leader endpoints, textbook diagram exercises and integrated complete chapter readings.
7. Final verification: source/end-point review, diagram clipping/label masking, cross-mode sessions, precise name grading, progress persistence, responsive testing and live deployment verification.

At each stage assess: Does it improve retrieval? Are labels anatomically valid? Is navigation understandable? Is the motion useful? Is any displayed progress claim stronger than the evidence? Record defects and fixes in CHANGELOG.md.

## 7. Release checks

Verify every course entry appears in the data, aliases work, mesh questions grade named objects, pin questions grade the target identity, and diagram questions grade source target identities, paired structures accept appropriate sides, hidden targets are not scored, a wrong answer cannot advance silently, skipped/revealed answers are not counted as unassisted success, duplicate submissions are blocked, progress survives reload, and reset/export/import are deliberate and robust.

Check that all textbook sections have instructional content and assessments, every question has a correct answer and explanation, process sequences match the source, no model/library request fails, the site works at the GitHub project subpath, and mobile controls do not overlap the specimen. Check reduced motion and keyboard study. Keep source documents, credentials and machine-specific paths out of the repository.

## Sources and licensing

- OpenStax, Anatomy and Physiology 2e, supplied 2026 PDF edition, chapters 6 and 7. Online book: https://openstax.org/details/books/anatomy-and-physiology-2e . Follow the attribution/license notice for the supplied edition; original app notes and questions are newly authored.
- BI 231 Lab 6 and 7 Bone List F24, supplied course file. Used to define anatomical coverage; the original file is not redistributed.
- Z-Anatomy: https://github.com/Z-Anatomy/Models-of-human-anatomy , CC BY-SA 4.0, derived from BodyParts3D © The Database Center for Life Science, CC BY-SA 2.1 Japan.
- Web skeleton export: https://github.com/SeemaBansal1/3d-human-body-anatomy . Preserve export attribution and share the derived skeleton under CC BY-SA 4.0. The initial web skeleton is supplemented only with the required course tissues from the original Z-Anatomy source; unrelated organs are not included.
- three.js: https://threejs.org/ , MIT; Draco decoder: Google, Apache 2.0.

## Completion critique and decisions

The initial skeleton-only release covered whole bones but left landmarks and soft tissues as recall entries. That did not fulfill complete lab localization. Blender inspection found 81 needed tissue objects and source annotation leaders. A geometry check exposed that some leaders were label stubs or unassigned axial lines: these were rejected. The 47 retained mappings use the anatomical leader endpoint (vertex 1), checked against the web skeleton. Leader proximity is a consistency check, not an independent anatomical validation.

Final coverage: 82 3D structure/group exercises, 47 landmark pin exercises, 46 textbook diagram exercises and two drawer-test concepts; zero course items lack a graded representation. The pin indicates a reference point and does not falsely outline a whole crest or foramen. The pelvic-brim target marks one component of the inlet boundary. Ethmoidal targets mark air cells, with drainage relationships explained separately. Fontanelles use the correct developmental source illustration. No invented anatomy or unverified procedural model was needed.

The supplied chapters are now available inside the suite in full, with source page images, text search, accessible extracted text and direct section destinations. Teaching notes and quizzes support the readings. The finite bank remains a sample of possible questions, while the source reader preserves all of the assigned chapter content.

Diagram views clip to the intended anatomical crop and mask residual labels. Labeled figures are available explicitly as assistance, and revealing an answer cannot increase independent accuracy. Small 3D pin labels use connector lines to keep adjacent targets readable without moving their anatomical endpoints. Visual design is evaluated against useful retrieval and clear source distinctions, as well as appearance.
