# Practical target review — November 4, 2026

[Open the 16-target review](https://rorrimaesu.github.io/osteon-study/?clarity=1#practice).

This pass addresses the sixteen targets reported in the practical screenshots. Each was inspected in the source geometry and in the browser. Geometry edits used Blender **4.5.1 LTS**. Software checks and visual inspection do not constitute an independent anatomist or instructor review.

## Target-by-target changes

| Target | Change and interpretation |
| --- | --- |
| Jugular foramen | Reconstructed the bony exit along the original terminal sigmoid-sinus route in the temporal/occipital geometry. An inferior view exposes its lumen. The 3.2 mm cutter radius is an explanatory modeling choice, not a patient measurement. |
| Lambdoid suture | Moved the endpoint from below the junction to the native occipital/parietal boundary. A short trace follows that junction; adjacent parietals remain visible. |
| Vertebral canal | Shows five lumbar levels in a median cutaway with a continuous corridor trace, rather than a single point that resembles an intervertebral opening. The line marks a space, not the spinal cord. |
| Infraspinous fossa | A representative surface patch occupies the posterior basin below the scapular spine. The right scapula is shown alone. The patch is not a complete segmentation of the fossa. |
| Lesser tubercle | Restored source resolution, added a small source-aligned surface patch, and changed the anterior oblique close-up to distinguish the projection from nearby head/neck surfaces. |
| Costal facets | Enhanced the three local articulation surfaces on T6. Superior, inferior and transverse costal facets have separate patches and numbered endpoints; all three are present before the grouped answer. Other thoracic levels are not implied to have identical facet arrangements. |
| Radial nerve sulcus | A shallow posterior cortical groove follows the original radial-nerve course. A trace shows its oblique length. The depth is enhanced for teaching. |
| Anterior border of tibia | Slightly enhanced the native anterior ridge and added a smoothed length trace along the triangular shaft. A border is represented as a length rather than an isolated bump. |
| Shaft of humerus | Shows the whole bone with a long shaft trace and representative diaphyseal surface patch, so the answer is not inferred from an arbitrary dot. |
| Acromioclavicular facet | A small facet patch and locally flattened articular contour distinguish the medial acromial surface from the entire acromion. The clavicle supplies faint context. |
| Ischial tuberosity | Restored the native surface, modestly enhanced its relief and added a representative patch on the posteroinferior prominence. |
| Mandibular foramina | Retained the real native medial-ramus aperture. Restored source resolution and used a closer medial/posterior view to expose the entrance beside the lingula. No second hole was drilled. One side represents the paired term. |
| Superior and middle nasal conchae | A separate, explicitly reconstructed ethmoid-wall cutaway exposes two thin curled lamellae. The superior shelf is smaller and higher; the middle shelf is larger and lower. Combined and individual textbook entries use this same teaching specimen. These are parts of the ethmoid; the separate inferior concha is not shown. The lamella shapes are qualitative, not scan-derived. |
| Tibial tuberosity | Slightly enhanced the source-aligned anterior proximal prominence and marked its surface in a closer view. |
| Anterior drawer | Replaced the block schematic with cropped native femur/tibia/fibula meshes, posed at 90° knee flexion. The femur is fixed; tibia/fibula translate anteriorly. ACL restraint is disclosed after answering. |
| Posterior drawer | Uses the same neutral pose with the opposite AP translation and PCL restraint. Playback moves once and holds; it does not reverse continuously and confuse the tested direction. |

## Presentation and assessment

Bone lighting retains contour shading with a soft camera fill for inferior/medial views. Amber patches and traces identify representative surfaces or lengths; hollow endpoints identify points. These guides appear only for their selected feature. Names remain outside the specimen during identification, including after answering; grouped features receive a numbered name key in the feedback panel. “Show target clearly” restores the authored camera without counting as a study clue. Existing clue/reveal assistance rules, answer grading, scores and saved exam/list drafts are preserved.

The drawer exercise has replay, pause, neutral and displacement controls, a faint neutral reference, and visible anterior/posterior arrows. Scrubbing resumes from the inspected position. Camera framing reserves space for controls on laptop and phone layouts. The movement amplitude is exaggerated for visibility and is not a clinical measurement. No invented ligament geometry is presented as a real scan.

## Model preservation and evidence

Before every working save/export and installation, model files were copied to a new snapshot under the local `outputs/model-backups` directory and compared by SHA-256. The initial comprehensive snapshot is `024-20261104-091248`; the latest installation snapshots are recorded in [exam-clarity-evidence.json](src/exam-clarity-evidence.json). The original Z-Anatomy `Startup.blend`, adult `skeleton.glb` and `course-tissues.glb` are unchanged. Revised detail meshes reside in `assets/landmark-details.glb`; editable Blender projects remain in the local `outputs/osteon-models` directory. The assembled annotation project and annotation-only GLB were regenerated after the geometry changes, with their own verified snapshots.

The evidence records local changes, source routes, guide paths, topology counts and limits. Regression tests check the jugular lumen through both bones, preservation of earlier openings/carotid passage, guide ownership, separate concha labeling, source resolution, drawer roles/direction, monotonic playback and scrub continuity. Four duplicate native mandibular faces omitted by glTF export are recorded explicitly; identical exported faces are retained. All other revised bone triangles match the working geometry. Existing native mesh defects are not described as repaired.

Browser review used an isolated local origin to avoid changing the user's public results. All sixteen question views and their feedback were exercised at 1280 × 720. Phone checks at 390 × 844 included the expanded movement viewer, controls, direction arrows and return to the question. These are browser viewport checks, not a physical-phone hardware or screen-reader certification.

The withdrawn fontanelle/round-window models and the grouped ethmoid-drainage spatial hold remain held. The earlier full-atlas audit contains historical before-correction images. The focused changes here supersede its older target positions for these entries; wider independent anatomical and item review remains open.

## Sources

- [OpenStax 7.2: skull](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull) — skull junctions, openings and ethmoid conchae.
- [OpenStax 7.3: vertebral column](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-3-the-vertebral-column) — canal continuity and costal facets.
- [OpenStax 8.2: upper limb](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb) — scapular and humeral landmarks.
- [OpenStax 8.3: pelvis](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-3-the-pelvic-girdle-and-pelvis) and [8.4: lower limb](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb) — ischial and tibial landmarks.
- [Anterior drawer test, StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK499848/) and [Posterior cruciate ligament injury, StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK535416/) — flexed-knee tibial translation and restraint.
- Native source geometry and nerve/venous courses: Z-Anatomy / BodyParts3D; attribution and licenses in [MODEL-LICENSE.md](assets/MODEL-LICENSE.md).
