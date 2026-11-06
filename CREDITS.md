# Credits and licensing

## Anatomy model

`assets/skeleton.glb`: Z-Anatomy, the libre 3D atlas of anatomy, by Gauthier Kervyn and contributors, CC BY-SA 4.0. Derived from BodyParts3D © The Database Center for Life Science (Kousaku Okubo and contributors), CC BY-SA 2.1 Japan. Web export and simplification by the [3d-human-body-anatomy project](https://github.com/SeemaBansal1/3d-human-body-anatomy). This copy retains the exported mesh geometry and metadata; Osteon changes display materials in the viewer. The model remains under CC BY-SA 4.0. See assets/MODEL-LICENSE.md.

- https://github.com/Z-Anatomy/Models-of-human-anatomy
- https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- https://creativecommons.org/licenses/by-sa/4.0/
- https://creativecommons.org/licenses/by-sa/2.1/jp/

The initial skeleton layer and the course-specific tissues listed below are included. The upstream project's kidney, brain and inner-ear soft-tissue assets are not included. Auditory ossicles in this skeleton are bone meshes from its skeleton layer.

`assets/muscle-review/regions.jpg` is a Blender-rendered review of the delivered source geometry. It retains the Z-Anatomy / BodyParts3D CC BY-SA 4.0 attribution. Recovered BodyParts3D 4.3 and Open3D hand surfaces retain their separately documented component credits below. These renders document the geographic file contents and do not certify complete anatomy.

## Additional anatomical objects and landmarks

`assets/nerves-*.glb` contains nervous system surfaces derived from the pinned Z-Anatomy `Startup.blend`, exported in Blender 4.5.1. Original source curves are evaluated as surfaces in their registered anatomical coordinates. Groups, side labels, route stops, selection metadata and web exports were added by Osteon. Attribution follows [the original Z-Anatomy credits](https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/License.txt), including BodyParts3D and the University of Dundee CAHID cranial nerve work. MRI-derived brain contributions include [Brain for Blender by Anderson M. Winkler](https://brainder.org/research/brain-for-blender/), CC BY-SA 3.0. The nervous-system exports are distributed under CC BY-SA 4.0. See [the manifest](src/nerve-models.json) and [the coverage report](nerve-coverage.html).

`assets/course-tissues.glb` contains 81 selected Z-Anatomy objects, exported from the original `Z-Anatomy.zip` / `Startup.blend` using Blender 4.5.1. Original named geometry and world transforms are retained; curves are converted to mesh geometry, unrelated objects omitted and web materials applied. Objects are listed in `assets/course-tissues-manifest.json`. This derived model remains CC BY-SA 4.0 with the Z-Anatomy / BodyParts3D attribution above.

`assets/ligaments.glb` adds 284 ligament and fibrous-support surfaces using Blender 4.5.1. The remaining 39 surfaces in the layer are shared with the existing Osteon assets. Z-Anatomy and its BodyParts3D contributors provide the registered source anatomy. Osteon corrected the two jaw-joint laterality labels and included teaching reconstructions of the patellar ligaments and the transverse ligament of the atlas. The atlas ligament was fitted against the C1/C2 bones with guidance from the [cadaveric and MRI study](https://pmc.ncbi.nlm.nih.gov/articles/PMC9574110/). The derived 3D layer is CC BY-SA 4.0. See [the asset inventory](src/ligament-models.json), [the Blender build](scripts/blender/export_ligaments.py), and [the coverage and limitations](ligament-coverage.html).

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

three.js © three.js authors, MIT License. See vendor/THREE-LICENSE.txt. Draco compression decoder © Google, Apache License 2.0, https://github.com/google/draco/blob/main/LICENSE . Decoder files are distributed through three.js. The developmental skull specimen is bundled locally under its separate CC BY-NC license; the source page remains linked for attribution.

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

The bundled **Fetal Skull** scan, `assets/fetal-skull.glb`, is by **Roberto Rodriguez Rubio, MD / SBCVL_UCSF**, with the **UCSF Anatomy Learning Center**. [Original model](https://sketchfab.com/3d-models/fetal-skull-7646e0227f07475eb8275d084993194c) · [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) · [UCSF source collection](https://ohns.ucsf.edu/sinus/virtual-reality-anatomic-lab-1). The licensed 1k-texture GLB was downloaded through the creator's authorized Sketchfab download. This educational derivative preserves the scanned mesh and textures, applies uniform display scale/orientation, and adds qualified developmental junction references. It is not calibrated for measurements. Some junctions are narrowed or closed; six open fontanelles are not asserted. These references remain excluded from exact spatial scoring. `src/fetal-skull-specimen.json` records source/output hashes, six reference sites, review uncertainty and attribution. This specimen and screenshots derived from it remain **noncommercial**, separately from the Z-Anatomy and code licenses.

The prior crude newborn calvarial and straightened round-window models are retained only in local backups, not offered as accepted atlas targets. `assets/accuracy-review/` contains educational inspection images derived from the same licensed anatomy sources; model images retain CC BY-SA 4.0. Source-derived text and illustrations retain their separate OpenStax license.

## Direct bone refinements

Frontal, right temporal, right maxillary and right lacrimal geometry now contains explicit Blender 4.5 reconstructed openings. These derived models retain CC BY-SA 4.0. The supraorbital opening teaches an enclosed variant rather than the source notch; its placement also references the primary anatomical study at https://pmc.ncbi.nlm.nih.gov/articles/PMC5890013/ . No image or text from that study is reproduced. Stylomastoid and nasolacrimal refinements follow source nerve/duct relationships and OpenStax 7.2. The editable project and pre-edit backups remain with the owner. `src/blender-refinement-evidence.json` records the construction limits and geometry checks.

## Promotional demo and screenshots

`demo/` contains real browser captures edited into narrated captioned videos, cover compositions, and a GIF preview. No generated interface, fabricated results, or private study history is included. Anatomy imagery retains the Z-Anatomy / BodyParts3D CC BY-SA 4.0 license; OpenStax-derived learning content retains CC BY-NC-SA 4.0. Original promotional layout, copy and generated narration are © 2026 RorriMaesu, CC BY 4.0. Each component retains its separate license. The downloadable kit includes attribution and reuse notes in `demo/SHARE-COPY.md`. Fonts used in encoded titles are rendered locally; font files are not redistributed.

The demo voices were generated locally in ComfyUI with Qwen3-TTS-12Hz-1.7B-VoiceDesign and 1.7B-Base, Qwen team / Alibaba Cloud, released under Apache-2.0: https://github.com/QwenLM/Qwen3-TTS . The installed ComfyUI integration is https://github.com/flybirdxx/ComfyUI-Qwen-TTS (version 1.0.7). A written description created the synthetic female reference voice; no real-person voice sample or private saved voice was used. The November 4, 2026 `osteon-promo.mp4` and `osteon-promo-social.mp4` add an original instrumental generated locally with ACE-Step 1.5 XL Turbo (4B) through native ComfyUI nodes: https://github.com/ace-step/ACE-Step-1.5 and https://huggingface.co/Comfy-Org/ACE-Step-1.5 . The model distribution is Apache-2.0. Original promotional copy, layout, generated narration and generated music are shared by RorriMaesu under CC BY 4.0 to the extent applicable. No claim of exclusive copyright in purely machine-generated audio is made. Earlier October videos have no music. These audio/model terms do not replace the separate licenses of anatomy images, textbook text or other components. See `demo/PROMO-PRODUCTION.md` and `demo/PROMO-SHARE.md` for the new production and reuse notes.

## Chapters 6–9 curriculum expansion

The complete licensed source collection includes PDF pages 213–384 (printed 197–368) of the supplied 2026 OpenStax Anatomy and Physiology 2e, © Rice University, CC BY-NC-SA 4.0. Access for free at openstax.org. The source textbook itself is not redistributed as a PDF. Chapter definitions, source page images, source objectives, guided summaries and adapted assessments retain that attribution and license.

The long-bone, osteon, vertebra and right-limb exam schematics are original simplified educational drawings based on the corresponding OpenStax sections. They are not scale models or clinical images. These adapted educational materials are CC BY-NC-SA 4.0. Original questions, answer keys and source-objective coverage are documented in CHAPTERS-6-9-PLAN.md and CURRICULUM-COVERAGE.csv.

## Integrated atlas annotation layer

`assets/course-landmark-labels.glb` and `src/atlas-label-anchors.json` are annotation derivatives of the licensed Z-Anatomy/BodyParts3D models and existing source-backed educational reference work. They retain CC BY-SA 4.0 for the model-derived content. Blender 4.5 assembles editable annotation nodes without moving the authored opening/surface references or changing the three existing anatomy GLBs. Whole-structure surface labels are distinguished from precise landmark references. The teacher's original document is not redistributed.

## Chapter 10 muscle-tissue extension

The complete Chapter 10 source reader (PDF pages 385–424), 85 glossary entries and 27-objective index are from the supplied OpenStax Anatomy and Physiology 2e, © 2026 Rice University, CC BY-NC-SA 4.0. Access for free at openstax.org. New explanations, assessments and qualitative teaching schematics are educational adaptations under the same content license. Schematics are explicitly not micrographs or calibrated simulations. Raw Chapter 10 textbook text is not supplied to local AI. The unreviewed muscular-system inventory is derived from Z-Anatomy and retains its CC BY-SA 4.0 provenance.

## Regional muscle atlas

The optional regional muscle GLBs are exported from the preserved Z-Anatomy / BodyParts3D Blender atlas using Blender 4.5.1 LTS. Individual source identities, anatomical sides and world transforms are retained. Compression changes storage, not the intended anatomy. Named component geometry and model-derived metadata retain CC BY-SA 4.0 with the original Z-Anatomy and BodyParts3D attribution above. This is a static anatomical reference, not a validated motion or attachment-footprint simulation. Backups of every changed model destination and the original source remain outside the public repository.

The full muscular source export contains 669 components. Large meshes receive conservative web simplification, and the regional files use Draco compression. Display metadata corrects the source’s upper/lower trapezius part labels according to their superior/inferior attachment geometry (upper descending vs lower ascending; compare https://pmc.ncbi.nlm.nih.gov/articles/PMC6849087/) and identifies an unsuffixed left iliocostalis colli from its source coordinates. Original source names are retained alongside display names. These corrections do not certify every individual attachment or authorize exact spatial scoring.

## Muscle coverage audit

The flat reference checklist uses individual anatomical terms and identifiers from FIPAT, Terminologia Anatomica, 2nd edition (2019), available through [TA2Viewer](https://ta2viewer.openanatomy.org/). The source-model TA2 CSV is a convenience index rather than an independent anatomical authority. The checklist and audit organization are independently authored; they are not a reproduction of the TA2 hierarchy. Regional checks reference OpenStax chapter 11, university anatomy tables and published anatomical studies, linked in [the audit](MUSCLE-ACCURACY-AUDIT.md). All source geometry remains attributed to Z-Anatomy and BodyParts3D under the existing licenses.

## Original-source hand and foot muscle recovery

The hand/foot repairs use original BodyParts3D / Anatomography 4.3 OBJ surfaces, downloaded from the [official source service](https://lifesciencedb.jp/bp3d/). **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**; [current source license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). These new independent downloads carry CC BY 4.0; the older Z-Anatomy derivative retains its separate CC BY-SA 4.0 license. Combined regional derivative models remain CC BY-SA 4.0. Changes: source-set segmentation into three usual palmar members, explicit left palmar mirroring, regional skeletal registration, display naming/materials, and Draco compression. Individual foot lumbricals retain the source left/right surfaces. Source OBJ files, SHA-256 hashes, transforms and segmentation are supplied in `model-sources/`; the original skeleton and Z-Anatomy source project were not modified. Bone registration validates coordinate alignment, not all attachments or source morphology. Hand teaching notes reference [Texas Tech anatomy tables](https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html); foot relationships reference [plantar intrinsic-muscle anatomical research](https://pmc.ncbi.nlm.nih.gov/articles/PMC10508328/). No research figures are reproduced.

## Palmaris brevis from the revised university hand

Geometry-only palmaris brevis is extracted from the [original Open3DModel hand GLB](https://caskanatomy.info/open3dviewer/?model=hand), Open3D project, Jan Kooloos (RadboudUMC), Marco C. DeRuiter, Eungyeol Lee, Daniel Jansma (LUMC), and collaborators; based on BodyParts3D and Z-Anatomy. The [principal modeler’s project page](https://www.eungyeol-lee.com/open3dman) states Creative Commons Attribution ShareAlike (CC BY-SA). The derivative mesh and combined atlas remain CC BY-SA 4.0. Source textures are not used. Changes: Blender 4.5 geometry extraction, registered positioning, explicit left mirroring, replacement materials, naming and compression. The source download hash and extracted-surface hash are in the repair recipe. Attachment teaching references [Moore et al., structural and functional anatomy of palmaris brevis](https://onlinelibrary.wiley.com/doi/10.1111/joa.12675). No article figure is reproduced.
### Foundations atlas

Section 1.6 worksheet, planes, cavities and membranes assets and point records are adapted from [Soma · Inside the Body](https://github.com/RorriMaesu/Anatomy-Studio-Organs-Cavities-Membranes/tree/2a4ebbf440c81096874550e083704d534f2c58a0). Their original OpenStax figure callouts and source credits accompany each view. Adaptations are CC BY-NC-SA 4.0. The interactive cutting-plane model uses the Blender Studio Human Base Meshes under CC0, as documented in the [source model notes](https://github.com/RorriMaesu/Anatomy-Studio-Organs-Cavities-Membranes/blob/main/source/planes/README.md). The model illustrates planes rather than anatomical segmentation.

The Chapter 1 organ-system profiles are adapted from [Soma Anatomy Studio](https://github.com/RorriMaesu/Soma-Anatomy-Studio/tree/b91715fe9dc1b97556982678f1cef44fd21eec61). The Chapters 1–2 trainer items and alternate choice wording come from [Anatomy Exam Trainer](https://github.com/RorriMaesu/OpenStax-Anatomy-Exam-Chapters1-2/tree/79da73372d26ddb8881bde353a504d95ae2ec8d8), integrated with the original answer keys and feedback. The chapter lessons, electron-shell exercise and pH exercise are authored Osteon teaching aids.

The medical imaging comparison displays a crop of [CT of a normal brain, axial 20](https://commons.wikimedia.org/wiki/File:CT_of_a_normal_brain,_axial_20.png) by Mikael Häggström, M.D., CC0 1.0, and [Normal axial T2-weighted MR image of the brain](https://commons.wikimedia.org/wiki/File:Normal_axial_T2-weighted_MR_image_of_the_brain.jpg) by Novaksean, CC BY-SA 4.0. The Chapter 4 orientation exercise uses [Muscle Tissue Cross Section Whole Skeletal Muscle](https://commons.wikimedia.org/wiki/File:Muscle_Tissue_Cross_Section_Whole_Skeletal_Muscle_(28089115068).jpg) by Berkshire Community College Bioscience Image Library, CC0 1.0, displayed at a smaller size. Chapter 5 and 6 cases display crops of existing OpenStax source pages with figure-specific credits.

The Study Studio figure gallery and selected activity views use cropped artwork from the same OpenStax A&P 2e reader pages. Figure numbers, available image credits, and the full source page accompany the crops. Textbook figures retain their original attributions. The adapted OpenStax figures are CC BY-NC-SA 4.0. Access for free at [openstax.org](https://openstax.org/details/books/anatomy-and-physiology-2e).

### Cell Studio, Tissue Studio and Lamina

The original cell laboratories, diagrams, lessons and captioned protein-synthesis animation, and the tissue lessons, figure tours, exam bank and textbook-based specimen crops are adapted from [Soma Cell and Tissue Studio](https://github.com/RorriMaesu/Anatomy-Studio-Organs-Cavities-Membranes/tree/2a4ebbf440c81096874550e083704d534f2c58a0). Project adaptations use CC BY-NC-SA 4.0. Original textbook figure credits appear in the reader and figure galleries. The five specimen crops are credited to the Regents of the University of Michigan Medical School. See the [Michigan Histology reuse terms](https://histology.medicine.umich.edu/home) and individual textbook figure credits. The five specimens are textbook examples for guided practice. Selected concept questions and written-response rubrics are adapted from [Lamina](https://github.com/RorriMaesu/anatomy-exam-studio/tree/080c8777f79828d0baaedfbd8a6d14909a12ea06). Course-slide micrographs with unresolved reuse permissions are excluded. The Chapter 5 skin image from Lamina is an adapted OpenStax A&P 2e Figure 5.2 crop under CC BY-NC-SA 4.0. Osteon adds contrast rings directly on the three intended structures.

### Fracture Lab

Fracture schematics and practice families are adapted from [Fracture Lab](https://github.com/RorriMaesu/fracture-lab/tree/495995e82265444e17b714305bd9aece9d33334f). The artwork illustrates the textbook concepts qualitatively. Osteon provides guided views in §6.5, a scored bank, and separate written-response rubrics.
