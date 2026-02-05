/**
 * Humanize AI v2.5.0
 * The simplest neural humanization engine.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Core Elements
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const dropbtn = document.getElementById('dropbtn');
    const detectorDropdown = document.getElementById('aiContentDetectorDropdown');
    const dropdownValue = document.getElementById('dropdownValue');
    const rangeSlider = document.getElementById('myRange');
    const sliderValDisplay = document.getElementById('sliderVal');
    const inputTextBox = document.getElementById('input-text-box');
    const outputTextBox = document.getElementById('copyText');
    const rewriteBtn = document.getElementById('rewriteBtn');
    const mainCopyBtn = document.getElementById('mainCopyBtn');
    const quickCopyBtn = document.getElementById('copyBtn');
    const exportBtn = document.getElementById('exportBtn');
    const clearInputBtn = document.getElementById('clearInput');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    const wordCountSpan = document.getElementById('wordCount');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const inputScan = document.getElementById('inputScan');
    const outputScan = document.getElementById('outputScan');
    const modeCards = document.querySelectorAll('.mode-card');
    const tooltip = document.getElementById('custom-tooltip');

    let currentMode = 'standard';
    let history = [];

    // --- INITIALIZATION ---
    async function init() {
        try {
            const data = await chrome.storage.local.get(["apiKey", "rangeSlider", "detector", "theme", "history", "mode"]);

            // Theme setup - Default to Light
            const effectiveTheme = data.theme || 'light';
            setTheme(effectiveTheme);

            // Data Restore
            if (data.apiKey) apiKeyInput.value = data.apiKey;
            if (data.rangeSlider) {
                rangeSlider.value = data.rangeSlider;
                updateSliderDisplay(data.rangeSlider);
            }
            if (data.detector) updateDetectorDisplay(data.detector);
            if (data.mode) setMode(data.mode);

            // History
            if (data.history) {
                history = data.history;
                renderHistory();
            }

            updateWordCount(inputTextBox.value);
        } catch (error) {
            console.error("Init Error:", error);
        }
    }

    // --- UTILITIES ---
    function updateDetectorDisplay(value) {
        dropdownValue.value = value;
        dropbtn.innerHTML = `<span>${value}</span> <i class="fa-solid fa-caret-down"></i>`;
    }

    function updateSliderDisplay(val) {
        sliderValDisplay.textContent = `Intensity: ${Math.round(val * 100)}%`;
    }

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        themeIcon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    function setMode(mode) {
        currentMode = mode;
        modeCards.forEach(card => {
            card.classList.toggle('active', card.dataset.mode === mode);
        });
        chrome.storage.local.set({ mode });
    }

    function updateWordCount(text) {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        wordCountSpan.textContent = words.length;
    }

    function showTooltip(message, active = true) {
        tooltip.textContent = message;
        tooltip.style.display = active ? "inline-block" : "none";
        if (active) setTimeout(() => (tooltip.style.display = "none"), 3000);
    }

    /**
     * Triggers a fast typewriting effect for generated results
     * @param {HTMLElement} element - Target textarea
     * @param {string} text - Content to type
     */
    async function typeText(element, text) {
        element.value = "";
        element.classList.add('typing');
        const words = text.split(' ');
        for (let i = 0; i < words.length; i++) {
            element.value += words[i] + (i < words.length - 1 ? " " : "");
            element.scrollTop = element.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        element.classList.remove('typing');
        element.classList.add('pulse-animation');
        setTimeout(() => element.classList.remove('pulse-animation'), 2000);
    }

    /**
     * Resolves the appropriate API endpoint based on authentication state
     * @param {string} apiKey 
     * @returns {string} URL endpoint
     */
    function getAPIURL(apiKey) {
        return apiKey ? 'https://deceptioner.site/ping-api' : 'https://deceptioner.site/no-signup-ping-api';
    }

    /**
     * Downloads output content as a .txt file
     * @param {string} content 
     */
    function downloadOutput(content) {
        if (!content) return;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Authentify_Result_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showTooltip("Exported to Document");
    }

    function addToHistory(text) {
        const item = {
            id: Date.now(),
            text: text,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        history.unshift(item);
        if (history.length > 5) history.pop();
        chrome.storage.local.set({ history });
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = `<div style="text-align: center; opacity: 0.4; font-size: 0.75rem; padding: 1rem;">No history yet.</div>`;
            return;
        }
        historyList.innerHTML = history.map(item => `
            <div class="history-item" data-text="${item.text.replace(/"/g, '&quot;')}">
                <div class="history-item-text">${item.text}</div>
                <div class="history-item-date">${item.date}</div>
            </div>
        `).join('');

        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                outputTextBox.value = item.dataset.text;
                showTooltip("Restored from history");
            });
        });
    }

    // --- EVENT LISTENERS ---

    modeCards.forEach(card => {
        card.addEventListener('click', () => setMode(card.dataset.mode));
    });

    inputTextBox.addEventListener('input', (e) => updateWordCount(e.target.value));
    rangeSlider.addEventListener('input', (e) => updateSliderDisplay(e.target.value));

    // Theme Toggle with storage sync
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        chrome.storage.local.set({ theme: newTheme });
    });

    clearInputBtn.addEventListener('click', () => {
        inputTextBox.value = "";
        updateWordCount("");
    });

    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        chrome.storage.local.set({ history });
        renderHistory();
    });

    saveApiKeyBtn.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        await chrome.storage.local.set({ apiKey: key });
        showTooltip("Key Linked ✓");
    });

    dropbtn.addEventListener('click', (e) => {
        e.stopPropagation();
        detectorDropdown.classList.toggle('show');
    });

    detectorDropdown.querySelectorAll('a').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const val = e.target.dataset.value;
            updateDetectorDisplay(val);
            detectorDropdown.classList.remove('show');
            chrome.storage.local.set({ detector: val });
        });
    });

    window.addEventListener('click', () => detectorDropdown.classList.remove('show'));
    // Copy Content Logic
    const copyToClipboard = async (text, btnElement) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            showTooltip("Synchronized ✓");

            // Visual feedback on button
            if (btnElement) {
                const originalHTML = btnElement.innerHTML;
                btnElement.classList.add('success');
                btnElement.innerHTML = `<i class="fa-solid fa-check"></i> Applied to Clipboard`;
                setTimeout(() => {
                    btnElement.classList.remove('success');
                    btnElement.innerHTML = originalHTML;
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    mainCopyBtn.addEventListener('click', () => copyToClipboard(outputTextBox.value, mainCopyBtn));
    quickCopyBtn.addEventListener('click', () => copyToClipboard(outputTextBox.value, quickCopyBtn));

    // Export Logic
    exportBtn.addEventListener('click', () => downloadOutput(outputTextBox.value));

    // --- ENGINE CORE ---
    rewriteBtn.addEventListener('click', async () => {
        const text = inputTextBox.value.trim();
        if (!text) return showTooltip("Input Required", 'error'); // UI State: Executing
        rewriteBtn.disabled = true;
        const originalBtnHTML = rewriteBtn.innerHTML;
        rewriteBtn.innerHTML = `<i class="fa-solid fa-gear fa-spin"></i> Neural Processing...`;
        outputTextBox.classList.add('loading-skeleton');
        inputScan.style.display = "block";
        outputScan.style.display = "block";

        try {
            const payload = {
                inputTextBox: text,
                rangeSlider: rangeSlider.value,
                aiContentDetectorDropdown: dropdownValue.value,
                apiKey: apiKeyInput.value,
                mode: currentMode
            };

            // Send to background script to bypass CORS
            chrome.runtime.sendMessage({
                type: 'HUMANIZE_REQUEST',
                url: getAPIURL(apiKeyInput.value),
                payload: payload
            }, (response) => {
                outputTextBox.classList.remove('loading-skeleton');
                inputScan.style.display = "none";
                outputScan.style.display = "none";

                if (chrome.runtime.lastError) {
                    showTooltip("Service Worker Offline", 'error');
                    resetBtn();
                    return;
                }

                if (response && response.status === 'success') {
                    typeText(outputTextBox, response.paraphrased_text);
                    addToHistory(response.paraphrased_text);
                    showTooltip("Generation Complete ✓");
                    rewriteBtn.innerHTML = `<i class="fa-solid fa-check-double"></i> Verified Human`;
                    rewriteBtn.style.background = "var(--success-color)";
                } else {
                    showTooltip(response?.msg || "Protocol Failure", 'error');
                }

                setTimeout(resetBtn, 2000);
            });

        } catch (error) {
            console.error("AuthPro Engine Error:", error);
            showTooltip("Runtime Error", 'error');
            inputScan.style.display = "none";
            outputScan.style.display = "none";
            resetBtn();
        }

        function resetBtn() {
            rewriteBtn.disabled = false;
            rewriteBtn.style.background = "";
            rewriteBtn.innerHTML = originalBtnHTML;
        }
    });

    init();
});
