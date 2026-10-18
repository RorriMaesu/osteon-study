# Release notes

## Stage 16 - Complete textbook landmark inventory and practice

- Reconcile 330 canonical entries: 310 named anatomical features and 20 marking definitions/source terminology notes. Preserve all 177 lab targets and stable progress IDs.
- Add 52 validated right-side 3D reference anchors,67 source views, and 229 atlas entries. Use 189 textbook diagram targets, 93 source reference pins and 5 model targets within the canonical feature bank.
- Keep 23 source guides explicit and exclude them from spatial scoring. Provide cited source views, accurate relationship explanations and recall cards instead of guessed locations.
- Move diagrams into the main specimen stage; show one active feature. Limit locate comparisons to five separated choices on desktop and three on phones.
- Add region/type/parent/alias search, a paged landmark bank, identification sessions, recall decks and progress counts. Extend the source reader to 144 pages.
- Validate distinct nested structures, correct parent bones, alias grading, source masks, source references and all new mesh anchor bounds. All 48 automated checks pass.


## Stage 15 - Live regional navigation and bone palettes

- Implement double-click from overview to a useful anatomical area, then double-click within the area to isolate the actual clicked bone and side. Keep single-click selection in place, preserve the prior camera for Back, and focus sternum parts together as one adult bone.
- Add a visible focus trail and Back control, keyboard Enter/Escape, touch double-tap handling, and Region / Bone button alternatives. Do not treat dragging, pinching, peeling or assessment input as navigation.
- Color bones in every focused region with stable bilateral identities, a regional key and a persistent On / Off preference. Keep whole-skeleton/division overviews neutral and colors disabled during scored questions.
- Add All / Bones / Landmarks browser controls for the existing course representations. Move unsided source landmark views into their appropriate regional context instead of retaining a misleading sided crop.
- Preserve desktop content pagination and phone controls; hide/disable exploration controls during retrieval. Verify the new data/navigation rules alongside all existing checks (43 passing), current course coverage and actual browser gestures.
- This release implements the navigation/palette stage. The additional textbook landmark inventory remains under source/geometry validation; no new 3D anchors or completeness claims were invented.

## Stage 14 - Region navigation and landmark expansion plan

- Specify overview-to-region and region-to-bone double-click behavior, reversible navigation, touch/keyboard equivalents and assessment safeguards.
- Plan bone colors for every focused region, a persistent On / Off preference, neutral overviews and an optional regional key.
- Index the supplied full textbook locally and publish an initial 256-row source audit: 237 feature candidates and 19 vocabulary entries, including links to current targets and clearly unvalidated annotation candidates. This is not a final unique-feature count or a 3D completion claim; figure-label/body-text reconciliation remains open.
- Define selective labels, shared-feature context, interior and microscopic views, geometry verification, study integration and staged release gates in ANATOMY-EXPANSION-PLAN.md. No viewer or anatomy mappings change in this planning release.

## Stage 13 — Viewport-sized desktop and mobile workspaces

- Fit navigation, the atlas and footer inside the desktop viewport. Add compact division/region selectors, paged structure/details panels and a separate skull-key dialog.
- Replace long desktop content scrolling with measured, keyboard-accessible content pages for lessons, glossary, practice, progress, reader search/text and reference dialogs. Keep study navigation in view and automatically show complete answer feedback.
- Add mobile Specimen / Browse / Details views, search-to-specimen navigation, a working Focus handoff, safe touch controls and screen-aware specimen sizing. Retain natural mobile reading and preserve input drafts when crossing layouts.
- Move the tutor launcher into navigation, page long desktop setup/history, and give desktop conversations a wide reading area beside model/composer controls. Align tablet modal behavior with the mobile layout.
- Reframe the specimen after substantial aspect changes, reserve space for labels/camera tools and improve model use of the available drawing area.
- Record the design decisions and critique in RESPONSIVE-PLAN.md.

## Stage 12 — Skull-only color coding

- Apply the skull palette only while the Skull region is selected. Full-skeleton and axial overviews keep neutral bone colors.
- Add a visible Skull colors: On / Off button above the collapsible key. Show both controls only in Skull, preserve the choice while changing regions and keep colors disabled during scored practice.

## Stage 11 — Review scope and actionable retrieval progress

- Use the same filtered queue for due-card counts and decks. Practice separates lab cards in the chosen division/region from chapter cards; Progress offers the entire course without silently applying atlas filters.
- Add a 177-target retrieval map based on the latest scored attempt. Distinguish untried targets, missed/assisted targets and independently correct latest attempts; show repeated correct retrieval after at least 24 hours separately.
- Start focused ten-item identification and chapter sessions from Progress, prioritizing unresolved targets and then untried items. Full-course identification explicitly clears atlas filters.
- Show scored retrieval evidence on all twelve lesson cards. Card ratings and reading do not clear scored retrieval gaps.
- Clear abandoned card-session state when leaving practice and enable next-lab controls when anatomy finishes loading on a directly opened Progress page.
- Run every automated suite through the standard test command; expand to 39 checks, including review scope, due boundaries, latest evidence and spaced retrieval.

## Stage 10 — Conversation continuity and teaching refinements

- Preserve unfinished questions across tutor tabs, drawer closure and refresh; add keyboard sending and an editable retry path for stopped replies.
- Correct connection controls remaining disabled after a successful check; retain model-test and download state across panels and verify downloaded models before reporting readiness.
- Keep learning context synchronized with atlas regions, lesson navigation, reading pages, active questions and answer review.
- Retrieve the real target for masked prompts, expand short follow-ups using their recent topic, preserve word boundaries in source excerpts, and omit old source numbers/interrupted replies from model context.
- Make supplied citations clickable, expose their source excerpts, label generated models and flag unavailable references. Refine course-note checks for observed styloid/tuberosity and PTH-pathway errors.
- Add division selectors and target counts to practice setup, disable incompatible regions, restore exploration colors after assessment, and give joint extensions visible bone/tissue context.
- Save supplied device memory, preserve it through limited browser detection, validate memory entry and improve memory-based starting-model suggestions.


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
