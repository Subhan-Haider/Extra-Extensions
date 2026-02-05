// Constants & State
const STORAGE_KEYS = ["wpm", "accuracy", "loop", "para1", "enable1", "theme", "delay_between", "presets", "device_type"];
const DEFAULT_SETTINGS = {
  wpm: 200,
  accuracy: 95,
  loop: false,
  para1: "",
  enable1: false,
  delay_between: 1000,
  device_type: "computer",
  presets: {}
};

// Initialization
document.addEventListener("DOMContentLoaded", async () => {
  const s = await chrome.storage.local.get(STORAGE_KEYS);

  // Load settings into UI
  document.getElementById("wpm").value = s.wpm || DEFAULT_SETTINGS.wpm;
  document.getElementById("accuracy").value = s.accuracy || DEFAULT_SETTINGS.accuracy;
  document.getElementById("loop").checked = s.loop || DEFAULT_SETTINGS.loop;
  document.getElementById("para1").value = s.para1 || DEFAULT_SETTINGS.para1;
  document.getElementById("enable1").checked = s.enable1 || DEFAULT_SETTINGS.enable1;
  document.getElementById("delay_between").value = s.delay_between || DEFAULT_SETTINGS.delay_between;
  document.getElementById("device_type").value = s.device_type || DEFAULT_SETTINGS.device_type;

  updateCharCount(1);
  loadPresets(s.presets || {});

  // Apply theme
  if (s.theme === 'light') {
    document.body.classList.add('light-mode');
    updateThemeIcon(true);
  }

  // Check if typing is active (status check)
  checkTypingStatus();
});

// Theme Toggle
document.getElementById("theme-toggle").addEventListener("click", async () => {
  const isLight = document.body.classList.toggle("light-mode");
  await chrome.storage.local.set({ theme: isLight ? "light" : "dark" });
  updateThemeIcon(isLight);
});

// Settings Persistence
document.getElementById("save").addEventListener("click", async () => {
  const settings = getCurrentUISettings();
  await chrome.storage.local.set(settings);
  showToast("✅ Settings saved!");
});

document.getElementById("reset").addEventListener("click", async () => {
  if (!confirm("Reset all settings to default?")) return;
  await chrome.storage.local.clear();
  location.reload();
});

// Typing Engine Control
document.getElementById("start").addEventListener("click", async () => {
  const s = getCurrentUISettings();
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.url) return showToast("❌ No active tab found.");

  if (isRestrictedUrl(tab.url)) {
    return showToast("⚠️ Restricted page. Navigate to a normal website.");
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: typingEngine,
      args: [s]
    });
    setStatus(true);
  } catch (err) {
    showToast("❌ Error: " + err.message);
  }
});

document.getElementById("magic-start").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return showToast("❌ No active tab found.");

  if (isRestrictedUrl(tab.url)) {
    return showToast("⚠️ Restricted page.");
  }

  showToast("🪄 Magic Flow starting...");

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectParagraph
    });

    if (!results || !results[0] || !results[0].result) {
      return showToast("⚠️ No text found.");
    }

    let text = results[0].result;
    text = humanizeText(text);

    // AI Smart Fix integration
    try {
      showToast("🤖 AI is perfecting the text...");
      text = await aiCorrectText(text);
    } catch (e) {
      console.warn("AI Fix skipped:", e.message);
    }

    document.getElementById("para1").value = text;
    document.getElementById("enable1").checked = true;
    updateCharCount(1);
    document.getElementById("start").click();

  } catch (err) {
    showToast("❌ Magic Flow failed: " + err.message);
  }
});

document.getElementById("stop").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => { window.autoTyperActive = false; }
    });
    setStatus(false);
  } catch (err) {
    console.error("Stop failed:", err);
  }
});

// Presets Management
async function loadPresets(presets) {
  const select = document.getElementById("preset-select");
  select.innerHTML = '<option value="">Select a preset...</option>';
  Object.keys(presets).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

document.getElementById("save-preset").addEventListener("click", async () => {
  const name = prompt("Enter a name for this preset:");
  if (!name) return;

  const s = await chrome.storage.local.get("presets");
  const presets = s.presets || {};
  presets[name] = getCurrentUISettings();

  await chrome.storage.local.set({ presets });
  loadPresets(presets);
  showToast("💾 Preset saved!");
});

document.getElementById("preset-select").addEventListener("change", async (e) => {
  const name = e.target.value;
  if (!name) return;

  const s = await chrome.storage.local.get("presets");
  const preset = s.presets[name];
  if (!preset) return;

  document.getElementById("wpm").value = preset.wpm;
  document.getElementById("accuracy").value = preset.accuracy;
  document.getElementById("loop").checked = preset.loop;
  document.getElementById("para1").value = preset.para1;
  document.getElementById("enable1").checked = preset.enable1;
  document.getElementById("delay_between").value = preset.delay_between || 1000;

  updateCharCount(1);
  showToast("Loaded: " + name);
});

document.getElementById("delete-preset").addEventListener("click", async () => {
  const select = document.getElementById("preset-select");
  const name = select.value;
  if (!name || !confirm(`Delete preset "${name}"?`)) return;

  const s = await chrome.storage.local.get("presets");
  delete s.presets[name];
  await chrome.storage.local.set({ presets: s.presets });
  loadPresets(s.presets);
  showToast("🗑 Preset deleted");
});

// Text Tools
// Text Tools - Explicit setup for Paragraph 1
const p1Input = document.getElementById("para1");
if (p1Input) {
  p1Input.addEventListener("input", () => updateCharCount(1));

  const clearBtn = document.getElementById("clear1");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      p1Input.value = "";
      updateCharCount(1);
    });
  }

  const aiFixBtn = document.getElementById("ai-fix1");
  if (aiFixBtn) {
    aiFixBtn.addEventListener("click", async () => {
      const text = p1Input.value;
      if (!text) return;
      const originalText = aiFixBtn.innerHTML;
      aiFixBtn.disabled = true;

      try {
        const fixed = await aiCorrectText(text, (status) => {
          aiFixBtn.innerHTML = `⏳ ${status}`;
        });
        p1Input.value = fixed;
        updateCharCount(1);
        showToast("🤖 AI Smart Fix applied!");
      } catch (e) {
        showToast("❌ AI Fix failed: " + e.message);
      } finally {
        aiFixBtn.innerHTML = originalText;
        aiFixBtn.disabled = false;
      }
    });
  }

  const collectBtn = document.getElementById("collect1");
  if (collectBtn) {
    collectBtn.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return showToast("❌ No active tab.");
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: collectParagraph
        });
        if (results && results[0] && results[0].result) {
          p1Input.value = results[0].result;
          updateCharCount(1);
          showToast("📥 Text collected!");
        }
      } catch (err) {
        showToast("❌ Collection failed: " + err.message);
      }
    });
  }
}

function collectParagraph() {
  const ss = ['.word', '.letter', '.txt-word', '.screenBasic-letter', 'span[class*="char"]', '.dash-target > span'];
  let els = document.querySelectorAll(ss.join(', '));
  if (els.length === 0) {
    const cs = document.querySelectorAll('.typing-test, #typing-field, [role="textbox"], .input-zone');
    cs.forEach(c => { const spans = c.querySelectorAll('span'); if (spans.length > 0) els = spans; });
  }
  const arr = Array.from(els);
  const top = arr.filter(el => !arr.some(p => p !== el && p.contains(el)));
  let ws = [];
  let cur = "";
  top.forEach((el, i) => {
    let t = el.innerText.replace(/\u00A0/g, ' ').replace(/\u200B/g, '').trim();
    if (!t && el.textContent === " ") t = " ";
    if (el.classList.contains('word') || t.length > 1) {
      if (cur) { ws.push(cur); cur = ""; }
      ws.push(t);
    } else if (t.length === 1) {
      if (t === " ") {
        if (cur) { ws.push(cur); cur = ""; }
      } else {
        cur += t;
        const next = top[i + 1];
        if (!next || next.parentElement !== el.parentElement) { ws.push(cur); cur = ""; }
      }
    }
  });
  if (cur) ws.push(cur);
  return ws.join(' ').replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
}

async function humanizeText(text, onProgress) {
  if (!text) return "";
  if (onProgress) onProgress("Humanizing...");

  const PROMPT = `TASK: Rewrite this text to sound 100% human.
1. Vary sentence length (Burstiness).
2. Use natural transitions and subtle idioms.
3. Keep the meaning identical but lose the 'AI' stiffness.
4. Output ONLY the rewritten text.

Text to Humanize: ${text}`;

  try {
    const result = await aiCorrectText(text, onProgress, PROMPT);
    return result;
  } catch (e) {
    // Local fallback if ALL AI fails
    return text.split(". ").map(s => {
      if (Math.random() > 0.8) return "Actually, " + s.charAt(0).toLowerCase() + s.slice(1);
      return s;
    }).join(". ");
  }
}

async function aiCorrectText(text, onProgress, customPrompt) {
  const ghostHeuristic = (str) => {
    // Phase 1: Heavy Space Collapse (Handles 'C  a  n' and 'C a n')
    let res = str.replace(/([a-zA-Z])\s+(?=[a-zA-Z]\s|[a-zA-Z]$)/g, '$1');
    res = res.replace(/([a-zA-Z])\s([a-zA-Z])\s/g, '$1$2 '); // Double-tap correction

    const common = ["the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "word"];
    common.forEach(w => {
      const regex = new RegExp(`([a-z])(${w})([a-z])`, 'gi');
      res = res.replace(regex, '$1 $2 $3');
    });
    return res;
  };

  const DEFAULT_PROMPT = `Fix text. Join letters like 'C a n' -> 'Can'. Split words like 'runfast' -> 'run fast'. Output ONLY fixed text.\n\nText: ${text}`;
  const ACTIVE_PROMPT = customPrompt || DEFAULT_PROMPT;

  // Switch Chain Layer 1: Browser Native
  if (onProgress) onProgress("Native AI...");
  try {
    if (window.ai && window.ai.assistant) {
      const assistant = await window.ai.assistant.create();
      const res = await assistant.prompt(ACTIVE_PROMPT);
      if (res && res.trim().length > text.length * 0.3) return res.trim();
    }
  } catch (e) { }

  // Switch Chain Layer 2: TextSynth
  if (onProgress) onProgress("TextSynth...");
  try {
    const r = await fetch("https://api.textsynth.com/v1/engines/llama2_7b/completions", {
      method: "POST",
      body: JSON.stringify({ prompt: `Restore: ${text}\nFixed:`, max_tokens: 500, stop: ["Restore:"] })
    });
    if (r.ok) {
      const d = await r.json();
      const s = d.text.trim();
      if (s && s.length > text.length * 0.3) return s;
    }
  } catch (e) { }

  // Switch Chain Layer 3: HuggingFace
  if (onProgress) onProgress("HuggingFace...");
  try {
    const r = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: `<s>[INST] Fix text corruption: ${text} [/INST]` })
    });
    if (r.ok) {
      const d = await r.json();
      const s = d[0]?.generated_text?.split('[/INST]')?.[1]?.trim();
      if (s && s.length > text.length * 0.3) return s;
    }
  } catch (e) { }

  // Switch Chain Layer 4: OpenRouter MEGA-FALLBACK (2026 Edition)
  const KEY = "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";
  const MODELS = [
    "xiaomi/mimo-v2-flash:free",
    "deepseek/deepseek-r1:free",
    "google/gemini-2.0-flash-exp:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen3-coder-480b-a35b:free",
    "google/gemma-3-27b-it:free",
    "deepseek/deepseek-chat:free",
    "openchat/openchat-3.5-0106:free",
    "nousresearch/nous-capybara-7b:free"
  ];

  for (const m of MODELS) {
    if (onProgress) onProgress(`${m.split('/')[1]?.split(':')[0] || 'AI'}...`);
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: m,
          messages: [{ role: "system", content: "You are a professional text recovery and humanization expert. Output ONLY clean fixed result." }, { role: "user", content: ACTIVE_PROMPT }]
        })
      });
      if (r.ok) {
        const d = await r.json();
        const s = d.choices?.[0]?.message?.content?.trim();
        if (s && s.length > text.length * 0.3) return s;
      }
    } catch (e) { }
  }

  if (onProgress) onProgress("Ghost Engine...");
  return ghostHeuristic(text);
}

// UI Helpers
function getCurrentUISettings() {
  return {
    wpm: parseInt(document.getElementById("wpm").value),
    accuracy: parseInt(document.getElementById("accuracy").value),
    loop: document.getElementById("loop").checked,
    para1: document.getElementById("para1").value,
    enable1: document.getElementById("enable1").checked,
    delay_between: parseInt(document.getElementById("delay_between").value),
    device_type: document.getElementById("device_type").value
  };
}
function updateCharCount(num) {
  const t = document.getElementById(`para${num}`).value;
  document.getElementById(`count${num}`).textContent = `${t.length} chars`;
}
function showToast(m) { alert(m); }
function setStatus(a) { const b = document.getElementById("status-banner"); if (b) b.style.display = a ? "flex" : "none"; }
async function checkTypingStatus() {
  let [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!t?.id) return;
  try {
    const r = await chrome.scripting.executeScript({ target: { tabId: t.id }, func: () => window.autoTyperActive === true });
    if (r[0].result) setStatus(true);
  } catch (e) { }
}
function isRestrictedUrl(u) { return u.startsWith("chrome://") || u.startsWith("edge://") || u.startsWith("about:"); }

// --- THE ULTIMATE ENGINE (Universal Version) ---
function typingEngine(settings) {
  window.autoTyperActive = true;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const msPerChar = (() => {
    let b = 60 / (settings.wpm * 5);
    if (settings.device_type === "phone") b *= 1.4;
    return b * 1000;
  })();

  function getDeepActive() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    if (el === document.body || !el) {
      const q = ['input:not([type="hidden"])', 'textarea', '[contenteditable="true"]', '#wordsInput', '.input-zone'];
      for (let s of q) { let f = document.querySelector(s); if (f && f.offsetParent !== null) return f; }
    }
    return el || document.body;
  }

  function setNativeValue(el, val) {
    try {
      const p = Object.getPrototypeOf(el);
      const s = Object.getOwnPropertyDescriptor(p, 'value')?.set;
      if (s) s.call(el, val); else el.value = val;
      return true;
    } catch (e) { el.value = val; return true; }
  }

  async function simulateTyping(el, char, nitro) {
    if (!el) return;
    el.focus();
    const isS = char === " ";
    const isE = char === "\n";
    const kc = isS ? 32 : (isE ? 13 : char.charCodeAt(0));
    const opts = { key: isS ? " " : (isE ? "Enter" : char), code: isS ? "Space" : (isE ? "Enter" : `Key${char.toUpperCase()}`), keyCode: kc, which: kc, bubbles: true, cancelable: true, composed: true, view: window };

    el.dispatchEvent(new KeyboardEvent('keydown', opts));
    el.dispatchEvent(new KeyboardEvent('keypress', { ...opts, charCode: kc }));

    let inserted = false;
    if (typeof document.execCommand === 'function') {
      inserted = document.execCommand("insertText", false, char);
    }
    if (!inserted && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
      const s = el.selectionStart, v = el.value || "";
      const nv = v.slice(0, s) + char + v.slice(el.selectionEnd);
      setNativeValue(el, nv);
      el.selectionStart = el.selectionEnd = s + 1;
    }

    el.dispatchEvent(new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true, composed: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', opts));

    if (isS || isE) {
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (!nitro) await sleep(15);
    }
  }

  async function simulateBackspace(el) {
    if (!el) return;
    el.focus();
    const opts = { key: 'Backspace', keyCode: 8, which: 8, bubbles: true, cancelable: true, composed: true, view: window };
    el.dispatchEvent(new KeyboardEvent('keydown', opts));
    if (!document.execCommand("delete")) {
      const s = el.selectionStart;
      if (s > 0) { const v = el.value || ""; setNativeValue(el, v.slice(0, s - 1) + v.slice(s)); el.selectionStart = el.selectionEnd = s - 1; }
    }
    el.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true, composed: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', opts));
  }

  async function typeText(text, accuracy) {
    if (!text) return;
    const nitro = settings.wpm > 300;
    const start = performance.now();
    let typed = 0;

    for (let char of text) {
      if (!window.autoTyperActive) break;
      let el = getDeepActive();

      if (!nitro && accuracy < 100 && Math.random() * 100 > accuracy && char !== " " && char !== "\n") {
        await simulateTyping(el, "a", false);
        await sleep(msPerChar);
        await simulateBackspace(el);
        await sleep(msPerChar / 2);
        el = getDeepActive();
      }

      await simulateTyping(el, char, nitro);
      typed++;

      const target = start + (typed * msPerChar);
      const diff = target - performance.now();
      if (diff > 0) {
        if (nitro) {
          await sleep(diff);
        } else {
          let r = (Math.random() * 0.4) + 0.8;
          if ([".", "!", "?", ","].includes(char)) r *= 2.0;
          await sleep(diff * r);
        }
      }
    }
  }

  (async () => {
    console.log("⏳ Prep: 3s...");
    await sleep(3000);
    do {
      if (settings.enable1 && settings.para1) {
        await typeText(settings.para1, settings.accuracy);
        if (window.autoTyperActive) {
          const ss = ['.word', '.letter', '.txt-word', '.screenBasic-letter', 'span[class*="char"]', '.dash-target > span'];
          let els = document.querySelectorAll(ss.join(', '));
          if (els.length > 0) {
            const arr = Array.from(els);
            const top = arr.filter(el => !arr.some(p => p !== el && p.contains(el)));
            let ws = []; let cur = "";
            top.forEach((el, i) => {
              let t = el.innerText.replace(/\u00A0/g, ' ').replace(/\u200B/g, '').trim();
              if (!t && el.textContent === " ") t = " ";
              if (el.classList.contains('word') || t.length > 1) {
                if (cur) { ws.push(cur); cur = ""; }
                ws.push(t);
              } else if (t.length === 1) {
                if (t === " ") { if (cur) { ws.push(cur); cur = ""; } }
                else {
                  cur += t;
                  const next = top[i + 1]; if (!next || next.parentElement !== el.parentElement) { ws.push(cur); cur = ""; }
                }
              }
            });
            if (cur) ws.push(cur);
            const newText = ws.join(' ').replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
            if (newText && newText !== settings.para1) { settings.para1 = newText; continue; }
          }
        }
      }
      if (settings.loop && window.autoTyperActive) await sleep(2000);
      else break;
    } while (window.autoTyperActive);
    window.autoTyperActive = false;
  })();
}

function updateThemeIcon(isL) {
  const b = document.getElementById("theme-toggle");
  b.innerHTML = isL ?
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>` :
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg>`;
}
