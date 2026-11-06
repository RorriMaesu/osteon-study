# Exam 3 mock

[Open the mock ↗](https://rorrimaesu.github.io/osteon-study/#exam3)

The mock turns the supplied chapters 6–9 course evidence into a fixed practice examination, then connects missed points to sources, tutor discussion and personal notes. Find it in **Practice lab → Exam center → Exam 3 mock**. The existing broad chapter and cumulative exams remain available.

## Form A and its evidence

| Section | Questions | Points |
| --- | ---: | ---: |
| Multiple choice | 30 | 30 |
| Actual packet diagram identification | 9 | 18 |
| True/false | 3 | 6 |
| Written explanations | 2 | 6 |
| **Total** | **44** | **60** |

Chapter point totals are **6: 19; 7: 12; 8: 15; 9: 14**. Form A's written explanations compare ossification pathways and explain the course's traditional lateral-knee injury sequence. The counts and weights deliberately borrow from the complete Exam 2; they are an authored practice design, not a forecast of Exam 3's actual format.

The question bank cites the 21 distinct Quiz Show topics, seven Bone Questions, required bone/landmark material, labs, clinical scenarios and OpenStax sections. All 21 review topics are mapped, but two joint classifications share Q24. Q35 changes whole-scapula recognition into a glenoid target in a posterior view; Q32 does not separately assess parietal laterality. Those relationships are not advertised as exact repeats or independent probability estimates.

The [content bank](src/mock-exam3-bank.js) contains all keys, explanations, source locators, controlled diagram aliases and note suggestions. Its 17 targeted rotations include the seven Bone Questions plus ten changed-example questions. The broader section/landmark lists remain study requirements: a perfect score on this finite form does not establish complete readiness. Week 11 content and detailed muscle-name testing are outside this mock's stated scope.

## Taking the mock

Choose closed notes or use of your permitted 3 × 5 card. Timing is optional: the goal is a guide, not an enforced instructor time limit. Answers autosave in this browser, and questions can be flagged or revisited before submission. All nine packet assets must load before the complete form starts.

Answers and corrective feedback appear after submission. Source or tutor help during an active question is marked as assistance; this status is separate from points. Submission locks the original responses before grading begins. Canceling a model request, leaving the results or reloading does not turn a saved submission back into an editable attempt. Retakes create separate records.

## Grading and pending points

- Multiple choice uses a verified key and awards 1 or 0.
- True/false awards 2 or 0. An unasked correction is not an additional scoring requirement.
- Diagram identification awards 2 or 0 for the requested structure and approved aliases. Conservative spelling support distinguishes clear spelling errors from neighboring structures. Unresolved wording can await local review.
- Each written question has an explicit three-point rubric with atomic half-point or one-point components. Half points are the mock's stated practice policy; the available exams do not establish the professor's complete marking policy.

The local model judges the supplied written components and quotes exact evidence from the locked response. Application code validates the component IDs, allowed decisions and quotations, then calculates the score. The model cannot invent a point total, silently add requirements or change the submitted wording. Diagrams use authored target maps; the model is not asked to recognize the image.

A blank answer is a known zero. A missing connection, malformed reply, unsupported model or uncertain interpretation leaves the affected points **pending**, not wrong. The report shows confirmed earned points and the possible final range. For example, 43 earned with six pending means **43–49/60**, not a final score of 43/54. Pending diagram points also contribute to that range.

Use **Compare & confirm rubric myself** to inspect a written response against its component descriptions. A saved confirmation is clearly labeled **learner-confirmed**, separate from an AI estimate or an instructor grade. Unchecked components receive zero. Grade history preserves earlier reviews and the original response.

## Local Ollama qualification

The mock shares the Socratic tutor's local connection and model selection. A successful connection test establishes that a model responds; it does not qualify that model to grade a written rubric. **Check grading model** runs hand-authored examples for the actual unqualified questions in the submitted attempt. A model qualifies only when its component decisions match all required cases for that rubric.

The November 6, 2026 release includes these bounded checks for the exact installed `gemma4:12b` model:

| Rubric scope | Recorded check | Automatic written grading |
| --- | --- | --- |
| Form A Q43/Q44 | **20/20** cases matched, including four held-out cases | Qualified for these two questions |
| BQ1, BQ3, BQ4, BQ5, BQ6, BQ7 rotations | Three cases per rubric matched: complete, partial and contradicted | Qualified for each listed rotation |
| BQ2 cartilaginous-joint comparison | No passing qualification is bundled | Points remain pending until a passing check or learner confirmation |

The record is tied to the endpoint, exact model identity/digest, grading prompt, question/rubric identities and fixture identities. The bundled record uses `http://127.0.0.1:11434` and model digest `4eb23ef187e2c5462566d6a1d3bbbc2f1346d0b4327cbb66d58fffbcc9b2b05c`. A different model, changed weights, changed rubric or different untested question does not inherit qualification. Model changes do not silently rewrite previous grades. See the [qualification records](src/mock-exam3-qualified-models.json) and [grading implementation](src/written-answer-judge.js).

There are **41 authored calibration cases** in total: 20 for Form A and 21 across the seven BQ rotations. They include concise answers, missing mechanisms, paraphrases, spelling errors, contradictory claims and instructions attempting to alter grading. Passing this finite set is useful evidence, not a statistical guarantee or proof of teacher-equivalent judgment.

Requests use the existing loopback-only Ollama transport and local-model checks. Nothing automatically downloads a new model or changes the learner's selection. A runtime connection or origin error remains visible and recoverable. **Live GitHub Pages → local Ollama grading was verified in Chrome 156 with loopback access allowed for this site in an isolated browser.** The hosted run produced the expected 59/60 total from synthetic answers, with a full-credit ossification answer and 2/3 for the names-only knee answer. Without browser permission, the connection was blocked and all six written points remained pending. Allow the browser’s loopback/local connection prompt when using the tutor setup; see [Chrome’s connection-permission guidance](https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access). A cold first load can require a retry or the setup screen’s longer-wait option.

## Corrections and the notecard

The report filters missed/assisted answers, pending grades, written reasoning, saved notes or all questions. Each correction includes the original response, accepted answer, point breakdown, authored explanation and source links. Diagram review reveals the checked target on the same course figure. **Work through it with tutor** supplies the selected mistake and verified context to the existing tutor.

Personal notes separate **What I confused**, **The rule or mechanism**, and **A question to ask myself later**. An editable note candidate can be added to either side of the card; duplicate text is detected across both sides. The planner has exactly **24 front slots and 24 back slots**. Lines can be edited and reordered, exported as copy text or previewed/printed at 3 × 5 inches. Long-line warnings are fit guidance; character count cannot guarantee the space needed for handwriting. Earlier standalone notecard files are not replaced.

Related-question practice uses vetted content. An immediate repeat, an assisted answer or reading a correction is study activity, not proof of independent mastery.

## Saved work and recovery

Mock attempts, locked answers, reviews, personal notes and card lines stay in browser storage. Up to 20 completed reports are retained alongside one unfinished attempt. Use **Export mock & notes** for a dedicated JSON backup or the complete Osteon backup to include this work with other study records. Score/evidence JSON and readable study-note exports are also available. Restoring a dedicated mock backup replaces only mock records after confirmation; it does not replace ordinary chapter exams.

Imports validate question snapshots, answer identity, rubric evidence and note/card limits. Invalid data is rejected before replacement. An unreadable earlier browser record is preserved, and starting fresh offers a download of that original record for recovery. Storage failures are reported rather than displaying a false saved state. If submission cannot be saved, keep the tab open, export the recovery backup, free storage and retry saving; AI review waits for a successful save. A reload before recovery can restore the earlier draft.

Submitted responses and grade revisions remain separate from later note editing. Future bank/schema changes must preserve compatible history or offer recovery; they must not silently apply new keys to old answers.

## Packet diagrams and credits

The contributor explicitly authorized use and publication of all supplied diagrams. The nine assets are cropped original packet photographs with SVG masks/clipping to conceal labels and numbered markers for the assessed targets. No generated anatomical linework ships. Source-specific credits accompany the figures; the Pearson/Benjamin Cummings histology panel is not mislabeled as OpenStax.

The [asset manifest](assets/mock-exam3/manifest.json) records source pages, hashes, crops, orientation, masking and target coordinates. See [full diagram credits](CREDITS.md#exam-3-course-packet-diagrams). Raw annotated pages and personal filesystem paths are excluded.

## Validation and maintenance

At this documentation checkpoint, **261 automated tests pass**. They cover the new 44/60 blueprint and chapter totals, key/alias distinctions, weighted and pending arithmetic, atomic rubrics, stale or malformed reviews, learner confirmation, frozen submissions, diagram assets, saves/backups, notecard capacity and existing application regressions. All nine rendered packet targets were inspected against the supplied sources. Isolated Chrome checks passed on desktop and a 390-pixel phone viewport: full navigation, reload/resume, weighted scores, frozen responses, notes, 48 card slots, exports, targeted practice and no horizontal overflow or page errors. A real browser-to-Ollama run from localhost graded both Form A explanations and produced the expected 59/60 total, including 2/3 for the names-only knee answer. Build and the content audit pass. The same full desktop/mobile walkthrough also passed on the deployed GitHub Pages site. The live hosted-origin Ollama check passed as described above. Ten additional browser checks verified storage-quota failure, exact-byte recovery of unreadable data, download-before-reset behavior, save-before-grading, and preservation of pending points after a failed request. These runs used isolated browser storage and synthetic responses.

Focused suites are `tests/mock-exam3-content.test.mjs`, `tests/mock-exam3-core.test.mjs`, `tests/mock-exam3-store.test.mjs`, the written-review tests and the packet-figure tests. Run the repository's tests, content audits and build before publishing. Keep `app.js` and generated version references in sync with source changes, since GitHub Pages serves the built application.

Core implementation files are [the content bank](src/mock-exam3-bank.js), [session/scoring core](src/mock-exam3-core.js), [local written reviewer](src/written-answer-judge.js), [UI](src/mock-exam3-ui.js), [storage](src/mock-exam3-store.js) and [packet figure renderer](src/mock-exam3-figures.js). Update keys, rubric versions, qualification fixtures and coverage metadata together when changing scored content.
