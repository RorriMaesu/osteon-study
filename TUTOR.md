# Your local anatomy tutor

Open **Socratic tutor** in the bottom corner of the atlas. The tutor runs inside the website and talks directly to Ollama on your own computer. No extra server, extension, Node, Python or paid AI account is needed.

## First connection

1. In **Connect**, confirm your operating system and download the official Ollama installer if needed. Open the downloaded installer yourself.
2. Choose **Open Ollama**, or open it from your applications menu. The browser app handoff is supported by Ollama on Windows/macOS; it cannot guarantee a hidden launch.
3. Choose **Connect to Ollama**. The website tries the two standard loopback addresses. Allow this site's local-network permission if your browser asks.
4. If connection fails, expand **Can't connect? One-time setup**. Ollama must allow the origin `https://rorrimaesu.github.io`. The downloadable Windows setup adds that exact origin to your user settings and starts Ollama on loopback; quit an already running Ollama instance before running it. Manual instructions are also included. The macOS helper applies settings to the current login session. Linux users should follow the linked official service configuration instructions.
5. In **Device & models**, select an installed local chat model. Embedding-only models, cloud-backed models and models whose local metadata cannot be verified are unavailable.

The connection check cannot distinguish “not installed,” “not running,” blocked website access and blocked browser permissions from a failed browser request. It therefore says **Can't connect**, with recovery steps.

## Choose a model

**Detect available hardware** reports what your browser exposes: GPU identifiers, logical threads and approximate/bounded RAM. It cannot read exact VRAM. Enter known RAM/VRAM totals or import the optional Windows hardware report to improve the estimate. The report omits account names, serial numbers and machine identifiers. Exact NVIDIA dedicated memory is read when its driver utility is available; other GPU memory may be unknown. Apple unified memory belongs in the RAM field.

The fit suggestion reserves memory for context and the 3D atlas. Use **Run a short model test** with the atlas open to measure initial load, first text and generation speed. GPU allocation from Ollama's running-model API describes that model's allocation, not the GPU's total VRAM. Passing a short test does not guarantee long-session performance or factual accuracy.

Optional Qwen 3.5 downloads show approximate disk/network sizes and require an explicit click. Downloads stream progress and can be canceled/retried. Model licenses and current sizes are linked to the official library. Installed models are preferred; no model is downloaded automatically.

## Learn with it

Select an atlas structure, open a lesson, read a textbook page or enter a practice question. The tutor receives that learning context. Ask for a small hint, a question, feedback on your reasoning or a direct explanation. Relevant excerpts are retrieved locally from the supplied textbook; source buttons open the actual page in the suite.

AI output appears as text, never executable code or arbitrary links. Source buttons are generated from the application's own reading records, not model-generated destinations. The provided readings do not certify every generated claim. Limited checks replace known misleading PTH, fontanelle-fusion and ambiguous styloid-process replies with course notes. These checks are not a general factual verifier. Check unfamiliar explanations against the source, especially with small models.

Using tutor help marks the current unanswered spatial, complete-course or concept-quiz attempt as **assisted before generation begins**, even if the reply is stopped or fails. AI never awards objective points or mastery. Chat is saved separately in this browser; **Clear chat** leaves study progress intact.

## Privacy and practical limits

The app makes AI requests only to `127.0.0.1:11434` or `localhost:11434`, without account credentials or a cloud fallback. Model metadata is checked before use to reject cloud-backed aliases. Choosing a local model is essential because a local Ollama server can otherwise proxy cloud models. Model downloads contact Ollama's registry. Study content and app assets are hosted on GitHub Pages. Chat history stays in local browser storage and is sent to the selected local model as conversation context.

Browsers cannot silently install applications, run arbitrary background commands or read exact cross-platform VRAM. This release uses official downloads, the supported app handoff and an optional user-run native check. No public server bind, tunnel, wildcard origin or permanent browser-security exception is needed.

Official references: [Ollama FAQ](https://docs.ollama.com/faq), [downloads](https://ollama.com/download), [chat API](https://docs.ollama.com/api/chat), [installed models](https://docs.ollama.com/api/tags), [model allocations](https://docs.ollama.com/api/ps).


## Conversation and navigation refinements

Your unfinished question is saved in this browser and survives moving between tutor tabs, closing the drawer and refreshing the page. Enter sends a typed question; Shift + Enter inserts a line break. An empty Send does nothing; the three guided prompt buttons remain available for a new question. After a stopped or failed reply, **Edit question and retry** restores the original question without sending it automatically.

Replies show the model that generated them. Click an inline source reference to open the actual textbook page, or expand **Read the source excerpts** to inspect the passages supplied to the model. A reference number that was not supplied stays plain text and is flagged. Old reference numbers and interrupted drafts are excluded from the next model request's source context. Short follow-ups can use the prior question's subject; selecting another region, lesson or question updates the learning context.

Device details and supplied memory values are saved locally. A later browser hardware check keeps exact memory values you already supplied. Model fit suggestions reserve space for the atlas and context, prefer a fuller GPU budget when it fits, and favor smaller models for CPU use. They do not rank factual accuracy. Test results and download status survive moving between tutor tabs during the current visit. Downloads are marked ready only after installed-model verification succeeds.

Skeleton divisions can be selected directly in both practice setup screens. Incompatible regions are disabled. Colors used for exploration return after a scored anatomy session, and the atlas restores its own region view when you return. The Joints explorer includes appendicular bone context and enables course tissues instead of displaying an empty specimen.

On phones, the full-screen tutor keeps keyboard focus within its controls. Opening a source reference closes the drawer and displays the selected reading; reopen the tutor to continue your saved conversation.
