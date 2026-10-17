import { getLearningContext } from "./learning-context.js";
import { sanitizeConversation, citationParts, CHAT_LIMIT } from "./tutor-state.js";
import { checkTutorReply } from "./tutor-checks.js";
import { OllamaClient, endpoints, localModelProblem } from "./ollama-client.js";
import { detectOS, browserHardware, validateHardware, mergeBrowserHardware, recommendModels, memoryValues, modelFit, downloadModels } from "./hardware.js";
import { buildTutorMessages } from "./tutor-context.js";
const CHAT_KEY = "osteon-tutor-chat-v1", PREF_KEY = "osteon-tutor-model-v1", DRAFT_KEY = "osteon-tutor-draft-v1", ADDRESS_KEY = "osteon-tutor-address-v1", HARDWARE_KEY = "osteon-tutor-device-v1";
function initTutor({ escape: e, toast }) {
  const $ = (s) => document.querySelector(s);
  let client = new OllamaClient(), connected = false, version = "", models = [], choice = "", tab = "connect", busy = false, controller = null;
  let context = getLearningContext(), hardware = {}, os = detectOS(), chat = [], draft = "", lastFocus = null, pollTimer = null, pollRun = 0;
  let memoryDraft = null;
  let job = null, benchmarkText = "", downloadState = { model: downloadModels[0].name, text: "", progress: null }, generationText = "";
  const tabScroll = {};
  let renderedTab = "connect";
  try {
    choice = localStorage.getItem(PREF_KEY) || "";
    chat = sanitizeConversation(JSON.parse(localStorage.getItem(CHAT_KEY) || "[]"));
    draft = (localStorage.getItem(DRAFT_KEY) || "").slice(0, 1500);
    const address = localStorage.getItem(ADDRESS_KEY);
    if (endpoints.includes(address)) client = new OllamaClient(address);
    const report = JSON.parse(localStorage.getItem(HARDWARE_KEY) || "null");
    if (report) {
      hardware = validateHardware(report);
      hardware.source = "saved device details";
    }
  } catch {
  }
  const panel = document.createElement("dialog");
  panel.id = "tutor-panel";
  panel.setAttribute("aria-labelledby", "tutor-title");
  panel.innerHTML = `<div class="tutor-top"><div><span class="eyebrow">LOCAL INTELLIGENCE / GUIDED RECALL</span><h2 id="tutor-title">Think it <em>through.</em></h2></div><button id="tutor-close" class="icon-btn" aria-label="Close tutor">\xD7</button></div><div class="tutor-status"><i id="tutor-dot"></i><span id="tutor-status" role="status">Connect to your Ollama</span></div><div class="tutor-tabs" role="group" aria-label="Tutor workspace"><button data-tutor-tab="connect">1 \xB7 Connect</button><button data-tutor-tab="device">2 \xB7 Device & models</button><button data-tutor-tab="chat">3 \xB7 Tutor</button></div><div id="tutor-body"></div><div class="tutor-privacy">Chat goes directly to Ollama on this computer. Local models only. AI explanations can be wrong; check the supplied textbook sources.</div>`;
  document.body.append(panel);
  const launcher = document.createElement("button");
  launcher.id = "tutor-launch";
  launcher.setAttribute("aria-controls", "tutor-panel");
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML = '<span class="tutor-spark">\u2733</span> Socratic tutor <span>\u2197</span>';
  document.body.append(launcher);
  launcher.onclick = () => {
    lastFocus = document.activeElement;
    if (!panel.open) showPanel();
    launcher.setAttribute("aria-expanded", "true");
    render();
    $("#tutor-close").focus();
  };
  $("#tutor-close").onclick = () => {
    captureDraft();
    panel.close();
    launcher.setAttribute("aria-expanded", "false");
    lastFocus?.focus();
  };
  panel.addEventListener("cancel", (ev) => {
    ev.preventDefault();
    $("#tutor-close").click();
  });
  panel.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      $("#tutor-close").click();
      ev.stopPropagation();
    }
    if(ev.key==='Tab'&&compactTutor.matches){
      const controls=[...panel.querySelectorAll('button,a,input,select,textarea,summary,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
      const first=controls[0],last=controls.at(-1),active=document.activeElement;
      if(ev.shiftKey&&active===first){ev.preventDefault();last?.focus();}
      else if(!ev.shiftKey&&active===last){ev.preventDefault();first?.focus();}
    }
  });
  panel.querySelectorAll("[data-tutor-tab]").forEach((b) => b.onclick = () => {
    captureDraft();
    tab = b.dataset.tutorTab;
    render();
  });
  const compactTutor=matchMedia('(max-width:600px)');
  function showPanel(){if(compactTutor.matches)panel.showModal();else panel.show();}
  compactTutor.addEventListener('change',()=>{if(panel.open){const focused=document.activeElement;panel.close();showPanel();if(panel.contains(focused))focused.focus({preventScroll:true});}});
  function status(text, ok = false) {
    $("#tutor-status").textContent = text;
    $("#tutor-dot").classList.toggle("online", ok);
  }
  function save() {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(chat.slice(-CHAT_LIMIT)));
      localStorage.setItem(PREF_KEY, choice);
      localStorage.setItem(ADDRESS_KEY, client.endpoint);
    } catch {
      toast("Tutor history could not be saved. Study progress is separate.");
    }
  }
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, draft);
    } catch {
    }
  }
  function saveHardware() {
    try {
      localStorage.setItem(HARDWARE_KEY, JSON.stringify(hardware));
    } catch {
      toast("Device details could not be saved.");
    }
  }
  function captureDraft() {
    if ($("#tutor-input")) {
      draft = $("#tutor-input").value.slice(0, 1500);
      saveDraft();
    }
  }
  function render() {
    const body = $("#tutor-body"), active = document.activeElement, activeID = body.contains(active) ? active.id : null;
    const selection = activeID === "tutor-input" ? [active.selectionStart, active.selectionEnd] : null;
    captureDraft();
    tabScroll[renderedTab] = body.scrollTop;
    panel.querySelectorAll("[data-tutor-tab]").forEach((b) => {
      b.classList.toggle("active", b.dataset.tutorTab === tab);
      b.setAttribute("aria-pressed", b.dataset.tutorTab === tab);
    });
    if (tab === "connect") renderConnect();
    else if (tab === "device") renderDevice();
    else renderChat();
    renderedTab = tab;
    body.scrollTop = tabScroll[tab] || 0;
    syncControls();
    if (activeID && $("#" + activeID) && !$("#" + activeID).disabled) {
      $("#" + activeID).focus({ preventScroll: true });
      if (selection) $("#" + activeID).setSelectionRange(...selection);
    }
  }
  function syncControls() {
    const disable = (id, value) => {
      if ($("#" + id)) $("#" + id).disabled = !!value;
    };
    disable("ollama-connect", busy);
    disable("ollama-address", busy);
    disable("tutor-model", busy || !connected);
    disable("model-test", busy || !connected || !choice);
    disable("model-pull", busy || !connected);
    disable("model-download", busy);
    disable("tutor-send", busy || !connected || !choice || !draft.trim());
    disable("tutor-clear", busy || !chat.length);
    for (const [id, kind] of [["tutor-stop", "chat"], ["model-test-stop", "benchmark"], ["model-pull-stop", "pull"], ["ollama-connect-stop", "connect"]]) if ($("#" + id)) $("#" + id).hidden = job?.kind !== kind;
    panel.querySelectorAll("[data-tutor-mode]").forEach((b) => b.disabled = busy || !connected || !choice);
  }
  function beginJob(kind) {
    busy = true;
    controller = new AbortController();
    job = { kind, model: choice };
    render();
  }
  function endJob() {
    busy = false;
    controller = null;
    job = null;
    render();
  }
  function updateDeviceJob() {
    if ($("#model-test-result")) $("#model-test-result").textContent = benchmarkText;
    if ($("#model-pull-result")) $("#model-pull-result").textContent = downloadState.text;
    if ($("#model-pull-progress")) {
      $("#model-pull-progress").hidden = downloadState.progress == null;
      $("#model-pull-progress").value = downloadState.progress || 0;
    }
  }
  function renderConnect() {
    const url = os === "windows" ? "https://ollama.com/download/OllamaSetup.exe" : os === "mac" ? "https://ollama.com/download/Ollama.dmg" : os === "linux" ? "https://ollama.com/download/linux" : "https://ollama.com/download";
    $("#tutor-body").innerHTML = `<div class="tutor-section"><span class="step-number">01 / LOCAL CONNECTION</span><h3>Connect this study space.</h3><p>Already have Ollama? Connect here, then choose a local model. Install and recovery steps are below.</p><label for="ollama-address">Ollama on this computer</label><select id="ollama-address" ${busy ? "disabled" : ""}>${endpoints.map((v) => `<option value="${v}" ${client.endpoint === v ? "selected" : ""}>${v.includes("127.0.0.1") ? "This computer \xB7 127.0.0.1" : "This computer \xB7 localhost"}</option>`).join("")}</select><button id="ollama-connect" class="primary" ${busy ? "disabled" : ""}>${connected ? "Refresh connection & models" : "Connect to Ollama"} \u2197</button><button id="ollama-connect-stop" hidden>Cancel connection</button><p id="connect-result" class="tiny" role="status">${connectionError ? e(connectionError) : connected ? "Connected to Ollama " + e(version) + ". " + models.filter((m) => !m.problem).length + " local chat models available." : "Connect checks the local service only when you click. Allow local-network access if your browser asks."}</p><details class="setup-help" ${connectionError && !connectionError.includes("canceled") ? "open" : ""}><summary>Can\u2019t connect? One-time setup</summary><p>A stopped app, blocked browser permission or Ollama\u2019s website access setting can all cause the same connection error.</p><ol><li>Install or update Ollama and open it.</li><li>Allow this origin in Ollama: <code>https://rorrimaesu.github.io</code>.</li><li>Quit and restart Ollama after changing that setting.</li><li>Allow this site\u2019s local-network permission, then retry. You can also try the other local address above.</li></ol>${os === "windows" ? '<a class="button-link" href="setup/connect-windows.ps1" download>Download Windows connection setup \u2193</a><p class="tiny">Quit Ollama from the tray. Right-click the downloaded file and choose Run with PowerShell. It adds only this site\u2019s origin and starts Ollama on loopback, without administrator access. If Windows blocks the file, use the manual steps below.</p><details><summary>Manual Windows steps</summary><p>Open \u201CEdit environment variables for your account\u201D. Create or edit <code>OLLAMA_ORIGINS</code>, adding <code>https://rorrimaesu.github.io</code> to the comma-separated list. Quit Ollama from its tray menu, then reopen it.</p></details>' : os === "mac" ? '<a class="button-link" href="setup/connect-mac.command" download>Download macOS connection setup \u2193</a><p class="tiny">Open Terminal, type <code>bash </code> followed by a space, drag the downloaded file into the window, then press Return. Quit and reopen Ollama. Settings last for this login session.</p>' : "<p>Set <code>OLLAMA_ORIGINS=https://rorrimaesu.github.io</code> for the Ollama service, keep <code>OLLAMA_HOST=127.0.0.1:11434</code>, and restart it. See the official FAQ for Linux service settings.</p>"}<p class="tiny">Keep Ollama on this computer\u2019s loopback address. A public server or wildcard website permission is unnecessary.</p><a href="https://docs.ollama.com/faq" target="_blank" rel="noreferrer">Official Ollama setup help \u2197</a></details>${connected ? '<button id="to-tutor" class="secondary">Continue to tutor \u2197</button>' : ""}</div><div class="tutor-section"><span class="step-number">02 / FIRST INSTALLATION</span><h3>Install once. Study here.</h3><p>Ollama runs the model on your computer. This website stays in your browser.</p><label for="ollama-os">Your operating system</label><select id="ollama-os">${[["windows", "Windows"], ["mac", "macOS"], ["linux", "Linux"], ["other", "Choose / mobile"]].map(([v, n]) => `<option value="${v}" ${os === v ? "selected" : ""}>${n}</option>`).join("")}</select><a class="primary download-button" href="${url}" target="_blank" rel="noreferrer">${["windows", "mac"].includes(os) ? "Download Ollama installer" : "Open official installation guide"} \u2193</a><p class="tiny">${["windows", "mac"].includes(os) ? "Likely OS detected; change it if needed. The official installer handles supported CPU architectures. Open the download and follow its installer." : "Desktop Ollama is required on this computer. Mobile browsers cannot run the desktop installer."} Your browser cannot silently install software.</p></div><div class="tutor-section"><span class="step-number">03 / APP HANDOFF</span><h3>Open Ollama.</h3><p>Already installed? The app can run in the background. Windows and macOS can open it with the button below.</p><a id="ollama-open" class="button-link" href="ollama://">Open Ollama \u2197</a><p class="tiny">Accept your browser\u2019s app prompt. If nothing opens, launch Ollama from your applications menu. This button cannot guarantee a hidden launch; Linux users can run <code>ollama serve</code>.</p></div>`;
    $("#ollama-os").onchange = (ev) => {
      os = ev.target.value;
      render();
    };
    $("#ollama-address").onchange = (ev) => {
      client = new OllamaClient(ev.target.value);
      connected = false;
      save();
      status("Address changed \xB7 reconnect");
      render();
    };
    $("#ollama-connect").onclick = () => connect();
    $("#ollama-connect-stop").onclick = () => controller?.abort();
    $("#ollama-open").onclick = (ev) => {
      if (busy) {
        ev.preventDefault();
        return;
      }
      clearTimeout(pollTimer);
      const run = ++pollRun, deadline = performance.now() + 4e4;
      status("Opening Ollama \xB7 checking for up to 40 seconds");
      const poll = async () => {
        if (run !== pollRun || performance.now() >= deadline) {
          if (run === pollRun) status("Can\u2019t connect yet \xB7 see one-time setup");
          return;
        }
        if (!busy) {
          try {
            await client.request("version", { timeout: Math.min(1500, deadline - performance.now()) });
            if (run === pollRun) {
              await connect();
              return;
            }
          } catch {
          }
        }
        if (run === pollRun) pollTimer = setTimeout(poll, 1500);
      };
      pollTimer = setTimeout(poll, 1e3);
    };
    if ($("#to-tutor")) $("#to-tutor").onclick = () => {
      tab = "chat";
      render();
    };
  }
  async function refreshModels(signal) {
    let result;
    try {
      result = await client.connect(signal);
    } catch (firstError) {
      if (signal?.aborted) throw firstError;
      const alternate = new OllamaClient(endpoints.find((v) => v !== client.endpoint));
      result = await alternate.connect(signal);
      client = alternate;
    }
    version = result.version;
    const results = await Promise.allSettled(result.models.map(async (m) => {
      const info = await client.show(m.name, signal);
      return { ...m, info, problem: localModelProblem(m, info) };
    }));
    if (signal?.aborted) throw signal.reason;
    models = results.map((r, i) => r.status === "fulfilled" ? r.value : { ...result.models[i], problem: "Could not verify this model. Refresh to retry." });
    const valid = models.filter((m) => !m.problem);
    if (!valid.some((m) => m.name === choice)) choice = valid.find((m) => /qwen3.5:4b/.test(m.name))?.name || valid.sort((a, b) => a.size - b.size)[0]?.name || "";
    connected = true;
    save();
    status(`Ollama ${version} \xB7 ${valid.length} local chat models`, true);
    return valid;
  }
  let connectionError = "";
  async function connect() {
    if (busy) return;
    clearTimeout(pollTimer);
    pollRun++;
    connectionError = "";
    beginJob("connect");
    status("Checking local Ollama\u2026");
    try {
      await refreshModels(controller.signal);
    } catch (err) {
      connected = false;
      connectionError = controller.signal.aborted ? "Connection check canceled." : "Could not reach Ollama. Use the one-time setup below, then retry. " + (err.message?.includes("fetch") ? "" : err.message || "");
      status(controller.signal.aborted ? "Connection check canceled" : "Can\u2019t connect \xB7 check Ollama and website access");
    } finally {
      endJob();
      if (connectionError && $("#connect-result")) {
        $("#connect-result").textContent = connectionError;
        if ($("#tutor-body .setup-help") && !connectionError.includes("canceled")) $("#tutor-body .setup-help").open = true;
      }
    }
  }
  const bytes = (n) => (n / 1e9).toFixed(1) + " GB";
  function modelOptions() {
    return models.map((m) => `<option value="${e(m.name)}" ${m.problem ? "disabled" : ""} ${m.name === choice ? "selected" : ""}>${e(m.name)} \xB7 ${bytes(m.size || 0)}${m.problem ? " \xB7 unavailable" : ""}</option>`).join("");
  }
  function modelSelector() {
    return `<label for="tutor-model">Installed local chat model</label><select id="tutor-model" ${busy || !connected ? "disabled" : ""}>${choice ? "" : '<option value="">No verified local chat models</option>'}${modelOptions()}</select>`;
  }
  function bindModel() {
    if ($("#tutor-model")) $("#tutor-model").onchange = (ev) => {
      choice = ev.target.value;
      save();
      if (tab === "device") render();
    };
  }
  function renderDevice() {
    const report = hardware;
    const memoryInput = memoryDraft || {ram: !report.ramApproximate && report.ramGB || "", vram: report.vramGB ?? ""};
    const viable = recommendModels(models, hardware);
    const suggested = viable[0];
    const recommendation = suggested ? "Suggested starting model: " + suggested.name + ". " + suggested.fit.label + "." : report.source ? "Memory fit is uncertain. Start with Qwen 3.5 2B, or test an installed smaller model." : "Run the hardware check or enter memory values for a starting suggestion.";
    $("#tutor-body").innerHTML = `<div class="tutor-section"><h3>Find a comfortable fit.</h3><p>The skeleton and AI share your computer\u2019s memory. Start small, then test a model with the atlas open.</p><button id="hardware-detect" class="secondary">Detect available hardware \u2197</button><div id="hardware-report" role="status">${report.source ? `<p class="tiny">Source: ${e(report.source)}<br>GPU: ${e(report.gpu || "Unknown")}<br>${report.threads || "Unknown"} logical threads \xB7 ${report.ramGB || "Unknown"} GB ${report.ramApproximate ? "approximate / bounded " : ""}RAM \xB7 ${report.vramGB ?? "Unknown"} GB dedicated VRAM</p>` : ""}</div><p class="tiny">Browsers do not expose exact VRAM. The browser check reports only available identifiers and approximate RAM. Apple unified memory is shared RAM, not dedicated VRAM.</p><div class="memory-inputs"><label>System RAM (GB)<input id="hardware-ram" type="number" step="any" min="1" max="4096" placeholder="e.g. 32" value="${e(memoryInput.ram)}"></label><label>Dedicated VRAM (GB)<input id="hardware-vram" type="number" step="any" min="0" max="4096" placeholder="e.g. 8" value="${e(memoryInput.vram)}"></label></div><button id="hardware-apply">Use these memory values</button><details><summary>Get a more precise hardware report</summary><p>Windows: the read-only check below saves a small JSON report on your Desktop. Import it here. NVIDIA VRAM is measured when its utility is available; other GPUs may report unknown.</p><a class="button-link" href="setup/hardware-windows.ps1" download>Download Windows hardware check \u2193</a><p class="tiny">Right-click the downloaded file \u2192 Run with PowerShell. No extra app is required. For macOS or Linux, read memory in system settings and enter it above.</p><label for="hardware-import">Import hardware report</label><input type="file" id="hardware-import" accept=".json,application/json"></details><p id="hardware-error" class="tiny" role="status"></p></div><div class="tutor-section"><h3>Use what\u2019s installed.</h3><p class="model-recommendation">${e(recommendation)}</p>${suggested ? '<button id="use-suggested">Use suggested model</button>' : ""}${modelSelector()}<p id="model-fit" class="tiny">${choice ? e(modelFit(models.find((m) => m.name === choice)?.size || 0, hardware).label) : "Connect to Ollama first, then refresh its model list."}</p><button id="model-test" ${!choice || !connected || busy ? "disabled" : ""}>Run a short model test \u2197</button><button id="model-test-stop" ${busy ? "" : "hidden"}>Stop test</button><p id="model-test-result" role="status">${e(benchmarkText)}</p><p class="tiny">Fit estimates reserve memory for context and the atlas. A short test measures speed, not factual accuracy or a guarantee for long sessions.</p>${models.some((m) => m.problem) ? `<details><summary>Unavailable models</summary>${models.filter((m) => m.problem).map((m) => `<p class="tiny">${e(m.name)}: ${e(m.problem)}</p>`).join("")}</details>` : ""}</div><div class="tutor-section"><h3>Need a model?</h3><p>Optional downloads from Ollama\u2019s official library. Select a size, then explicitly start the download. Keep this tab open.</p><label for="model-download">Local Qwen 3.5 model</label><select id="model-download">${downloadModels.map((m) => `<option value="${m.name}" ${downloadState.model === m.name ? "selected" : ""}>${m.name} \xB7 ~${bytes(m.size)}</option>`).join("")}</select><p id="download-description" class="tiny">${e(downloadModels.find((m) => m.name === downloadState.model).description)}</p><button id="model-pull" ${!connected || busy ? "disabled" : ""}>Download selected model</button><button id="model-pull-stop" hidden>Cancel download</button><progress id="model-pull-progress" max="100" value="0" hidden aria-label="Model download progress"></progress><p id="model-pull-result" role="status">${e(downloadState.text)}</p><p class="tiny">Requires disk space and internet. License and current sizes: <a href="https://ollama.com/library/qwen3.5" target="_blank" rel="noreferrer">Ollama model library \u2197</a>. Interrupted downloads can be retried; already fetched layers may be reused.</p></div>`;
    $("#hardware-detect").onclick = async () => {
      hardware = mergeBrowserHardware(hardware, await browserHardware());
      saveHardware();
      memoryDraft = null;
      render();
    };
    for (const id of ["hardware-ram", "hardware-vram"]) $("#"+id).oninput=()=>{memoryDraft={ram:$("#hardware-ram").value,vram:$("#hardware-vram").value};};
    $("#hardware-apply").onclick = () => {
      try {
        const values = memoryValues($("#hardware-ram").value, $("#hardware-vram").value);
        hardware = { ...hardware, ...values, schema: 1, ramApproximate: false, source: "manually entered", gpu: hardware.gpu || "Not supplied" };
        saveHardware();
        memoryDraft = null;
        render();
      } catch (err) {
        $("#hardware-error").textContent = err.message;
      }
    };
    $("#hardware-import").onchange = async (ev) => {
      try {
        const f = ev.target.files[0];
        if (!f) return;
        if (f.size > 2e4) throw new Error("Report is too large.");
        hardware = validateHardware(JSON.parse((await f.text()).replace(/^\uFEFF/, "")));
        saveHardware();
        memoryDraft = null;
        render();
      } catch (err) {
        $("#hardware-error").textContent = err.message;
      }
    };
    bindModel();
    if ($("#use-suggested")) $("#use-suggested").onclick = () => {
      choice = suggested.name;
      save();
      render();
    };
    $("#model-test").onclick = benchmark;
    $("#model-test-stop").onclick = () => controller?.abort();
    $("#model-download").onchange = (ev) => {
      downloadState.model = ev.target.value;
      $("#download-description").textContent = downloadModels.find((m) => m.name === ev.target.value).description;
    };
    $("#model-pull").onclick = pull;
    $("#model-pull-stop").onclick = () => controller?.abort();
    updateDeviceJob();
  }
  async function checkedModel(name = choice) {
    if (!connected || !name) throw new Error("Connect and select a local chat model first.");
    const model = models.find((m) => m.name === name);
    if (!model) throw new Error("Refresh the installed model list.");
    const info = await client.show(name, controller?.signal), problem = localModelProblem(model, info);
    if (problem) throw new Error(problem);
    return info;
  }
  async function benchmark() {
    if (busy || !choice) return;
    const model = choice;
    benchmarkText = "Loading and testing " + model + " locally\u2026";
    beginJob("benchmark");
    const start = performance.now();
    let first = null;
    try {
      const info = await checkedModel(model);
      const result = await client.chat(model, [{ role: "user", content: "In 40 words or fewer: what is the difference between the axial and appendicular skeleton?" }], () => {
        first ??= performance.now();
      }, { signal: controller.signal, info, numPredict: 100 });
      const s = result.stats, running = await client.running().catch(() => ({ models: [] })), memory = running.models?.find((m) => m.name === model || m.model === model), speed = s.eval_duration ? s.eval_count / (s.eval_duration / 1e9) : null;
      benchmarkText = `${model} passed a short test. First text: ${((first - start) / 1e3).toFixed(1)} s. ${speed ? speed.toFixed(1) + " tokens/s. " : ""}${s.load_duration ? "Load: " + (s.load_duration / 1e9).toFixed(1) + " s. " : ""}${memory ? "Model GPU allocation: " + bytes(memory.size_vram || 0) + " (not total VRAM). " : ""}Try a tutor exchange and check its reasoning against the source.`;
    } catch (err) {
      benchmarkText = controller.signal.aborted ? "Test stopped." : err.message + " Try a smaller model or close other demanding apps.";
    } finally {
      endJob();
    }
  }
  async function pull() {
    if (busy || !connected) return;
    const name = downloadState.model;
    let downloaded = false;
    downloadState = { model: name, text: "Starting " + name + " download\u2026", progress: 0 };
    beginJob("pull");
    try {
      await client.pull(name, (obj) => {
        downloadState.text = obj.status || "Downloading\u2026";
        if (obj.total > 0) {
          downloadState.progress = Math.min(100, Math.round((obj.completed || 0) / obj.total * 100));
          downloadState.text += " \xB7 " + downloadState.progress + "%";
        }
        updateDeviceJob();
      }, controller.signal);
      downloaded = true;
      downloadState.text = "Downloaded. Verifying the installed model\u2026";
      updateDeviceJob();
      const valid = await refreshModels(controller.signal), model = valid.find((m) => m.name === name);
      if (!model) throw new Error("The downloaded model could not be verified as a local chat model. Refresh the connection to retry.");
      choice = model.name;
      save();
      downloadState.text = name + " is ready. Open the Tutor tab.";
      downloadState.progress = 100;
    } catch (err) {
      downloadState.text = controller.signal.aborted ? downloaded ? "Download completed; verification was canceled. Refresh the connection." : "Download canceled. Retry to resume." : (downloaded ? "Download completed, but verification failed. " : "") + err.message;
    } finally {
      endJob();
    }
  }
  function sourceButtons(m) {
    return (m.sources || []).map((s) => `<button data-tutor-page="${s.pdf}" class="tutor-source">[${e(s.id)}] ${e(s.title)} \u2197</button>`).join("");
  }
  function answerHTML(m) {
    if (m.pending) return e(m.content || "Preparing a local reply\u2026");
    return citationParts(m.content, m.sources).parts.map((part) => part.type === "text" ? e(part.text).replace(/\*\*([^*\n]{1,200})\*\*/g,"<strong>$1</strong>").replace(/\*([^*\n]{1,160})\*/g,"<em>$1</em>") : `<button class="inline-source" data-tutor-page="${part.source.pdf}" aria-label="Read ${e(part.source.id + " " + part.source.title)}">[${part.source.id}]</button>`).join("");
  }
  function messageHTML(m, index) {
    const references = m.role === "assistant" ? citationParts(m.content, m.sources) : { unknown: [] }, unavailable = references.unknown.length ? `<p class="tiny warning-text">Reference ${references.unknown.map(e).join(", ")} was not supplied for this reply. Use the readings below to check it.</p>` : "";
    return `<article class="tutor-message ${m.role}"><span>${m.role === "user" ? "YOU" : m.pending ? "LOCAL AI / DRAFT" : "OSTEON / AI"}${m.model ? " \xB7 " + e(m.model) : ""}</span><div class="tutor-message-text">${m.role === "assistant" ? answerHTML(m) : e(m.content)}</div>${m.correction ? '<p class="tiny warning-text">Course note substituted: ' + e(m.correction) + "</p>" : ""}${m.reference ? '<button data-tutor-section="' + e(m.reference) + '" class="tutor-source">Read course section ' + e(m.reference) + " \u2197</button>" : ""}${m.error ? '<p class="tiny warning-text">Response incomplete. Check the source before using it.</p><button class="retry-question" data-tutor-retry="' + index + '">Edit question and retry \u2197</button>' : ""}${unavailable}${m.sources?.length ? '<details><summary>Read the source excerpts</summary><div class="tutor-sources">' + m.sources.map((source) => `<div class="tutor-excerpt"><button data-tutor-page="${source.pdf}" class="tutor-source">[${e(source.id)}] ${e(source.title)} \u2197</button>${source.text ? "<blockquote>" + e(source.text) + "</blockquote>" : ""}</div>`).join("") + '</div><p class="tiny">These readings were supplied to the model; a matching reference does not certify every claim.</p></details>' : ""}</article>`;
  }
  function renderChat() {
    const assessed = context.type === "assessment";
    $("#tutor-body").innerHTML = `<div class="tutor-chat-controls">${modelSelector()}<div id="tutor-context" class="tutor-context"><span>LEARNING CONTEXT</span><strong>${e(context.label)}</strong></div><p id="tutor-assessment-note" class="tiny warning-text" ${assessed ? "" : "hidden"}>Using tutor help marks the current unanswered attempt as assisted before a reply is generated.</p></div><div id="tutor-messages" aria-live="off">${chat.length ? chat.map((m, i) => messageHTML(m, i)).join("") : '<div class="tutor-welcome"><span>\u2733</span><h3>A question.<br>A connection.<br>Your understanding.</h3><p>Choose a structure or lesson, then ask me to help you reason through it.</p></div>'}</div><div id="tutor-generation-status" class="tiny" role="status">${e(generationText)}</div><div class="tutor-quick"><button data-tutor-mode="socratic">Ask me about this</button><button data-tutor-mode="hint">Small hint</button><button data-tutor-mode="explain">Explain clearly</button></div><form id="tutor-form"><label for="tutor-input" class="sr-only">Your anatomy question or answer</label><textarea id="tutor-input" rows="2" maxlength="1500" placeholder="Your question, prediction or answer\u2026">${e(draft)}</textarea><p class="composer-help">Enter to send \xB7 Shift + Enter for a new line</p><div class="tutor-send-row"><button id="tutor-clear" type="button">Clear chat</button><button id="tutor-stop" type="button" ${busy ? "" : "hidden"}>Stop</button><button class="primary" id="tutor-send" ${!connected || !choice || busy ? "disabled" : ""}>Send \u2197</button></div></form>${!connected ? '<p class="tiny">Connect to your local Ollama to send a question. <button type="button" id="chat-connect">Open connection setup \u2197</button></p>' : ""}`;
    bindModel();
    $("#tutor-input").oninput = () => {
      draft = $("#tutor-input").value;
      saveDraft();
      syncControls();
    };
    $("#tutor-input").onkeydown = (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey && !ev.isComposing) {
        ev.preventDefault();
        if (!busy && connected && choice && draft.trim()) send("socratic", false);
      }
    };
    $("#tutor-form").onsubmit = (ev) => {
      ev.preventDefault();
      send("socratic", false);
    };
    panel.querySelectorAll("[data-tutor-mode]").forEach((b) => b.onclick = () => send(b.dataset.tutorMode, true));
    $("#tutor-stop").onclick = () => controller?.abort();
    $("#tutor-clear").onclick = () => {
      if (busy) return;
      chat = [];
      generationText = "";
      save();
      render();
    };
    if ($("#chat-connect")) $("#chat-connect").onclick = () => {
      tab = "connect";
      render();
    };
    panel.querySelectorAll("[data-tutor-retry]").forEach((b) => b.onclick = () => {
      const prior = chat.slice(0, +b.dataset.tutorRetry).reverse().find((m) => m.role === "user");
      if (prior) {
        draft = prior.content.slice(0, 1500);
        $("#tutor-input").value = draft;
        saveDraft();
        syncControls();
        $("#tutor-input").focus();
      }
    });
    bindSources();
  }
  function bindSources() {
    const read=(event,detail)=>{$('#tutor-close').click();document.dispatchEvent(new CustomEvent(event,{detail}));};
    panel.querySelectorAll("[data-tutor-section]").forEach((b) => b.onclick = () => read("openreader",b.dataset.tutorSection));
    panel.querySelectorAll("[data-tutor-page]").forEach((b) => b.onclick = () => read("openreaderpage",+b.dataset.tutorPage));
  }
  async function send(mode, allowPrompt = false) {
    if (busy || !connected || !choice) return;
    captureDraft();
    if (!draft.trim() && !allowPrompt) return;
    const query = draft.trim() || (mode === "explain" ? `Explain ${context.label} clearly.` : mode === "hint" ? `Give me a small hint about ${context.label}.` : `Ask me one question about ${context.label}.`), model = choice;
    document.dispatchEvent(new Event("studyassistance"));
    const { sources, messages, retrievalTopic } = buildTutorMessages(query, chat, context, mode);
    chat.push({ role: "user", content: query });
    const reply = { role: "assistant", content: "", model, pending: true, sources: sources.map(({ id, pdf, title, text }) => ({ id, pdf, title, text })) };
    chat.push(reply);
    chat = chat.slice(-CHAT_LIMIT);
    draft = "";
    if ($("#tutor-input")) $("#tutor-input").value = "";
    saveDraft();
    save();
    generationText = "Preparing a local reply. First use of a model can take longer.";
    beginJob("chat");
    $("#tutor-input")?.focus({ preventScroll: true });
    $("#tutor-body").scrollTop = $("#tutor-body").scrollHeight;
    try {
      const info = await checkedModel(model);
      await client.chat(model, messages, (text) => {
        reply.content = text;
        if (tab === "chat" && $("#tutor-messages")) {
          const body = $("#tutor-body"), follow = body.scrollHeight - body.scrollTop - body.clientHeight < 160, el = $("#tutor-messages").lastElementChild?.querySelector(".tutor-message-text");
          if (el) el.textContent = text;
          if (follow) body.scrollTop = body.scrollHeight;
        }
      }, { signal: controller.signal, info });
      const correction = checkTutorReply(reply.content, query+" "+retrievalTopic);
      if (correction) {
        reply.content = correction.text;
        reply.correction = correction.reason;
        reply.reference = correction.reference;
      }
      generationText = "Reply ready \xB7 " + model + ". Check the source readings.";
    } catch (err) {
      reply.error = true;
      reply.content += (reply.content ? "\n\n" : "") + (controller.signal.aborted ? "Stopped." : err.message?.includes("fetch") ? "Connection lost. Check Ollama and retry." : err.message || "No answer received.");
      generationText = controller.signal.aborted ? "Reply stopped. Your question is saved." : "Reply incomplete. Edit and retry, or use the source readings.";
      if (err instanceof TypeError && /fetch/i.test(err.message)) {
        connected = false;
        status("Connection lost \xB7 reconnect to Ollama");
      }
    } finally {
      reply.pending = false;
      save();
      endJob();
    }
  }
  document.addEventListener("tutorcontext", (ev) => {
    context = { ...ev.detail };
    if ($("#tutor-assessment-note")) $("#tutor-assessment-note").hidden = context.type !== "assessment";
    if ($("#tutor-context")) $("#tutor-context").innerHTML = "<span>LEARNING CONTEXT</span><strong>" + e(context.label) + "</strong>";
  });
  window.addEventListener("pagehide", () => controller?.abort());
  return { open: () => launcher.click() };
}
export {
  initTutor
};
