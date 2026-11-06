# Exam 3 mock: review and improvements

The original mock has a sound core: a course-grounded 44-question, 60-point form, faithful packet diagrams, explicit written rubrics, and a clear separation between pending points and wrong answers. This review found no confirmed anatomical key error in Form A or its nine diagram targets. The most consequential problems were in retakes, saved-report identity, grading transparency and the conversion of mistakes into usable study notes.

## Findings and implemented changes

| Finding | Why it mattered | Improvement |
| --- | --- | --- |
| A diagram reused in a short retake could receive a new visible number while its prompt retained the original target number. | The learner could be asked for target 34 while seeing a different marker. | Diagram targets retain their authored numbers; question position remains a separate navigation concept. |
| Reloading an older report could select the newest attempt. | Scores, answers and notes appeared to change because a different saved record opened. | Report routes include the attempt ID and restore that particular submission. |
| “New example” could open a verbatim copy of a written question. | Q43→BQ6 and Q44→BQ5 repeated the original prompts; repeated exposure could be mistaken for transfer to a new example. | Practice selection prefers unused, genuinely changed prompts. A repeated prompt is labeled as a repeat. |
| A partly reviewed written answer could contain known missed criteria yet disappear from missed-question practice because other criteria were pending. | A real study gap was hidden by unresolved points elsewhere in the answer. | Retakes include known missed points without treating unresolved components as wrong. A ranked study plan groups those gaps by course section. |
| Editing a proposed card note did not reliably survive navigation. | Work spent compressing a useful reminder could be lost before it reached the card. | Candidate text and the selected card side autosave alongside the learner’s other notes. |
| Manual rubric review offered only a checked/unchecked choice. | “I am unsure” became zero credit, making a provisional self-review look more certain than it was. | Each criterion offers met, missing or unsure. Unsure points stay pending. Visible review history distinguishes later revisions and learner confirmation from model review. |
| Character count was used as a proxy for notecard fit. | A line of 88 wide “W” characters visibly clipped despite its length being below the old warning threshold. | The planner measures rendered line width against the 5 × 3-inch print layout, identifies overflow and blocks printing until the affected lines are shortened. |
| Qualification could rely on stale fixture or model-identity information. | A prior check could be attributed to different installed weights or mismatched calibration evidence. | Qualification checks bind the actual model identity and the required current fixtures. Replacement weights or stale evidence cannot silently inherit the previous qualification. |
| The automatic AI-review preference was not part of the saved attempt. | A learner who opted out could resume later with a different effective choice. | The preference persists with the attempt, while earlier saved records remain compatible. |
| The coverage warning named substantial gaps but offered little direct practice for them. | A high Form A score could leave growth, development and structural distinctions under-practiced. | A separate 12-question wider-coverage set adds three questions per chapter. Direct study links and the ranked gap plan make the next step actionable. |

The submission review also provides links to flagged questions, so a learner can return to those items before locking the attempt.

## Content improvements and their boundaries

The new set samples growth-plate activity, appositional growth, bone classification, skull openings, spinal curves and discs, elbow and ankle relationships, limb rotation, wrist classification, friction-reducing structures and joint development. These are additional textbook-based retrieval questions, not new evidence of what the instructor will select.

Each new item has a distinct ID, one defensible objective key, plausible anatomical contrasts, a source section, an explanation and a concise note suggestion. Its source metadata explicitly labels it as a textbook extension. See [the authored bank](src/mock-exam3-wider-bank.js). Representative primary references are OpenStax [bone development](https://openstax.org/books/anatomy-and-physiology-2e/pages/6-4-bone-formation-and-development), [the vertebral column](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-3-the-vertebral-column), [appendicular development](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-5-development-of-the-appendicular-skeleton), and [synovial joints](https://openstax.org/books/anatomy-and-physiology-2e/pages/9-4-synovial-joints).

Some legacy multiple-choice items have conspicuously weak distractors. Examples include treating matrix components as cells or presenting obviously incompatible joint categories. However, the correct answer is uniquely longest in only 8 of the 30 multiple-choice items, so this review does **not** support a claim of a systematic longest-answer shortcut. Improving those old questions in place would change the meaning of saved submissions. All **61 previously released question snapshots**—44 Form A questions and 17 rotations—remain unchanged, including their keys and written rubrics. Future revised full forms should use new question identities.

## Verification checkpoint

**279 automated tests and 13 focused browser regression flows pass**, along with the full original exam walkthrough and ten storage/recovery browser checks. The review includes real rendered notecard measurements and saved-attempt navigation, rather than relying only on source inspection. A suspected mobile scrolling defect was investigated and **not reproduced**; the existing mobile page remained usable, so no speculative scrolling fix was added.

Four new wider-content tests verify the released snapshot fingerprint, the 12-point blueprint, important anatomical contrasts, and the actual save/restore/submit/scoring lifecycle. Focused content, core and grading checks pass. The production build passes. A real localhost browser-to-Ollama run still returns the expected 59/60 from the prepared complete ossification answer and names-only knee answer. The live-site check follows deployment of this revision.

Versioned diagram scoring now accepts approved correct contextual wording for all nine targets. Tests reject incorrect parent bones, contradictions and alternatives, including an attempted AI override; unknown context stays pending for meaning review. The actual previous-release 44-question backup still loads at **56/60**, with its note and both 24-line card sides intact. New attempts use the improved scoring policy; historical grades and original outcomes remain unchanged.

## Remaining limits

- Form A remains a finite practice sample based on earlier exams and course evidence. It does not predict exact questions or provide the instructor’s official grading policy.
- The 12-question extension samples disclosed gaps; it does not exhaust the required landmark list, every movement pair or every chapter objective.
- Passing a model’s prepared grading cases is bounded evidence, not a guarantee that it will judge every future answer correctly. Pending points and explicit human review remain necessary.
- Printed line measurements apply to the supplied card layout. They cannot guarantee the space required by an individual’s handwriting.

See [the main mock documentation](MOCK-EXAM-3.md) for the original format, source provenance, qualification scope and recovery procedures.
