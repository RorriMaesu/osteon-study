# 3D atlas review — 2026-10-18

## Findings fixed

- Labels now sit beside the feature with a leader and a surface/space dot, leaving the target visible. Labels have a working On/Off control.
- Isolate and X-ray now affect the additional teaching models and reconstructed passages, while retaining authored material colors. Peel can remove teaching-model surfaces and Restore brings them back.
- Internal conchae, cranial floors and mandibular features have explicit cutaways and appropriate views. Small microscopic targets and the costal groove have closer views.
- Mobile textbook comparisons open the Specimen pane. Returning to 3D restores the selected reference and its camera, rather than an unrelated parent-bone frame.
- Practice keeps names and feature-specific notes hidden for identification. Locate choices share the visible model/context and cutaway; close details without a useful comparison use typed identification. Practice Reset preserves the question and target.
- Clicks on reconstructed passage geometry retain the anatomical feature's name and label. Internal construction-object names do not replace the learning target.
- Model URLs include content versions so a new publication does not reuse a cached model revision.

## Verification

- 51 automated tests passed: original lab IDs, all 310 feature representations, finite coordinates, actual parent/model resolution, side identity, vocabulary and model distinctions, source reading, progress and tutor checks.
- Desktop atlas at 1280 × 720 and the normal 1193 × 884 viewport fit without document scrolling. Practice also fit the normal desktop viewport.
- Phone layout checked at 390 × 844: Browse → selected 3D specimen, Details → textbook comparison → precise 3D return, label toggles and passage isolation worked without horizontal overflow. This is responsive-browser testing, not a claim of physical-device performance testing.
- Browser identification exercise concealed the answer and graded a typed response correctly. Reset retained the same target ID and question.
- Seven pre-revision backup snapshots contain 27 checksum-verified files. Original `Startup.blend`, `skeleton.glb` and `course-tissues.glb` still match the first snapshot.

## Anatomy fidelity

The complete catalog has 310 named features and 20 vocabulary entries; all named features have a primary 3D study representation. This does not imply that every feature was resolved in the original specimen. Fine passages, microscopic layers, developmental anatomy and selected axial variants use explicitly identified teaching geometry. Reconstruction caliber, wall thickness and fine contour are explanatory. Source-specific placement evidence and native-mesh limits remain documented per feature.

Pins identify a reference or contributor rather than tracing an entire boundary. Composite guides for arches, spaces and curves describe arrangements. Original source annotation stubs rejected during inspection are not reused as new precise landmarks. The adult source cochlea/vestibule seam and apical opening are not labeled as the round window.

See [the complete 3D audit](LANDMARK-3D-AUDIT.csv) and [coverage guide](LANDMARKS.md).
