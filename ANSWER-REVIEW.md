# Local AI answer review

1. Open Practice lab or the Exam center and turn on **Local AI answer review**. It is optional and starts off.
2. Choose **Models & connection → Connect & refresh models**. Select an installed local Ollama chat model. The reviewer initially uses the tutor's preferred model where available, or a small installed local model.
3. Submit your answer normally. The review explains spelling, meaning and relevant anatomical distinctions. The first response can take longer while Ollama loads the model; **Use answer key instead** cancels the wait.

The existing Ollama setup guide remains available from the connection dialog. No additional application or account is required. Requests go only to `127.0.0.1` or `localhost`; remote/cloud model aliases are excluded. On a phone, the same-device local-service requirement still applies. The website cannot reach a separate desktop computer's Ollama through its own loopback address.

## What is judged

- Typed anatomical names and concept answers can receive credit for a clear minor spelling error or unambiguous equivalent meaning. Examples: `femurr` for **femur**, or **head of the thighbone** for **head of femur**.
- A different known structure, a parent bone in place of a requested landmark, an opposite side, an incorrect count, or an ambiguous list of alternatives is not treated as a spelling correction.
- Clicked 3D targets, multiple-choice selections, matching and ordering keep their answer-key score. AI can explain the submitted response and its relationship to the source answer.
- Practice gives review after each submitted answer. Chapter/cumulative exams wait until final submission before reviewing typed answers, preserving delayed feedback. Unanswered questions stay incorrect.
- The reviewer never downgrades an exact accepted answer. Uncertain, unreadable, interrupted or unavailable AI reviews retain the answer-key result. You can finish with the key for remaining questions or save a submission review and return later.

The model receives the question, accepted answer, learner's submitted response and relevant course/source context. It returns constrained JSON, which the browser validates. Known anatomy distinctions and response binding are checked in the app; an AI suggestion for another question cannot change the current grade. These checks reduce mistakes but do not establish general model accuracy.

## Your study record

AI grading after submission is distinct from getting a hint before answering. Prior hint/source/tutor use remains assisted. Every saved AI review retains the original response, strict answer-key result, local model, explanation and decision. Exam reports distinguish spelling/meaning acceptance from exact matches; progress and bone-list result exports retain the evidence. Turning AI off does not silently rewrite completed results.

Model explanations can still be wrong. The standard answer and source reading remain available for comparison. Different models can make different judgments; a smaller local model is often faster, while model size alone does not establish accuracy.

Implementation follows [Ollama's structured-output documentation](https://docs.ollama.com/capabilities/structured-outputs) and [chat API](https://docs.ollama.com/api/chat). No model weights or private study history are published with the website.
