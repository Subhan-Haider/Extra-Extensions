// Load settings
document.addEventListener("DOMContentLoaded", async () => {
  const s = await chrome.storage.local.get([
    "wpm", "accuracy", "loop", "para1", "para2", "enable1", "enable2", "theme"
  ]);
  document.getElementById("wpm").value = s.wpm || 200;
  document.getElementById("accuracy").value = s.accuracy || 95;
  document.getElementById("loop").checked = s.loop || false;
  document.getElementById("para1").value = s.para1 || "";
  document.getElementById("para2").value = s.para2 || "";
  document.getElementById("enable1").checked = s.enable1 || false;
  document.getElementById("enable2").checked = s.enable2 || false;

  // Apply theme
  if (s.theme === 'light') {
    document.body.classList.add('light-mode');
    updateThemeIcon(true);
  }
});

// Save
document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.local.set({
    wpm: parseInt(document.getElementById("wpm").value),
    accuracy: parseInt(document.getElementById("accuracy").value),
    loop: document.getElementById("loop").checked,
    para1: document.getElementById("para1").value,
    para2: document.getElementById("para2").value,
    enable1: document.getElementById("enable1").checked,
    enable2: document.getElementById("enable2").checked
  });
  alert("✅ Settings saved!");
});

// Reset
document.getElementById("reset").addEventListener("click", async () => {
  if (!confirm("Are you sure you want to reset all settings?")) return;

  await chrome.storage.local.clear();
  document.getElementById("wpm").value = 200;
  document.getElementById("accuracy").value = 95;
  document.getElementById("loop").checked = false;
  document.getElementById("para1").value = "";
  document.getElementById("para2").value = "";
  document.getElementById("enable1").checked = false;
  document.getElementById("enable2").checked = false;

  alert("🔄 Settings reset to default.");
});

// Start typing
document.getElementById("start").addEventListener("click", async () => {
  const s = await chrome.storage.local.get();
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.url) return alert("❌ No active tab found.");

  const isRestricted = tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("about:") ||
    tab.url.startsWith("chrome-extension://") ||
    tab.url.startsWith("https://chrome.google.com/webstore");

  if (isRestricted) {
    return alert("⚠️ Extension cannot run on system pages or the Chrome Web Store. Please navigate to a normal website.");
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: (settings) => {
        window.autoTyperActive = true;

        const msPerChar = (wpm) => 12000 / wpm;
        const randomTypoChar = (c) => {
          let ch;
          do { ch = String.fromCharCode(Math.floor(Math.random() * (126 - 32)) + 32); }
          while (ch === c);
          return ch;
        };

        async function typeText(text, wpm, accuracy) {
          let el = document.activeElement;

          // Handle Shadow DOM
          while (el && el.shadowRoot && el.shadowRoot.activeElement) {
            el = el.shadowRoot.activeElement;
          }

          // Removed strict check to allow typing on 'body' (for typing games)
          if (!el) el = document.body;

          const delay = msPerChar(wpm);

          for (let i = 0; i < text.length && window.autoTyperActive; i++) {
            const char = text[i];

            if (Math.random() * 100 > accuracy) {
              const wrong = randomTypoChar(char);
              await simulateTyping(el, wrong);
              await sleep(delay * 2);
              await simulateDelete(el);
            }

            await simulateTyping(el, char);
            await sleep(delay);
          }
        }

        async function simulateTyping(el, char) {
          const charCode = char.charCodeAt(0);
          let keyCode = charCode;
          let code = `Key${char.toUpperCase()}`;

          if (char === " ") {
            code = "Space";
            keyCode = 32;
          } else if (!isNaN(char)) {
            code = `Digit${char}`;
            keyCode = 48 + parseInt(char);
          } else if (/[a-zA-Z]/.test(char)) {
            keyCode = char.toUpperCase().charCodeAt(0);
          }

          const eventOptions = {
            key: char,
            code: code,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window
          };

          const keydown = new KeyboardEvent('keydown', eventOptions);
          const keypress = new KeyboardEvent('keypress', eventOptions);
          const textInput = new InputEvent('textInput', { data: char, bubbles: true, cancelable: true, view: window });
          const input = new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true, cancelable: true, view: window });
          const keyup = new KeyboardEvent('keyup', eventOptions);

          // Dispatch in order
          const allowDown = el.dispatchEvent(keydown);
          const allowPress = el.dispatchEvent(keypress);

          // Only modify value if the site didn't prevent default
          if (allowDown && allowPress) {
            const allowText = el.dispatchEvent(textInput);
            if (allowText) {
              insertText(el, char);
              el.dispatchEvent(input);
            }
          }

          el.dispatchEvent(keyup);
        }

        async function simulateDelete(el) {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true }));
          deleteLast(el);
          el.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', code: 'Backspace', bubbles: true }));
        }

        function insertText(el, text) {
          if (typeof document.execCommand === 'function' && document.execCommand("insertText", false, text)) {
            return;
          }

          // Fallback for modern inputs/frameworks (React, Vue, etc.)
          if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const val = el.value;
            el.value = val.slice(0, start) + text + val.slice(end);
            el.selectionStart = el.selectionEnd = start + text.length;
          } else {
            // Fallback for contentEditable div if execCommand failed
            const range = window.getSelection().getRangeAt(0);
            const textNode = document.createTextNode(text);
            range.deleteContents();
            range.insertNode(textNode);
            range.collapse(false);
          }
        }

        function deleteLast(el) {
          if (el.isContentEditable) {
            document.execCommand("delete");
          } else {
            el.value = el.value.slice(0, -1);
            el.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        async function startLoop() {
          console.log("⏳ Smart Paste: Starting in 3 seconds...");
          await sleep(3000);

          do {
            if (settings.enable1 && settings.para1) await typeText(settings.para1, settings.wpm, settings.accuracy);
            if (settings.enable2 && settings.para2) await typeText(settings.para2, settings.wpm, settings.accuracy);
          } while (settings.loop && window.autoTyperActive);

          if (window.autoTyperActive) {
            window.autoTyperActive = false;
            alert("✅ Typing finished!");
          }
        }

        startLoop();
      },
      args: [s]
    });
  } catch (err) {
    console.error(err);
    alert("❌ Error: " + err.message);
  }
});

// Stop typing
document.getElementById("stop").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;

  const isRestricted = tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("about:") ||
    tab.url.startsWith("chrome-extension://") ||
    tab.url.startsWith("https://chrome.google.com/webstore");

  if (isRestricted) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => { window.autoTyperActive = false; alert("⏹ Typing stopped."); }
    });
  } catch (err) {
    console.error("Stop execution failed:", err);
  }
});

// Theme Handling
document.getElementById("theme-toggle").addEventListener("click", async () => {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  await chrome.storage.local.set({ theme: isLight ? "light" : "dark" });
  updateThemeIcon(isLight);
});

function updateThemeIcon(isLight) {
  const btn = document.getElementById("theme-toggle");
  if (isLight) {
    // Show Moon (switch to dark)
    btn.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    btn.title = "Switch to Dark Mode";
  } else {
    // Show Sun (switch to light)
    btn.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    btn.title = "Switch to Light Mode";
  }
}
