# Visibility and practice review — November 4, 2026

This follow-up fixes the disappearing-disc report and related reproducible viewer/interaction problems. It does not claim that every possible defect or all anatomical source limitations have been eliminated.

| Reproduced problem | Result |
| --- | --- |
| Discs were hidden with optional ligaments/tissues. | A separate **Discs** layer starts on and shows the number of disc objects in the current specimen context. The extra-tissue layer remains independent. |
| Curvature and foraminal views isolated vertebrae without their intervening discs. | Actual neighboring levels determine disc context. Within the three curvature specimens, cervical shows five discs, thoracic eleven, and lumbar four; the two-vertebra foraminal view shows its intervening disc. No C1–C2 disc is invented. |
| Transitional discs were assigned to one region only, and all lumbar discs were associated with the pelvis. | C7–T1 and T12–L1 belong to both adjoining study regions; the pelvic junction includes L5–S1 without pulling every lumbar disc into that context. |
| Macro thorax/pelvis navigation omitted axial attachment context present during regional zoom. | Thorax keeps T1–T12; pelvis keeps L5 and the sacrum. Discs between the included levels stay with them. Thoracic attachment context follows [OpenStax 7.4](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-4-the-thoracic-cage). |
| X-ray context made unselected discs almost disappear. | Disc context uses a more legible translucent material. A nucleus-pulposus target retains the lighter surrounding context needed to see its interior. |
| A disc target could conflict with an off layer preference. | Selected disc targets remain visible. The control says **Target**, is disabled, and preserves the user's layer preference for later views. |
| Peeling a vertebra could remove neighboring disc context. | Disc membership follows the anatomical study context; an explicitly peeled disc still stays hidden until Restore. |
| A peeled/filtered parent could leave an amber surface or trace floating alone. | A guide requires its actual parent to be displayed in the active specimen. |
| Layer button states could lag behind region and exercise changes. | Disc, tissue, Peel, X-ray, isolation, rotation and Restore states are synchronized with the viewer. Single-bone isolation explicitly explains why surrounding discs are omitted. Back restores the region. |
| Camera presets could abandon a close landmark view. | Presets retain the selected feature's framing. Resizing preserves viewing direction; active preset indicators match the chosen view. |
| Curvature specimens occupied too little of the canvas. | Their framing fits the actual selected vertebrae and available drawing area, including expanded phone views. |
| Locate questions could offer buried/offscreen distractors or a buried key. | Choices are checked against the intended camera, visible surfaces and cutaway. An unusable choice set switches that question to name recall. Later questions retain the requested task. |
| An amber guide or trace could reveal the correct locating choice before an answer. | Locating questions withhold the answer's guide until feedback. Identification questions retain their target highlight. |
| Feedback could renumber a locating target when replacing several choices with a single pin. | The original pin order and numbers remain during feedback, with the correct target highlighted. |
| Curvature questions used a misleading buried point; loading markers cleared their alignment guide. | Curves use profile-based name recall with a restored dashed alignment guide. They no longer ask the user to infer a regional curve from a covered dot. Outlines are replaced cleanly. |
| Changing the URL's section could leave the previous screen displayed. | Valid atlas/study/practice/progress hash changes route to the matching section and run the existing draft/session cleanup. Skip links remain separate. |
| Phone camera presets overlapped a taller action row. | Control rows are measured; the camera row, hint and drawing area reserve the actual height. |
| Some nasal cartilages fell outside the skull, and tendon/retinaculum structures could be classified as bone. | Their region/tissue classifications now remain consistent. |

## Verification

The review used a fresh local browser origin, preserving public scores and exam/list drafts. The lumbar failure was captured before and after the change. Browser checks exercised all six camera presets, cervical/thoracic/lumbar and foraminal specimens, macro spine/thorax/pelvis, independent layer toggles, selected disc protection, single-bone isolation/Back, scapular peeling/Restore, spelling credit, direct section links and expanded phone controls.

At 1280 × 720, the lumbar profile shows all four intervening discs with other tissues off. At 390 × 844, the expanded model and controls remain usable; the measured control-row gap was about 9 px with no overlap. A typed **lumbar curvatre** received credit and a separate spelling-review note. The sampled final local views reported no console warnings/errors. These are browser viewport checks; they do not certify physical-device gestures, all assistive technologies, graphics recovery or every hardware/browser combination.

**163 automated checks pass.** New regressions cover real disc inventory and levels, strict division/peeling/isolation rules, context opacity, guide ownership, answer-highlight concealment, region classifications, observable locating choices and per-question task fallback. The browser confirmed a two-choice fossa question with no covered choices, no advance answer highlight, and the same correct target number before and after answering. Existing anatomy holds, model/annotation checks, source-list coverage, chapters 6–9, draft recovery and answer-review checks remain required.

All geometry and authored landmark coordinates are unchanged in this release; no Blender/model-file edit was needed. Existing verified model backups remain intact. Model/source morphology limitations and independent anatomical/item review remain open as recorded in [the focused landmark review](EXAM-LANDMARK-CLARITY.md) and [the implementation ledger](QUALITY-IMPLEMENTATION.md).
