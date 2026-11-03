# Spelling support and local AI answer review

## Chapter, cumulative and section exams

Built-in support is always on for **new** chapter/section exams and full-bank review. It requires no Ollama connection. Capitalization, punctuation, accepted synonyms, appropriate singular/plural forms, clear unique spelling errors, and curated equivalent wording receive credit. Each of the 63 typed/identification questions has an explicit policy. Counts require the right group and unit; bone sets require every distinct member; a formal-name question still requires its anatomical term.

For example, `fmeur` receives Femur credit with a spelling note; `seven tarsal bones` receives equivalent-wording credit for 7. Ilium/ileum, osteoblast/osteoclast, opposite sides, changed counts and vague parent structures are not automatically treated as typos. Ambiguous spelling or plausible wording can remain **Meaning needs review**. A finite dictionary and conservative rules do not resolve every possible response.

The results show confirmed correct answers, pending meaning reviews, spelling notes and equivalent wording separately. A pending answer has no awarded point yet, but is not a confirmed mistake or an anatomy-failure attempt. The report states the maximum score if pending answers are accepted. Exports use `correct: null` for pending answers and retain the original response, strict key comparison, grading version and first submitted outcome.

Full exams keep feedback hidden until submission. Section/full-bank practice gives feedback when checked. Unanswered questions receive zero; all parts of matching and ordering must be correct. Clearing an answer removes it from the complete-answer count while the draft remains saved.

## Post-test spelling practice

Choose **Practice spellings** in a result report, or **Spelling review** in the Exam center for due words. Compare your entry with the standard spelling, see the changed letters, then choose **Hide & try from memory**. Correct retrieval returns on a later day; another miss or **Review later** schedules the word sooner.

Spelling practice is a separate learning record. It does not edit submitted answers, increase the exam score, or add failed anatomy attempts. The original entry and review history survive progress backup/restore. Due dates are simple study reminders, not a validated measure of mastery.

## Optional local meaning review

1. Turn on **Local AI answer review**. If setup is needed, the shared local AI guide opens over your exam. Choose an installed model or explicitly download one, test it, then choose **Return to my exam**. **AI ready · Settings** manages the shared model; **Check local AI** in the Exam center also checks readiness.
2. New exams send only unresolved typed wording for local review. Clear built-in spelling corrections and known errors do not require generation. Chapter/cumulative reviews run after final submission; section practice can review when checked.
3. If a review is canceled, unavailable or uncertain, the answer stays pending. You can finish the exam and use **Meaning review → Review original wording with local AI** later. **Leave answer pending** cancels a running review.
4. A successful retry judges the fixed original response, updates its score and records the resolved anatomy attempt once. Previous review evidence and the first submitted outcome remain in the exported session. Seeing the key and practicing a corrected answer never replaces the original response.

The reviewer reuses the existing Ollama setup. Requests go only to `127.0.0.1` or `localhost`; remote/cloud model aliases are excluded. No extra application or account is required beyond Ollama. On a phone, loopback reaches that phone, not a separate desktop computer.

AI receives the question, source key, answer policy, submitted response and bounded course excerpts. Structured output is validated and bound to that specific response and key. Known distinctions in the question policies cannot be waived by an approving model. These checks reduce mistakes; model judgments and explanations can still be wrong. Review the standard answer and source material when a decision seems questionable.

## Other practice modes and earlier results

The BI 231 bone-list test, 3D identification and supplementary concept practice retain their existing optional local AI review. Clicked targets, multiple-choice selections, matching and ordering retain their answer-key scoring. In these earlier flows, canceled or uncertain AI reviews retain the key result; the new pending-score and spelling-deck workflow applies to the chapter/section exam interface.

Previously completed exams and drafts from the immediately preceding identical-key release keep their original grading rules and scores. The report identifies them as earlier exams. Records with older changed keys remain available for export rather than being silently regraded. Start a new exam to use built-in spelling support.

AI grading after submission is separate from hints before answering. Prior source/tutor assistance remains recorded. No model weights or private study history are published with the site. Implementation follows [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs) and the [chat API](https://docs.ollama.com/api/chat).
