# Spring model sources and preparation

The catalogue identifies each view as a regional atlas, reference specimen or teaching reconstruction. Gross regional files retain their source coordinate systems. Microscopic models open separately. The inspection controls supply teaching colors, rotation, isolation and magnification. Each model loads on demand.

## Regional atlas

**Z-Anatomy** by Gauthier Kervyn and contributors, based on BodyParts3D © The Database Center for Life Science, supplies the adult male regional anatomy. Osteon used the same archived `Startup.blend` as the node atlas, SHA-256 `9f08a17ea0115fed80b2a73ecdf0a1bc2ab2f6956f37c593ce23d513ea35afcd`. All Z-Anatomy derivatives in this folder retain CC BY-SA 4.0. Coordinates are metres with patient left at positive X, superior at positive Y and anterior at positive Z. [Original model](https://github.com/Z-Anatomy/Models-of-human-anatomy) · [Contributors and license](https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/License.txt) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

| Files | Source geometry and changes |
|---|---|
| `lung-lobes.glb` | Five lobes, both main bronchi, pulmonary arteries, diaphragm, trachea, thyroid cartilage and paired sixth ribs. Blender 4.5.1 evaluated the source objects, baked their world transforms, simplified dense surfaces and exported them together. The app moves the lobes and diaphragm through an illustrative five-second breath. Volume and pressure use educational values. |
| `immune-organs.glb` | Bilateral palatine tonsils, thymic lobes, jugular and subclavian veins, sixth ribs and spleen. Compare the venous junctions with the separately drawn lymph-drainage routes. |
| `accessory-ducts.glb`, `distal-colon.glb`, `fuel-organs.glb` | Preserved donor positions of accessory organs and their ducts, distal colon and sacrum, and gut–portal vein–liver–skeletal-muscle relationships. The neck-side bend of the donor’s continuous gallbladder outlet is separately selectable as the cystic duct. Its distal boundary is illustrative because the hepatic branch is absent. The exported pancreatic duct ends about 4.8 mm from the nearest duodenal vertex. Its microscopic outlet is taught in the lesson. |
| `urinary-tract.glb` | Paired kidneys, renal arteries, renal pelves and ureters, bladder, urethra and sacrum. The model presents male outflow anatomy. |
| `sperm-route.glb` | Paired testes, epididymides, ductus deferentes, ejaculatory ducts and seminal glands, prostate, bladder, urethra and penile landmarks. Each source ductus ends about 32 mm from the source ejaculatory duct. Two individually named illustrative terminal segments bridge these gaps behind the bladder. Their centerlines and diameters are reconstructions. Scored targets use the source surfaces. |

The regional node views reuse the released left/right Z-Anatomy groups in their native frame. The 158 underlying records contain 31 landmark checks, 110 source-aligned positions and 17 withheld entries. The student sees only available geometry. Overlaid skeletal context comes from the same registered Osteon atlas. Screen-size dots flag a real mesh vertex for each shown group. [Node coverage and review status](../../lymph-node-coverage.html) · [Shared skeleton credit](../MODEL-LICENSE.md)

**BodyParts3D 4.0** by The Database Center for Life Science supplies `alimentary-tract.glb`. The part-of 99% OBJ archive and its part-to-element table furnish millimetre coordinates. Blender converted them to metres and reduced the student model. The esophagus, stomach, duodenum, jejunum, ileum, ileocecal junction, ascending, transverse and descending colon and rectum have separate targets. The sigmoid is available in the separate regional atlas. The original subject is the BodyParts3D adult male reference. DBCLS publishes the current CC BY 4.0 terms. The earlier OBJ headers retain CC BY-SA 2.1 Japan. This derivative is additionally available under the older share-alike terms. [Release](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) · [Publisher’s terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) · [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/)

## Human Reference Atlas

The following Human Reference Atlas files are licensed under CC BY 4.0. The spring exports preserve source mesh names and reference coordinates. Blender 4.5.1 reduces surface density for the web. The viewer applies a removable section plane, display materials and magnification. [HRA reference library](https://humanatlas.io/3d-reference-library) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

| File | Reference and provenance |
|---|---|
| `node.glb` | Li Yao and Kristen Browne, *3D Reference Organ for Lymph Node, Male v1.4*. Cross-species reference derived from Weizhe Li’s Ce3D cleared mouse-node microscopy. The HRA model includes afferent and efferent vessels, capsule, follicles, paracortex, medulla and vasculature. The sinus-flow diagram is a separate original reconstruction. [Release](https://doi.org/10.48539/HBM532.TNXR.875) · [Microscopy study](https://doi.org/10.1073/pnas.1708981114) |
| `kidney.glb` | Kristen Browne and Heidi Schlehlein, *Kidney, Male, Left v1.3* and *Ureter, Male, Left v1.2*. Both derive from the National Library of Medicine Visible Human Male and retain their published registration. The ureter release contributes major/minor calyces, renal pelvis and ureter. The export trims the ureter to its proximal 35 mm of superior–inferior extent. Each papilla lies within 0.34 mm of a minor-calyx surface. The major calyces meet the pelvis and the proximal ureter lies within 0.04 mm of it. One minor calyx lies approximately 1.54 mm from the nearest major calyx. Surface proximity identifies spatial relationships and does not establish an unbroken fluid lumen. [Kidney](https://doi.org/10.48539/HBM759.JKKF.434) · [Ureter](https://doi.org/10.48539/HBM434.VLQJ.299) |
| `glomerulus.glb` | Heidi Schlehlein, *3D Glomerulus Functional Tissue Unit v1.0*. Enlarged reference model with afferent and efferent arterioles, capillaries and 15 podocyte meshes. Relative source geometry is retained. The HRA record supplies no individual donor or calibrated microscopic length. [Release](https://doi.org/10.48539/HBM523.RDFD.869) |

## Carnegie embryo surfaces

`carnegie-stages.glb` combines four separate **NIH 3D** exterior segmentations by Kristen Browne. Credit **Carnegie Collection of Embryology, Archives of the Human Developmental Anatomy Center, National Museum of Health and Medicine, Silver Spring, MD**. Each NIH record specifies CC BY. The archive preserves the exact license field and source attribution alongside each downloaded mesh. The separate fixed embryos illustrate different developmental stages. Chronological ages below refer to time after fertilization. Obstetric gestational ages are approximately two weeks greater.

The original STL files have different arbitrary print scales. Blender measured the greatest inter-vertex distance over each mesh’s convex hull, scaled it uniformly to the greatest length reported for the fixed specimen linked by NIH, centered it for display and simplified its surface. The initial view uses one common scale. Individual focus changes magnification.

| Carnegie stage | NIH entry | Raw greatest distance, STL units | Calibrated length | Fixed specimen and estimated age |
|---|---|---:|---:|---|
| 12 | [3DPX-016955](https://3d.nih.gov/entries/3DPX-016955) | 260.012 | 3.9 mm | [Carnegie 8943, 29 days](https://www.ehd.org/virtual-human-embryo/intro.php?stage=12) |
| 16 | [3DPX-016953](https://3d.nih.gov/entries/3DPX-016953) | 260.263 | 10.5 mm | [Carnegie 6517, about 39 days](https://www.ehd.org/virtual-human-embryo/intro.php?stage=16) |
| 20 | [3DPX-016951](https://3d.nih.gov/entries/3DPX-016951) | 184.952 | 20 mm | [Carnegie 462, about 49 days](https://www.ehd.org/virtual-human-embryo/intro.php?stage=20) |
| 23 | [3DPX-016950](https://3d.nih.gov/entries/3DPX-016950) | 25.761 | 31 mm | [Carnegie 9226, about 56 days](https://www.ehd.org/virtual-human-embryo/intro.php?stage=23) |

## Original teaching reconstructions

Osteon authored the following GLB geometry and the illustrative terminal connections in the male pelvic view. These models use original geometry. Coordinates, colors, thicknesses and relative cell or vessel sizes are illustrative. Individual diagrams use independent scales and section planes. The layer positions follow the corresponding OpenStax A&P 2e chapters. [OpenStax Anatomy and Physiology 2e](https://openstax.org/details/books/anatomy-and-physiology-2e)

| Chapter | Teaching assets |
|---|---|
| 21 | `lymph-drainage.glb`, `node-sinuses.glb` |
| 22 | `pleura.glb`, `alveolar-exchange.glb` |
| 23 | `villus.glb` |
| 24 | `metabolic-cell.glb` |
| 25 | `nephron-pair.glb`, `filtration-barrier.glb` |
| 26 | `fluid-spaces.glb` and separate lung and nephron views |
| 27 | `pelvic-section.glb`, `ovarian-follicle.glb`, `seminiferous-tubule.glb` |
| 28 | `cleavage-implantation.glb`, `placental-exchange.glb`, `birth-orientation.glb`, `lactating-unit.glb` |

The fluid-compartment and placental-exchange reconstructions were created in Blender 4.5. Their separately selectable fluid samples have illustrative outer limits. The model builder checks the exported structures in three dimensions for enclosure within the capillary, cell membrane and branching chorionic villus. In the blood-compartment model, the formed elements use the A&P II source geometry and a selectable sample of plasma surrounds them. The cutaway and transparent surface views expose internal details. Relative cell counts and fluid volumes are illustrative. [Body fluid compartments](https://openstax.org/books/anatomy-and-physiology-2e/pages/26-1-body-fluids-and-fluid-compartments) · [Leukocytes and platelets](https://openstax.org/books/anatomy-and-physiology-2e/pages/18-4-leukocytes-and-platelets) · [Embryonic development](https://openstax.org/books/anatomy-and-physiology-2e/pages/28-2-embryonic-development)

Existing nasal and gut-wall preparations, marrow, adipose, ovarian pelvis, placenta, formed elements and fetal circulation retain their original credits and licenses. [Neural and enteric models](../ap2-neuro/SOURCES.md) · [Gland, marrow and placenta preparations](../ap2-glands/SOURCES.md) · [Blood-cell models](../ap2-blood/SOURCES.md) · [Fetal circulation](../AP2-CARDIO-LICENSE.md)

## Reproduction and checks

[Download reference inputs](../../scripts/fetch-ap3-reference-models.py) · [Build regional and reference GLBs](../../scripts/build-ap3-reference-models.py) · [Build the teaching models](../../scripts/build-ap3-teaching-models.mjs) · [Developmental reconstructions](../../scripts/ap3-development-models.mjs) · [Reindex selectable meshes](../../scripts/index-ap3-meshes.mjs)

The BodyParts3D archive SHA-256 is `9fbc713fffeee924a5a657d9813d84d7eb957bded63adb854931dd5e3eb61c97`, and the element table SHA-256 is `3f5f6df1028eb122b30de77c711597b6bb8e5541658e5985859fd228adbf88ea`.

The build writes to new paths. During development, versioned model backups and SHA-256 records were saved before replacing any spring export. Existing winter and fall model files remain their original releases. Original downloads, source metadata and development backups are archived outside the student application.

Each catalogue target was checked against the reachable GLB mesh and its vertex extents. Automated Chrome checks opened every view at 375 × 667 and 1280 × 680, exercised rotation, zoom, reset and focus, and selected each available structure. The six scored models also ran with WebGL disabled using their lettered spatial descriptions and saved selections. The four embryo orientations and the node overlays received a separate rendered inspection. These checks use emulated viewports. A physical handset and an instructor practical review are still needed for classroom sign-off.


### Microscopic structures in the spring teaching models

The lymph node shows the connected subcapsular, cortical (trabecular) and medullary sinuses. The renal corpuscle cutaways distinguish the glomerular capillary tuft from the surrounding capsule. The seminiferous tubule shows a representative neighboring pair of Sertoli cells, their basal nuclei and a tight junction between them. The reconstructed cells, vessels and spaces are enlarged to make their relationships visible. [OpenStax lymphatic anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/21-1-anatomy-of-the-lymphatic-and-immune-systems), [microscopic kidney anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/25-4-microscopic-anatomy-of-the-kidney), [testicular anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/27-1-anatomy-and-physiology-of-the-testicular-reproductive-system).
