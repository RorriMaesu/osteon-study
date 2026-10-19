<!-- accuracy-review-current -->
# Current verification — 2026-10-19

56 automated checks pass. 22 model backup snapshots / 87 files passed checksum verification; three original model files are unchanged.

The review reconciles all **310 named textbook features** and **422 atlas/course entries**. All **177 original lab IDs** are preserved. Of the textbook features, **55 have applied corrections**, **247 retain supported source/morphology references**, and **8 remain study references excluded from scored locating**. These counts describe review dispositions, not clinical certification.

The latest three Blender bone edits pass direct GLB lumen/rim checks and preserve native carotid clearance. Offline before/after renders and camera-to-rim ray tests were inspected. Browser verification resumed on 2026-10-19 after the approval service recovered. All three edited openings and their rim labels were inspected in the live local viewer at 1280 × 720; label Off/On was checked on the stylomastoid view. Nasolacrimal specimen/details and masked identification were checked at 390 × 844. This exposed a narrow mobile practice stage: its flex column now stretches both panels to full available width (351 pixels), with no horizontal overflow. Desktop identification still fits a 1280 × 720 document without scrolling, and names remain concealed. No browser console errors were captured. These checks used the local preview and did not submit answers or change public study history. Physical-device touch behavior and exhaustive visual review of every target remain separate work.

See [REVIEW.md](REVIEW.md) for anatomy methods and limits. Earlier stage counts and coverage claims below are historical, not current certification.
<!-- /accuracy-review-current -->

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


## 2026-10-17 — Skull divisions and local tutor

Automated checks: 24 tests covering the prior course content plus skull-family counts and paired colors, division boundaries, local/cloud model rejection, split/Unicode NDJSON streams, incomplete/error responses, cancellation/timeouts, hardware-report validation, memory-estimate limits, source retrieval and known misconception fallbacks. The original 177 course concepts, 352 model objects, 124 reader pages and 104 concept questions remain covered.

Browser checks:
- Verified appendicular pelvis displays the paired hip bones with sacrum/coccyx excluded; search excludes mixed and axial pelvic targets.
- Connected the local preview and the actual HTTPS GitHub Pages site to Ollama 0.40.5; found 15 usable local chat models. Tested both loopback addresses; added fallback after an initial 127.0.0.1 timeout on the live origin.
- Ran a real Qwen 3.5 4B test with the atlas visible: approximately 65 seconds first text including a 45-second cold load; about 87 tokens/second after loading. These are one-device observations, not advertised guarantees.
- Evaluated source-grounded explanations for radius/ulna, atlas/axis, condyle/epicondyle, bone-cell roles, PTH/calcium and fontanelles with installed Qwen 3.5 4B and Gemma 4 12B. Both could simplify or misstate facts. Added direct-explanation instructions and course notes; narrow deterministic checks substitute course notes for known PTH-pathway, skull-fusion and ambiguous styloid-question errors. Other AI claims still require source checking.
- Started a one-item fontanelle course exercise, requested tutor help and stopped generation, then chose the correct diagram target. The result correctly recorded 0/1 independent correct, 1 assisted attempt and 1 review item.
- Checked the published tutor at 390 × 844: no horizontal overflow, readable single-column panel, input and send controls accessible. Reset the temporary viewport afterward.

Windows/macOS helpers are downloadable source files, not silently executed installers. No fresh Ollama or multi-GB model installation was needed on this PC. macOS/Linux native installation and app handoff were not exercised on this Windows device. Hardware fit is an estimate; browser RAM is approximate and browser VRAM is unknown. The tutor is not a factual certification or medical advice system.

The Codex test browser blocked automated navigation to the `ollama://` app protocol. The site provides that native app handoff plus manual launch instructions; the handoff could not be verified in this browser. No alternate launch was attempted to bypass the block. Existing Ollama service connection and chat were verified separately.

Final skull-view review moved laryngeal cartilages into the axial neck/thorax context so they do not appear beneath an isolated skull region. Nasal cartilage and teeth retain their neutral skull context. Added region assertions alongside the division tests.


## 2026-10-17 — Continuity and refinement pass

Expanded automated coverage to 33 tests. New scenarios cover interrupted-chat restoration, exact reader-page allowlists, grouped/unknown references, exclusion of old citation IDs and failed drafts from model context, stale-assessment context removal, region eligibility, joint context, masked-target retrieval, word boundaries, conversational follow-ups and preservation/validation of supplied memory.

Browser verification on the local preview:
- Reproduced the live draft-loss, disabled-address and stale-page-context issues before editing. Confirmed the fixes: an unfinished radius/ulna question survives tab changes, the connection address is enabled after a successful connection, and changing to appendicular updates the tutor context.
- Started a real model speed test, moved away and back, and retained its progress and Stop control. After completion, the result remained available: Qwen 3.5 4B on this device measured about 103 tokens/second after a 32-second cold load. These are observations, not performance promises.
- Entered measured RAM and nominal VRAM, switched panels before applying, and retained both fields. Applying them and running browser detection kept supplied memory and offered an installed larger model that fit the GPU estimate.
- Verified direct division controls in quick and complete-course setup, disabled regions, preservation of task/length choices, and two axial pelvic course targets with mixed pelvis targets excluded.
- Exited a skull identification session and confirmed colors returned. Returned to the atlas with Skull still selected and confirmed the region label and specimen agreed.
- Requested and stopped tutor help during a one-item fontanelle exercise, then answered correctly. Results recorded 0/1 independent correct and 1 assisted attempt; colors returned after results. Empty Send was disabled and the assistance notice matched the active question.
- Verified Enter sending, retained follow-up drafts, persistent completion status, clickable source references, and an editable retry after Stop.
- Evaluated the six core confusion topics with installed Gemma 4 12B. It still simplified some explanations; these outputs were not treated as independent factual verification. Extended specific course-note checks for observed styloid/tuberosity confusion and for PTH bone-pathway wording that mentioned indirect intestinal absorption without clarifying the indirect bone pathway.

A browser-only preview rendering regression was caught and repaired before publication. The app-opening protocol was not retested or worked around; its earlier test-browser restriction remains documented above. No extra Ollama/model installation or progress reset was performed.

Final phone checks found and corrected an asynchronous context overwrite from pre-rendering an inactive practice screen, and source navigation that was hidden beneath the drawer. Inactive screens no longer replace the active learning context. The phone tutor uses native modal focus handling, and reading links close the drawer so the actual page is visible.

Verified the final phone layout at 390 × 844 CSS pixels with no horizontal overflow, a 44-pixel Send control, and keyboard focus cycling inside the full-screen tutor. A source reference closed the drawer and displayed the expected chapter 8 printed page 290. Practice settings use aligned label/select rows on phones.

## 2026-10-17 — Review workflow refinement

All 39 automated tests pass. Six new checks cover division/region review scope, global queues, exact due boundaries, self-rating exclusion, unordered imported attempts, latest misses, repeated immediate answers versus a 24-hour interval, and complete lab/question coverage. The content audit still reports 177 represented lab targets, twelve lessons, 104 questions, 237 glossary terms and 124 reading pages.

Browser checks used the isolated local-preview study history:
- With Appendicular / Upper limb selected and one skull card due, Practice correctly showed zero due lab cards in that selection. Progress showed the one course-wide skull card and opened a one-card fontanelle deck.
- Opened Progress directly while the skeleton loaded. Its next-lab button enabled when anatomy became ready, without navigating away.
- Started the next ten-target identification session. The previously assisted fontanelle target came first. An independently correct typed response changed its latest-evidence state from revisit to independently correct and rescheduled its card.
- Started ten targeted chapter questions, revealed a bone-classification answer and confirmed it entered the chapter queue. Rating the matching card Easy removed it from the immediate due queue but retained the section's scored-retrieval gap.
- Left a recall deck for Study and returned to Practice. The practice menu returned cleanly instead of retaining stale session markup.
- Checked desktop width 1280 and phone size 390 × 844: no horizontal overflow. Progress action buttons were at least 44 pixels high on the phone.

Retrieval evidence describes observed practice, not mastery. It uses the latest scored attempt per item, with self-ratings excluded; repeated correct evidence at least 24 hours apart is reported separately. No existing public-site study history was reset or replaced for testing.

Final desktop visual review corrected the practice/review column balance: approximately 602 / 548 pixels at width 1280, stacking to one 349-pixel column at phone width 390, with no horizontal overflow.

## 2026-10-17 — Skull-only color controls

All 39 existing automated checks pass. Browser visual checks confirmed neutral bones in the full skeleton and axial overview, family colors when Skull is selected, and immediate neutral restoration with the visible Skull colors: Off button. The button and key are hidden outside Skull. Turning colors off, leaving Skull and returning preserves Off; enabling them and entering scored skull identification switches them off and disables the toggle. Exiting practice restores the prior On preference only in the Skull view. These checks exited practice without recording an answer.

## 2026-10-17 — Responsive workspace review

The original tall layout was replaced with a desktop application frame and measured content pages. See RESPONSIVE-PLAN.md for the design decisions and critique. All 39 automated checks pass; the content audit still reports 177 represented lab targets, twelve lessons, 104 authored questions, 237 glossary terms and 124 reading pages.

Browser checks on the local preview:

- Tested Atlas, Study, Practice and Progress at 1024 × 768, 1280 × 720, 1440 × 900 and 1920 × 1080. At each size, document dimensions matched the viewport and active content-page windows had no meaningful vertical overflow. Also checked all four screens at the shorter 1280 × 600 size with the same result.
- Verified the separate skull-key dialog, its family selection, the Skull-only color toggle and paged selected-structure information. Search remains available above the paged list. Choosing a bone on a later list page retains that page; PageDown advances the focused list with the visible page selector updated.
- Reviewed lesson text, persistent section navigation and learning-path cards; fitted original textbook page images; switched to readable, paged extracted text and checked paged reading results. The original-page image can be small when fitted; Accessible text and Enlarge remain available.
- Checked concept-question options and feedback, complete-course setup, a 3D structure, a source landmark pin, and the newborn-skull diagram with numbered target buttons. Feedback moves as a complete block to a visible page with its Next target button.
- Entered an unsubmitted identification answer, changed desktop → phone → desktop and retained the exact draft. Input nodes and existing handlers are moved rather than recreated by pagination.
- Checked 390 × 844 and 360 × 740 phone layouts: no horizontal overflow, the specimen and all camera/action controls inside the viewport, 44-pixel-wide action buttons with heights at least 44 pixels, and no overlap between camera and action rows.
- Verified mobile Browse search, selection returning to Specimen, Details access and Focus opening the specimen. The tutor is a native full-screen modal below the desktop breakpoint, with a 44 × 44 Close control.
- Reviewed desktop tutor connection/model setup pages and the wider conversation/composer layout. An initially cramped history area was rejected; the final small-laptop history window measured 438 pixels high with the composer visible separately. Connected to the existing Ollama service, found fifteen usable local chat models and completed a real Qwen 3.5 4B reply. The conversation paged and followed the reply without vertical body overflow. This was a layout/transport check, not an independent certification of its answer.

Tests used the local preview's isolated study history. Public study history was not reset or replaced, no model was installed, and the previously restricted native app-opening protocol was not retried. Phone lesson/reader content retains natural vertical reading; desktop uses explicit content pages instead of shrinking educational text to fit.

## 2026-10-17 - Regional exploration implementation

Stage 15 supersedes the earlier Skull-only palette policy: colors now apply in every explicit focused region, with neutral division/whole-skeleton overviews. The additional textbook landmark inventory remains a validation backlog; the 47 source-pin mappings and original 177-item graded bank are unchanged.

All 43 automated checks pass. Four new checks cover every skeletal bone object's palette/destination, paired identity, core/context membership, two-level navigation, repeated bone focus, assessment blocking and multipart sternum identity. The course audit remains 177 represented targets, 352 objects, twelve lessons, 104 questions, 237 glossary entries and 124 reading pages.

Local browser verification:

- Used actual native double-clicks on the full specimen to open Skull, then on the frontal bone to isolate it. Back returned to the skull view. Repeated the first gesture on the final build.
- Opened the right forearm from a radius selection, inspected distinct colors and neighboring context, then double-clicked the radius to isolate its right-side instance. Checked the Region / Bone controls and the right-knee context/isolated patella.
- Turned regional colors off, reloaded, reopened a region and observed Off restored. Re-enabled colors; changing to Appendicular produced a neutral overview with hidden color controls and disabled Skull selection.
- Opened both pages of the forearm color key at 1280 x 600. Its content window had equal client/scroll heights, no clipped buttons at the page boundary and no body overflow.
- Selected Radial tuberosity through the new Landmarks mode. It displayed exactly one existing source reference pin, its proper unsided Upper limb context and the source-placement note.
- Entered its bone region and used Back: the original named pin and unsided landmark context were restored, rather than returning to an empty landmark view.
- Started identification practice without submitting an answer. Exploration navigation/colors were hidden, division/region selectors were disabled and the new browse controls were hidden. Enter in the specimen did not change focus or produce feedback. Exited cleanly and restored exploration.
- Checked the focused atlas at 1024 x 768, 1280 x 600 and 1280 x 720: body dimensions matched the viewport and no exploration/camera/action control fell outside it. Checked 390 x 844 and 360 x 740 phone viewports: no horizontal overflow and all specimen controls remained inside the visible screen. Mobile reading/footer content may continue vertically, as designed.
- No browser console errors were captured. These are browser viewport checks; physical touch-device double-tap behavior still benefits from real-device validation.

No public study progress was reset or replaced. This release changes navigation/materials and access to existing targets; it does not introduce guessed geometry or new anatomical anchors.

## 2026-10-17 - Textbook landmark expansion

Stage 16 reconciles 330 canonical source entries into 310 named anatomical features and 20 marking definitions/source terminology notes. All 177 original lab targets and IDs are preserved. The canonical feature bank contains 287 spatial targets (93 pins, 189 source diagrams, 5 modeled structures) and 23 explicit source guides. All source guides have cited context views and recall cards and are excluded from spatial scoring. See LANDMARKS.md and LANDMARKS.csv.

All 48 automated checks pass, including the original course checks. Added checks cover every canonical entry and source page, distinct nested/grouped identities, aliases and rejection of parent-bone answers, all 52 new right-side source anchors and their parent bounds, diagram target presence, sparse comparisons and masked/cropped target positions. New source anchors were compared with original and exported triangle surfaces and inspected from multiple views; maximum accepted distance is 0.743 mm. This is source consistency evidence, not independent anatomist certification.

Source-image review checked labeled originals and target overlays, including cranial base openings, temporal/sphenoid/ethmoid features, mandible, newborn fontanelles, sacrum, long-bone growth and microscopic structures, inner ear, girdles, limbs and foot. A ramus point outside the mandible was corrected. Olfactory foramina were moved to source guidance because the image does not clearly resolve a separately verified tiny hole. Unreliable source leaders were rejected rather than snapped to a surface.

Local browser verification covered:

- Full-size Hook of hamate source view and right femoral Fovea capitis pin, with one active feature and explicit reference-point limitations.
- Foramen rotundum identification: “Sphenoid” was rejected; source labels stayed hidden. Fovea capitis identification accepted its precise name and displayed correct feedback. Only the local preview's isolated study history was used.
- At 1280 × 720 and 1024 × 600, desktop document height equaled viewport height. The bank keeps filters visible and pages its cards; source illustrations and question details use the available workspace.
- At 390 × 844, Browse selection returned to Specimen, the Hypoglossal canal source view fit the pane, the Nasolacrimal canal guide displayed zero target dots, and there was no horizontal overflow. Phone questions put the visual before the answer panel and retain natural vertical reading.
- A loading race initially replaced the landmark bank with the practice menu when the skeleton finished loading. The bank now survives model readiness, retains filters, and enables model-dependent practice when geometry is ready.
- A missed textbook-only Foramen rotundum attempt appeared as one due card; its filtered review button opened exactly one matching recall card. Next practice uses the existing date-aware retrieval plan to prioritize missed/assisted targets and handle unordered imported evidence.

The 144 reader pages include all original complete chapters plus the added source references. Derived image and model-data licenses are retained separately. No original private course document, full textbook PDF, machine path or public study-history change is included.
# 2026-10-18: labeled 3D release and interaction review

All 310 named textbook features now resolve a 3D representation. All 51 automated tests passed. Desktop and phone browser checks, masked identification/grading, target-preserving Reset, source/3D transitions, labels, cutaways, isolation and X-ray were reviewed. Seven backup snapshots and 27 copied files passed checksum verification; the three original model files remain unchanged. See [REVIEW.md](REVIEW.md) for exact checks and anatomy fidelity qualifications.


## 2026-10-19 — Classroom demo and sharing kit

Created a 29.33-second 1920 × 1080 H.264 demo, a 24.10-second 1080 × 1920 social edit, a 72-frame GIF preview, six actual application screenshots, two covers, English captions, a transcript, and class-group post copy. Both videos are intentionally silent. Captures use an isolated local origin; one correct landmark response shown in the video was actually submitted there. Public study history was not reset or used.

Both complete MP4 files decoded without errors. Scene review frames were inspected; the vertical covers were recaptured at their full 1080 × 1920 extent after the initial viewport capture clipped their bottoms. All media hashes, local asset links, caption files, GIF frame count, and the ZIP archive passed verification. The kit contains sixteen files and is approximately 2.87 MiB. Fonts are rendered into titles, with no font files redistributed.

Browser checks confirmed desktop video playback with a decoded 1920 × 1080 stream, the Recall chapter jumping to 16 seconds, no media errors, and a complete seekable range. A local media-capable server was used because Python's basic static server cannot serve byte ranges. At 390 × 844 the demo page had no horizontal overflow, readable sharing text, and a working ZIP download. Browser viewport overrides were reset afterward.

Filming exposed a viewer-control defect: pointer events from the landmark Label/Cutaway toolbar could select the bone behind the control. The toolbar now stops those pointer/navigation events. Browser checks confirmed Label Off and On preserve the selected Nasolacrimal canal, and identification practice opens that target correctly. All 56 application tests pass after the fix. No anatomy meshes changed in this release.
