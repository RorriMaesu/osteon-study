# Learning-module improvements — November 4, 2026

This tracks the 70 recommendations from the November 3 review of release `00a210c`. It distinguishes working software from independent educational, anatomical and accessibility validation. The initial atlas/grading/backup changes shipped in `3b60fa4`; this release adds guided learning and broader assessment. It does **not** certify examination readiness or replace the assigned textbook/instructor.

## Delivered scope and evidence

- All **177 teacher-list entries**, **182 dedicated list-test questions**, **310 textbook features**, **24 sections** and **74 source objectives** remain accounted for.
- The chapter bank now has **400 items: 100 per chapter**, plus the existing **104 supplementary questions**. There are 120 typed/identification items. Keys and original grading versions remain compatible with saved sessions; revised distractors preserve older option snapshots.
- The **145 automated checks** cover data, grading, source targets, backup transactions, randomized exam coverage, exposure, custom blueprints, daily routes and session boundaries. These checks do not establish anatomical correctness or AI factual reliability.
- Browser checks used an isolated local origin. The public user's answers/history were not changed. Sampled 1024 × 640, 1280 × 720 and 390 × 844 layouts; verified explicit empty searches, exact lesson return with a reasoning draft, typo credit, pending wording, non-AI rehearsal, custom weights, optional confidence and retained drafts. QA.md records remaining device limits.
- No anatomy geometry or authored landmark coordinate was changed in this implementation. Existing source holds and geometry backup requirements remain in force.

**Status:** Implemented = code and appropriate checks added; Partial = useful work shipped with a stated gap; External = independent review or real-device evidence still required; Preserved = an existing qualification deliberately retained.

| Review | Status | Result / remaining work |
|---|---|---|
| 01 | Implemented | One outside active-name card, hollow neighboring markers and explicit bounded comparison; `specimen-annotations.js`. |
| 02 | Implemented | Pelvic ligaments and the plantar tendon sheath have explicit regions; unknown names no longer default to Skull. |
| 03 | Implemented | Landmark names toggle independently of anatomy visibility and framing. |
| 04 | Implemented | Selected landmark/side survives bone isolation; sparse overlays use the retained target. |
| 05 | Implemented | Six attachment projections recategorized; glenoid articular feature remains distinct. |
| 06 | Implemented | Shared spelling/meaning policy across specimen, course, list and chapter recall. |
| 07 | Implemented | Explicit side policy; unsided prompts intentionally permit a side without accepting an opposing required side. |
| 08 | Implemented | Full study backup, optional chat/preferences, preview, validation and failed-write rollback. Lesson drafts and exposure now included. |
| 09 | Implemented | No-results state hides the old page and offers clear/search-all actions. |
| 10 | Partial | 144 parallel questions added; retakes favor unseen items. Sixty seeded pairs per chapter repeat at most four items in the current test. Independent item review remains required. |
| 11 | Implemented | Masked source figures, movement diagrams, 20-item visual practical and separate 3D circuit. |
| 12 | Partial | Eighteen conspicuous distractor sets revised with plausible parallel alternatives; whole-bank item writing/pilot review remains open. |
| 13 | Implemented | Region tiles, local groups, search and joint-context chooser replace an unfiltered initial list. |
| 14 | Implemented | A brief prediction opens a lesson; objectives are available without occupying the first teaching screen. |
| 15 | Implemented | Reader returns to the originating lesson step/draft or saved exam during the current visit. Reader origin itself is not a cross-reload bookmark. |
| 16 | Partial | Loading identifies successive assets and offers retry/text study. Connection/device measurements and deferred optional-layer evaluation remain open. |
| 17 | Implemented | Camera fitting reserves the callout rail/phone card and controls. Sampled views passed; not an exhaustive view certification. |
| 18 | Implemented | Active name remains accessible when hidden; Show best view is a separate action. |
| 19 | Implemented | Shared annotation layout, stable side, bounded comparison and throttled occlusion work. |
| 20 | Implemented | Local anatomical groups and right knee/shoulder/hip context plus cervical-column chooser; all finder entries remain reachable. |
| 21 | Partial | Existing source-backed passage notes/geometry retained. Additional entrance/exit paths require validated coordinates; none fabricated. |
| 22 | Preserved | A reference point is explicitly not full segmentation; unvalidated boundaries are not invented. |
| 23 | External | Independent instructor/anatomist review of anchors, openings and views remains required. |
| 24 | Preserved | Fetal sites, ethmoid drainage and round-window qualifications/scoring holds remain. Back up before any future geometry edit. |
| 25 | Implemented | Daily route combines due cards, a weak/untried section and a varied exit check. |
| 26 | Implemented | Every lesson starts with an authored prediction/retrieval problem; no source-access gate. |
| 27 | Implemented | Orient → Understand → Explore → Retrieve → Apply; named explanation topics, estimated workload and saved position. |
| 28 | Partial | Related figures are selectable in Explore and full sources remain one action away. Rich figure-specific parallel commentary/label controls remain limited. |
| 29 | Partial | Existing chapter 6 mechanisms are integrated into the five-step route, prediction/reveal and application. Richer dedicated mechanism simulations remain future work. |
| 30 | Partial | Regional atlas, guided relationships, source views and chapter 7 transfer questions are linked. A complete authored orientation tour remains open. |
| 31 | Partial | Articulated/isolated views, side-aware grading and chapter 8 transfer questions retained/expanded. No new mirrored anchors or absolute rules for pelvic variation. |
| 32 | Partial | Movement explorer, joint contexts, source questions and classification/constraint problems integrated. Additional verified tissue-motion demonstrations remain open. |
| 33 | Partial | Worked explanation → saved retrieval → application is explicit. A timed, partially cued fading sequence is not yet a separate mode. |
| 34 | Partial | Word roots, accepted aliases and optional local device pronunciation added. Voice pronunciations have not been independently checked; no verified syllabic audio claim. |
| 35 | Partial | New questions carry authored skill metadata and objective links; coverage is still evidence for the sampled question, not every skill in an objective. Full original-bank skill review remains open. |
| 36 | Implemented | 3D practical selects eligible teacher targets; visual practical uses masked references. Accuracy-held targets remain excluded from spatial scoring. |
| 37 | Implemented | Duplicate matching selections produce a soft warning; no other answer is silently changed. |
| 38 | Implemented | Matching-pair and sequence-position diagnostics preserve the one-point/all-parts scoring rule. |
| 39 | Partial | Authored chosen-distractor feedback for all 54 revised alternatives; other items retain their existing explanations. |
| 40 | Implemented | Exposure recorded separately from score; unseen-first selection and first-view answer reporting. Novelty is not presented as validated transfer readiness. |
| 41 | Implemented | Custom chapter/section weights and 1–100 items, feedback timing and optional active-time goal. Default cumulative plan is explicitly a practice blueprint. |
| 42 | External | Voluntary classmate pilot and ambiguity/response-time review remain required. |
| 43 | Implemented | All 120 typed/identification policies explicit; formal terms, sets, counts, sides and equivalents remain distinct. |
| 44 | Partial | Canonical/alias/nearest-different-key tests expanded to 120 items and shared cross-mode tests. Broader eponym/accent/model corpus review remains open. |
| 45 | Implemented | Pending answers offer non-AI standard-wording rehearsal in chapter reports, list reports and specimen/course summaries without changing original scores. |
| 46 | Implemented | Plain-language distinction between typo, equivalent, different structure/side, general answer and uncertain wording. |
| 47 | Implemented | Daily repair sets spread primary objectives and rank scored weaknesses; existing full-item coverage remains accessible. |
| 48 | Partial | Existing delayed independent retrieval remains separate from immediate/self-rated/assisted work; exposure added. No validated readiness prediction added. |
| 49 | Implemented | Optional confidence on every fifth question, retained in saved exams and summarized conservatively. |
| 50 | Implemented | Daily minutes and exam date; the final seven days mix chapter exit questions. This is a study route, not a grade prediction. |
| 51 | Implemented | Daily route and resume recent lesson appear before detailed progress counts. Saved exams retain their visible Resume action. |
| 52 | Implemented | Chapter-route cards, regional exploration, explicit practicals and exam center clarify primary intentions. |
| 53 | Implemented | Named lesson steps, source return, enlarge figure, backup preview and issue-draft controls describe their action. |
| 54 | Partial | Short-laptop browser checks found/fixed empty question pages and confidence displacing choices. Real Windows scaling/browser zoom combinations still need validation. |
| 55 | External | Phone-width layout sampled, but real software keyboards and physical touch gesture testing remain required. |
| 56 | Preserved | Existing viewer expansion/control hierarchy and equivalent view buttons retained; sparse phone callout supports the new label hierarchy. |
| 57 | Partial | Main navigation focuses headings; pointer focus no longer cancels first clicks during pagination. Full NVDA/keyboard audit remains required. |
| 58 | Partial | Larger lesson/feedback text and forced-color styles added. Full contrast, text spacing and 200–400% reflow audit remains open. |
| 59 | Partial | Structured reader paragraphs, figure descriptions and assisted text alternative added/retained. Every complex figure still needs an independently reviewed equivalent explanation. |
| 60 | External | Optional color, reduced motion and text states retained. Physical devices and complete non-color/motion testing remain required. |
| 61 | Preserved | Existing guided local-AI setup keeps connection, selected model and tested response distinct; Back to studying remains available. |
| 62 | Partial | Observed first-text latency now suggests a smaller model without changing the saved selection. No measured device-wide GPU/atlas benchmark claim. |
| 63 | Implemented | Three-/five-reply topic contract, one-question guidance, final recap/uncertainty/independent task request. AI adherence and factual accuracy are not guaranteed. |
| 64 | External | Existing retrieval/misconception tests remain; broad model tutoring/source-relevance benchmark still required. Narrow reply checks are not general verification. |
| 65 | External | Original response/model/review evidence preserved. Cross-model repeatability/contradiction evaluation remains required. |
| 66 | Partial | Inactive/hidden view early return, dirty rendering, idle annotation throttling and camera/scene occlusion caching. No battery/frame-rate improvement claimed without profiling. |
| 67 | Partial | Graphics-loss restore and text route, model retry, retained drafts. Interrupted transfers/context restoration have not been fully exercised in a real browser/device fault test. |
| 68 | Partial | Regression checks expanded and key journeys manually browser-tested. A repeatable unattended browser journey/screenshot suite is still open. |
| 69 | External | Existing source/model licenses retained. Applicable supplied-edition provenance and tutor excerpt AI-use permission still need definitive review; attribution alone is not claimed to settle permission. |
| 70 | Implemented | Item/question issue draft includes ID, source and release; excludes answers/history/chat. Student explicitly reviews/submits on GitHub. Changelog records corrections. |

## Next validation gate

Before calling the product comprehensively validated, obtain subject-expert review of anatomical targets and new items, run a small voluntary classmate pilot, test real phone keyboards/NVDA/zoom/high contrast, exercise graphics/download failure recovery, compare local models on a fixed grading/tutoring corpus, and resolve the applicable source permission. These are open work, not passing claims hidden behind the automated-test count.
