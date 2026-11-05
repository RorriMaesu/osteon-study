# Make anatomy click · production notes

Released November 4, 2026. The main feature tour is **111 seconds**, 1920 × 1080 at 30 fps. The portrait companion is **35 seconds**, 1080 × 1920 at 30 fps. Both use H.264 video, AAC stereo audio, fast-start MP4, burned-in English captions and separate WebVTT files.

## What the tour demonstrates

| Time | Feature and practical instruction |
| --- | --- |
| 0:00 | Free A&P study in the browser; skeleton and muscle atlas |
| 0:09 | Rotate, zoom, double-click/tap into a region, repeat for one bone, Back |
| 0:24 | Toggle muscles without changing the current view; select a muscle; Peel |
| 0:36 | Turn on landmarks, select one marker, Show best view |
| 0:46 | Identify highlighted anatomy; a real spelling slip keeps credit; spelling review |
| 0:58 | OpenStax chapters 6–10, guided activity, exams, saved draft and Resume |
| 1:13 | Choose an installed Ollama model; a genuine tutor conversation |
| 1:27 | Practice history and the phone layout |
| 1:37 | Built by an A&P student as he learns, always growing; free invitation and link |

The 35-second teaser uses the opening, practice and closing narration with a separate portrait edit. It is a companion advertisement; the full tour contains the feature tutorials.

## Local voice and music research

Research checked November 4, 2026 against primary model repositories and the installed ComfyUI capabilities. Selection favored natural speech, a useful instrumental bed, a working local integration and this PC's **RTX 5060 Ti 16 GB**. There is no universal best voice or music model for every listener and computer.

- **Voice: [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS), 12 Hz 1.7B Base**, through the already installed [ComfyUI-Qwen-TTS integration](https://github.com/flybirdxx/ComfyUI-Qwen-TTS), version 1.0.7. A warm conversational adult female reference was previously created with Qwen3-TTS VoiceDesign from a written description. That synthetic reference was reused for consistent narration; no real person's voice or unrelated private saved voice was loaded. Nine short takes were generated at BF16 with SDPA, then paced at 0.92× while preserving pitch. All narration was local; Gemini was not needed. See the [official Qwen announcement](https://qwen.ai/blog?id=qwen3tts-0115).
- **Music: [ACE-Step 1.5 XL Turbo](https://github.com/ace-step/ACE-Step-1.5), 4B BF16**, using native ComfyUI nodes and [Comfy-Org's official split models](https://huggingface.co/Comfy-Org/ACE-Step-1.5). The official [XL workflow](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/audio_ace_step1_5_xl_turbo.json) informed the graph. Qwen ACE 0.6B + 1.7B text encoders keep memory requirements practical. The original 118-second instrumental generated successfully in 139.75 seconds on this PC. Settings: 112 BPM, D major, seed 20261104, eight Euler/simple steps, CFG 1, sampling shift 3. The prompt asks for clean, upbeat electronic educational music with no singing or spoken words.
- [Chatterbox Flash](https://github.com/resemble-ai/chatterbox-flash) was considered as another local speech option. [Fish Audio Drama3](https://huggingface.co/fishaudio/drama-3) was also reviewed; its substantially larger total model and different license made it a less convenient fit for this installed 16 GB production setup. These alternatives were not installed or used.

The ComfyUI server was bound to localhost. New models, caches, raw captures, voice takes, music, render intermediates and previous review cuts live on **M:**. The repository contains only the compressed delivery files and small supporting assets. Browser screenshots used a bounded temporary capture buffer on C:, transferred to M: with hash verification and cleared after transfer. No model downloads or render intermediates were stored on C:.

## Genuine demonstrations

The recording uses a separate local example origin, without the owner's public-site progress or private drafts. The captures show the app at revision `43c161f`. Models were not edited for this video.

The Sphenoid question was answered with `Spheniod` through the actual interface. The application returned credit and created the real spelling-review entry. The displayed 100% progress is explicitly based on **two example attempts**; it is not evidence of mastery, grade improvement or student outcomes. The exam draft contains one example matching response and was saved rather than submitted as a fictional exam result.

The tutor exchange ran through the app using installed Ollama model `qwen3.5:4b-q4_K_M`. It discusses sarcoplasmic-reticulum calcium release and the next connection to troponin. Neither reply was invented or redrawn. Response waits are shortened. Phone footage is a browser-viewport demonstration, and local inference ran on the recording PC. The video does not claim that Ollama runs inside the phone browser.

## Critique and revisions

1. **Capture review:** rejected a profile-heavy opening. Recorded frontal and gentle three-quarter skeleton and muscle shots. Chose the clear foramen magnum opening instead of an ambiguous small landmark.
2. **First full edit:** the muscle peel needed a closer view, sentence breaks produced awkward caption fragments, and navigation needed a clearer before/after cue. Added the actual pre-action views with editorial click cues, enlarged the peel, and regrouped captions into meaningful phrases.
3. **Second edit:** close crops included distracting fragments of control rows and tutor side-panel text. Refined the muscle crop, restored the complete practice frame and focused the tutor conversation on its message column. Reviewed the revised full-resolution stills and the portrait edit separately.
4. **Delivery checks:** decoded every frame of both final MP4s without errors. Verified exact duration, 30 fps, dimensions, captions, file sizes and hashes. The tour is about 9.4 MB; the portrait teaser about 4.6 MB. The mixed dialogue and music measured **−16.82 LUFS / −3.98 dBTP** for the tour and **−16.69 LUFS / −4.07 dBTP** for the teaser, with comfortable peak headroom. Music ducks under speech and fades at the end. All nine narration takes were checked against the script with local speech recognition. A separate music speech-recognition screen returned only “Music”; recognition is a screening aid and not proof that a track contains or lacks vocals.

The screenshots and source interface are sometimes enlarged for readability, so the smallest original labels can look softer than the editorial titles. Captures include crops, holds and cuts rather than an uninterrupted real-time session. The app's model-source gaps and accuracy limits remain documented in the atlas. Neither the video nor the app promises an exam score or complete certified anatomy.

## Reusable files

- [Narration transcript](PROMO-SCRIPT.md)
- [Voice API graph](promo-narration-api.json): uses the included [synthetic reference](voice-reference.wav). Put that file in ComfyUI's input folder, or update its LoadAudio input. The graph requires the installed Qwen TTS custom nodes and matching 1.7B model. It is API format, for submission to ComfyUI's local `/prompt` endpoint.
- [Music API graph](promo-music-api.json): requires the named ACE-Step XL diffusion model, 0.6B/1.7B text encoders and ACE 1.5 VAE. Official downloads and hashes are recorded in the production archive on M:; model binaries are not included in GitHub.
- [Delivery manifest and measurements](promo-manifest.json)
- [Sharing copy and component credits](PROMO-SHARE.md)

Earlier October demo files remain available under their original names. The README and demo page feature the November production.
