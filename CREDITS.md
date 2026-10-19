# Credits and licensing

## Anatomy model

`assets/skeleton.glb`: Z-Anatomy, the libre 3D atlas of anatomy, by Gauthier Kervyn and contributors, CC BY-SA 4.0. Derived from BodyParts3D © The Database Center for Life Science (Kousaku Okubo and contributors), CC BY-SA 2.1 Japan. Web export and simplification by the [3d-human-body-anatomy project](https://github.com/SeemaBansal1/3d-human-body-anatomy). This copy retains the exported mesh geometry and metadata; Osteon changes display materials in the viewer. The model remains under CC BY-SA 4.0. See assets/MODEL-LICENSE.md.

- https://github.com/Z-Anatomy/Models-of-human-anatomy
- https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- https://creativecommons.org/licenses/by-sa/4.0/
- https://creativecommons.org/licenses/by-sa/2.1/jp/

The initial skeleton layer and the course-specific tissues listed below are included. The upstream project's kidney, brain and inner-ear soft-tissue assets are not included. Auditory ossicles in this skeleton are bone meshes from its skeleton layer.

## Additional anatomical objects and landmarks

`assets/course-tissues.glb` contains 81 selected Z-Anatomy objects, exported from the original `Z-Anatomy.zip` / `Startup.blend` using Blender 4.5.1. Original named geometry and world transforms are retained; curves are converted to mesh geometry, unrelated objects omitted and web materials applied. Objects are listed in `assets/course-tissues-manifest.json`. This derived model remains CC BY-SA 4.0 with the Z-Anatomy / BodyParts3D attribution above.

`src/landmarks.json` contains 47 course landmark mappings derived from Z-Anatomy anatomical annotation leader endpoints. Coordinates are transformed from Blender to the web coordinate frame. Vertex index and distance to the nearest exported skeletal vertex are retained for provenance. These data remain CC BY-SA 4.0. Labels are rendered as reference pins with connector lines, rather than claiming full surface segmentation. Unreliable annotation leaders are not reused. Independently curated mesh references and explicit 3D teaching reconstructions now provide their primary spatial views; source figures remain optional comparisons.

Original download: https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Z-Anatomy.zip . The original atlas definitions and automatic translations are not reused.

## Learning content

Study explanations, retrieval prompts and questions are newly written adaptations informed by OpenStax, Anatomy and Physiology 2e, J. Gordon Betts and contributing authors, © 2026 Rice University. The supplied edition is licensed CC BY-NC-SA 4.0. Osteon's adapted learning content is shared under CC BY-NC-SA 4.0. Access for free at openstax.org.

- https://openstax.org/details/books/anatomy-and-physiology-2e
- https://creativecommons.org/licenses/by-nc-sa/4.0/

`assets/reader/` reproduces chapter 6 and 7 page images from the supplied edition, plus lab-relevant readings from chapters 8 and 9, plus selected chapter 11 attachment references and chapter 14 inner-ear passages. `src/reader-pages.json` contains corresponding extracted text. `assets/figures/` reproduces source illustrations; the app crops, masks labels and overlays numbered targets for practice. Figure/page provenance appears in `assets/figures/manifest.json` and every displayed figure's attribution. Page images are unaltered renderings except resizing/compression. These reproduced and adapted materials remain CC BY-NC-SA 4.0; the commercial permissions of the code license do not apply to them. Access for free at openstax.org.

The supplied BI 231 Fall 2024 lab structure list defines the course checklist. Its original document, authorship metadata and local file paths are not redistributed. This independent study tool is not an official OpenStax or college product.

## Software

Original Osteon application code: MIT License, © 2026 RorriMaesu. This code license does not replace the separate model and learning-content licenses above.

three.js © three.js authors, MIT License. See vendor/THREE-LICENSE.txt. Draco compression decoder © Google, Apache License 2.0, https://github.com/google/draco/blob/main/LICENSE . Decoder files are distributed through three.js. The optional fetal-skull source comparison uses the official Sketchfab embedded viewer.

MIT License: Permission is hereby granted, free of charge, to any person obtaining a copy of the original application software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to inclusion of this notice. THE SOFTWARE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY ARISING FROM THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


## Expanded landmark data and source views

`src/landmark-catalog.json` contains curated canonical names, aliases, parent relationships, original explanations and source citations. Textbook-derived content is CC BY-NC-SA 4.0. `src/feature-plates.json` and the `lm*` figure crops include overlay points, assessment crops and label masks; these remain CC BY-NC-SA 4.0. Additional source pages and figure images are attributed to OpenStax, ©2026 Rice University. Access for free at openstax.org.

The source-pin portions of `src/landmark-representations.json` are derived from 52 Z-Anatomy annotation endpoints and retain CC BY-SA 4.0. They record original source object, parent, right side, coordinate transform and surface-consistency evidence. Other representations in that file are textbook-derived mappings under CC BY-NC-SA 4.0. The code license does not override either content license.

Terminology validation for the cuboid tendon groove and the source's historical auricular-fissure wording references FIPAT Terminologia Anatomica 2, https://fipat.library.dal.ca/TA2/ . Inferior orbital fissure contributors were checked against the primary anatomy study cited in the canonical entry. No third-party figure or body text from those terminology references is reproduced.

## Additional 3D landmark specimens

`assets/landmark-details.glb` contains original evaluated Z-Anatomy bony-labyrinth and ligament geometry, higher-resolution source replacement bones, and authored teaching geometry. All remain CC BY-SA 4.0 with Z-Anatomy / BodyParts3D attribution where derived. The editable Blender 4.5 project and verified pre-edit snapshots were delivered separately to the project owner.

`src/three-d-landmarks.json` distinguishes manually curated surface/rim/space references from original source annotations. Actual source nerve/vessel crossings constrain selected reconstructed passages. Reconstruction wall thickness, aperture caliber, developmental proportions and microscopic scale are explanatory, not clinical measurements. The original source geometry is retained; separately named teaching variants show morphology missing from that specimen. In particular, no cochlea/vestibule part seam or apical opening is represented as the round window. The basal-chamber teaching reconstruction was withdrawn during the accuracy review; a native round-window target is not claimed.

See `LANDMARK-3D-AUDIT.csv`, `landmark-3d-summary.json` and `assets/landmark-model-inventory.json` for per-feature provenance, fidelity notes and model groups. Figure/text adaptations retain the separate OpenStax CC BY-NC-SA 4.0 license.

## Fetal-skull source comparison

The optional embedded **Fetal Skull** scan is by SBCVL_UCSF / Roberto Rodriguez Rubio, MD, UCSF Anatomy Learning Center, licensed CC BY-NC 4.0: https://sketchfab.com/3d-models/fetal-skull-7646e0227f07475eb8275d084993194c . It is displayed through the official viewer; no native file is redistributed in this release. See https://ohns.ucsf.edu/sinus/virtual-reality-anatomic-lab-1 and https://creativecommons.org/licenses/by-nc/4.0/ . Individual 3D fontanelle targets are pending verification.

The prior crude newborn calvarial and straightened round-window models are retained only in local backups, not offered as accepted atlas targets. `assets/accuracy-review/` contains educational inspection images derived from the same licensed anatomy sources; model images retain CC BY-SA 4.0. Source-derived text and illustrations retain their separate OpenStax license.

## Direct bone refinements

Frontal, right temporal, right maxillary and right lacrimal geometry now contains explicit Blender 4.5 reconstructed openings. These derived models retain CC BY-SA 4.0. The supraorbital opening teaches an enclosed variant rather than the source notch; its placement also references the primary anatomical study at https://pmc.ncbi.nlm.nih.gov/articles/PMC5890013/ . No image or text from that study is reproduced. Stylomastoid and nasolacrimal refinements follow source nerve/duct relationships and OpenStax 7.2. The editable project and pre-edit backups remain with the owner. `src/blender-refinement-evidence.json` records the construction limits and geometry checks.
