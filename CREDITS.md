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

`src/landmarks.json` contains 47 course landmark mappings derived from Z-Anatomy anatomical annotation leader endpoints. Coordinates are transformed from Blender to the web coordinate frame. Vertex index and distance to the nearest exported skeletal vertex are retained for provenance. These data remain CC BY-SA 4.0. Labels are rendered as reference pins with connector lines, rather than claiming full surface segmentation. Unreliable axial annotation leaders were replaced with textbook targets.

Original download: https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Z-Anatomy.zip . The original atlas definitions and automatic translations are not reused.

## Learning content

Study explanations, retrieval prompts and questions are newly written adaptations informed by OpenStax, Anatomy and Physiology 2e, J. Gordon Betts and contributing authors, © 2026 Rice University. The supplied edition is licensed CC BY-NC-SA 4.0. Osteon's adapted learning content is shared under CC BY-NC-SA 4.0. Access for free at openstax.org.

- https://openstax.org/details/books/anatomy-and-physiology-2e
- https://creativecommons.org/licenses/by-nc-sa/4.0/

`assets/reader/` reproduces chapter 6 and 7 page images from the supplied edition, plus lab-relevant readings from chapters 8 and 9. `src/reader-pages.json` contains corresponding extracted text. `assets/figures/` reproduces source illustrations; the app crops, masks labels and overlays numbered targets for practice. Figure/page provenance appears in `assets/figures/manifest.json` and every displayed figure's attribution. Page images are unaltered renderings except resizing/compression. These reproduced and adapted materials remain CC BY-NC-SA 4.0; the commercial permissions of the code license do not apply to them. Access for free at openstax.org.

The supplied BI 231 Fall 2024 lab structure list defines the course checklist. Its original document, authorship metadata and local file paths are not redistributed. This independent study tool is not an official OpenStax or college product.

## Software

Original Osteon application code: MIT License, © 2026 RorriMaesu. This code license does not replace the separate model and learning-content licenses above.

three.js © three.js authors, MIT License. See vendor/THREE-LICENSE.txt. Draco compression decoder © Google, Apache License 2.0, https://github.com/google/draco/blob/main/LICENSE . Decoder files are distributed through three.js. No third-party viewer iframe is used.

MIT License: Permission is hereby granted, free of charge, to any person obtaining a copy of the original application software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to inclusion of this notice. THE SOFTWARE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY ARISING FROM THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
