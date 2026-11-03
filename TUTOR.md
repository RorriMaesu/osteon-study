# Your local anatomy tutor

Open **Socratic tutor** in the top navigation. Osteon stays in your browser and talks directly to Ollama on the same computer. No extra installed server, extension, Node, Python, subscription, or AI account is required.

## Guided setup

1. Open the tutor. Osteon checks Ollama and installed local model weights. Allow the browser to connect to this computer if asked.
2. If Ollama cannot be reached, choose **Open Ollama**, **I need to install Ollama**, or **Ollama is open but cannot connect**. Only the relevant instructions are shown. A failed request is not proof that Ollama is missing or stopped.
3. If a verified model is already installed, setup skips the installer and download. Otherwise choose one download, with its approximate size shown before you click. The smaller option is the starting suggestion when memory is unknown.
4. Choose **Test and finish setup**. Only a complete, nonempty response makes the model ready. Inspect the sample response if desired, then choose **Start studying** or **Return to my exam**.

The primary next action stays pinned below the instructions on short laptop and phone screens. Setup instructions no longer use the desktop content pager. Advanced instructions can scroll without moving that action away. Returning users reconnect and briefly retest a previously working model after a page reload; changing model weights invalidates that saved test identity. Opening an already-ready tutor in the same visit returns directly to chat.

## Windows setup assistant

The optional [Windows assistant](setup/osteon-setup-windows.ps1) consolidates installation, website access, startup, and hardware reporting. Download it, right-click it in Downloads, and choose **Run with PowerShell** (possibly under **Show more options** on Windows 11). Type **SETUP** to proceed, or **HARDWARE** for a report only.

The assistant:

- Finds Ollama in its normal install directories or command path before offering installation.
- Downloads only the official Ollama installer when needed and requires a valid Authenticode signature whose publisher identifies Ollama before opening it. The installer remains interactive.
- Backs up changed user settings under `%LOCALAPPDATA%\Osteon\setup`, preserves existing website origins, adds `https://rorrimaesu.github.io`, and binds Ollama to `127.0.0.1:11434`.
- Asks before stopping Ollama processes belonging to that installation and Windows session. It does not stop an unrelated process occupying the port. Current Ollama conversations are interrupted by an approved restart.
- Starts Ollama in the background, checks its API, and opens Osteon to finish browser/model verification.
- Returns only RAM, GPU description, reliable NVIDIA VRAM when available, thread count, and available model-disk space. Unknown measurements stay unknown. No serial numbers, account names, or unique machine identifiers are included.

The report is placed in the URL fragment, which is not sent to the GitHub host, and removed when Osteon reads it. It is validated as untrusted data and cannot mark AI ready. No manual report import is needed in the browser/profile opened by the assistant. Keep an exam's original tab open; its answers stay intact. The report can propagate to another Osteon tab in that same browser profile.

`-CheckOnly` reports installation/running/hardware information without changing settings, installing, restarting, saving a report, or opening a browser. `-HardwareOnly` returns the hardware report without changing Ollama. `-Undo` restores the latest changed-settings backup; restart Ollama afterward. Repeating an unchanged setup does not replace the backup.

The assistant is source-distributed PowerShell, **not a code-signed executable**. Managed computers or Windows download policies may block it. Use the manual instructions in **Advanced settings & manual connection steps** in that case. The app does not change execution policy, bypass warnings, install a certificate, request elevation, or disable browser/OS protections.

## macOS, Linux, and phones

macOS uses Ollama's official disk image and an optional [connection assistant](setup/osteon-setup-mac.command). Open Terminal, type `bash ` with a trailing space, drag the downloaded file into the window, and press Return. The assistant preserves origins, saves the previous values, requests a normal Ollama quit/reopen, and returns to Osteon. Settings apply to the current login session; repeat after logout if needed. A native, signed Mac installer wrapper is not included.

Linux links to Ollama's official installation steps and explains its systemd environment settings. Setup does not assume it can change a managed service without the user's involvement.

Phones/tablets show a desktop requirement instead of offering a desktop installer. The atlas, lessons, exams, and built-in spelling support still work without local AI. This release does not connect a phone to a separate computer or expose Ollama to a network.

## Models and optional hardware

Choose an installed local text-generation model or **Download a different model**. Download choices are **Smaller download**, **Balanced**, and **More demanding**, with model names and sizes. Only an explicit download click starts a pull. Progress identifies the current download part, rather than presenting one layer's percentage as the whole download. Cancel/retry can reuse parts Ollama has already fetched. After downloading, installed weights are verified and a model response still needs testing.

Hardware checks are optional. A browser check provides only exposed GPU information and approximate/bounded RAM; exact VRAM is not available through that check. The Windows assistant has a report-only mode and automatic handoff. Manual memory entry and older report imports remain under an advanced disclosure. Apple unified memory is shared RAM.

Suggestions reserve room for context and the atlas. They do not rank factual accuracy. The short sample checks response delivery and reports elapsed and first-response time. It stops after 60 seconds without a complete reply. If loading is slow, choose a smaller installed model or explicitly allow a two-minute test. It does not guarantee long-session speed, memory use, or correct anatomy.

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

Device details and supplied memory values are saved locally. A later browser hardware check keeps exact memory values you already supplied. Model fit suggestions reserve space for the atlas and context, prefer a fuller GPU budget when it fits, and favor smaller models for CPU use. They do not rank factual accuracy. Test results and download status survive moving between tutor tabs during the current visit. Downloads become available only after installed-model verification; ready status additionally requires a completed response.

Skeleton divisions can be selected directly in both practice setup screens. Incompatible regions are disabled. Colors used for exploration return after a scored anatomy session, and the atlas restores its own region view when you return. The Joints explorer includes appendicular bone context and enables course tissues instead of displaying an empty specimen.

On phones, the full-screen tutor keeps keyboard focus within its controls. Opening a source reference closes the drawer and displays the selected reading; reopen the tutor to continue your saved conversation.

## Answer review in Practice lab

The optional **Local AI answer review** control shares the tutor’s connection, selected model, and readiness state. **Set up local AI** opens the same guide over the exam; **Return to my exam** restores the learning workspace. Enabling AI grading remains a separate choice. It judges submitted meaning and spelling and explains corrections. Review after submission is distinct from tutor/source assistance before answering. Full chapter exams defer AI review until final submission. See [the answer-review guide](ANSWER-REVIEW.md) for scoring, saved evidence, cancellation and fallback behavior.
