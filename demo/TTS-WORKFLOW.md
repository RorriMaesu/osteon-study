# Osteon's local narration workflow

The demo uses a designed **warm, conversational adult female voice** with a natural American English accent. It was generated locally in ComfyUI, using Qwen3-TTS VoiceDesign 1.7B to create a synthetic reference, then Qwen3-TTS Base 1.7B to keep the narrator consistent across short takes. No real person's recording was used.

[Download the editable ComfyUI workflow](osteon-voice-workflow.json) · [Full eight-take API graph](osteon-narration-api.json) · [Narration script](NARRATION-SCRIPT.md) · [Rendered narration WAV](osteon-narration.wav) · [Social narration WAV](osteon-social-narration.wav) · [Synthetic reference WAV](voice-reference.wav)

## Use it in ComfyUI

1. Open your existing ComfyUI. Drag `osteon-voice-workflow.json` onto the canvas, or open it from the workflow menu. The compact graph has numbered steps and previews for the reference and finished take.
2. In **3 · Edit the narration text**, paste one short section from the script. Keep **1.7B**, **cuda**, **bf16**, **English**, and **sdpa** for the tested NVIDIA setup. Keep the seed fixed for consistent revisions.
3. Click **Run**. Preview or save the audio from **4 · Preview / save your take**. Each run saves a new numbered file. Change the text and run again for another section.

The graph requires [flybirdxx/ComfyUI-Qwen-TTS](https://github.com/flybirdxx/ComfyUI-Qwen-TTS), tested with node version **1.0.7**, plus the Qwen3-TTS 12Hz **1.7B-VoiceDesign**, **1.7B-Base**, and **Tokenizer-12Hz** model folders under ComfyUI's `models/qwen-tts/`. These were already installed on the production machine. No shared packages or existing workflows were replaced for this demo.

The reference branch creates a new synthetic voice from the written style instruction. The Base branch reuses that reference; it does not load a private saved voice. The full API graph reproduces the eight short production takes. The compact workflow is intended for convenient editing, not an exact recreation of video timing.

The script uses normal spelling. Generation text uses **Oss-tee-on** as a pronunciation aid for **Osteon**. Edit the spelling if your model pronounces the brand differently. Check technical terms and listen to each take before sharing. Fixed seeds help reproducibility but do not guarantee identical output across hardware or package versions.

## Why this model was chosen

Research checked on **October 19, 2026**. “Most natural” is subjective; this is a practical production choice for the available installation rather than a universal quality ranking.

| Candidate | Evidence and fit | Decision |
| --- | --- | --- |
| **Qwen3-TTS 1.7B VoiceDesign + Base** | Natural-language voice design and reference reuse; Apache-2.0 models. Already installed and successfully generated all narration on an **RTX 5060 Ti with 16 GB VRAM** using bf16/SDPA. About 5.4 GB total GPU memory was observed during the reference run; this is a snapshot, not a measured peak. | Used for the final demo. |
| **Fish Audio Drama 3** | Newer generation with a 35B-parameter mixture-of-experts backbone, 3B active per token. Active parameter count is not the resident model size. The official serving examples target larger GPU setups. | Its released configuration is a poor fit for this 16 GB production setup; quantized/offloaded variants were not tested. |
| **Fish Audio S2-Pro via ComfyUI-FishAudioS2** | The wrapper lists 24 GB full precision, 20 GB FP8, 18 GB INT8, or 16 GB NF4. The latter leaves little headroom for the browser and other models. | A possible future audition, with extra dependencies and a separate license review; not installed or benchmarked here. |
| **Chatterbox Flash** | A current speed-focused alternative from Resemble AI. | Not installed or compared by listening in this production environment. |

Primary references: [Qwen model card](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign), [Qwen official repository](https://github.com/QwenLM/Qwen3-TTS), [Fish Drama 3 model card](https://huggingface.co/fishaudio/drama-3), [S2 ComfyUI integration and memory table](https://github.com/Saganaki22/ComfyUI-FishAudioS2), [Chatterbox Flash official repository](https://github.com/resemble-ai/chatterbox-flash). Memory estimates from another project's documentation are not measurements on this machine.

## Production and checking

The seven tutorial takes were paced to 90% of their generated speed; the social take uses 94%, with pitch preserved. Speech was normalized toward −16 LUFS and encoded as AAC in the MP4s. The separate 48 kHz mono WAVs preserve the final pacing and pauses. There is no music.

Local Whisper transcription checked for missing wording and technical terms, and supplied word timings for captions. This verifies transcription consistency, not voice naturalness or independent anatomical correctness. Real browser footage shows the **foramen magnum**, an actual practice answer, and a genuine **gemma4:12b** Ollama conversation. Tutor inference was run separately from speech generation to preserve GPU headroom. Edits shorten waits and hold some frames for reading; no reply or score was fabricated.

The narrated walkthrough is about 66 seconds, and the vertical edit about 23 seconds. Both include English VTT captions; the vertical edit also has speech captions over app scenes and equivalent opening/closing card text. The full transcript is on the demo page. See [media-manifest.json](media-manifest.json) for provenance, timings and file hashes, and [SHARE-COPY.md](SHARE-COPY.md) for component credits and sharing terms.
