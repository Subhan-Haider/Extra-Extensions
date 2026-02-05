document.addEventListener('DOMContentLoaded', () => {
    const currentSiteEl = document.getElementById('current-site');
    const timerEl = document.getElementById('active-timer');
    const usageList = document.getElementById('usage-list');
    const setLimitBtn = document.getElementById('set-limit');
    const dateDisplay = document.getElementById('date-display');

    // Update date
    const now = new Date();
    dateDisplay.textContent = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    updateDisplay();
    setInterval(updateDisplay, 1000);

    function updateDisplay() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                const url = new URL(tabs[0].url);
                const domain = url.hostname;
                currentSiteEl.textContent = domain;

                chrome.storage.local.get(['usage', 'limits'], (result) => {
                    const usage = result.usage || {};
                    const limits = result.limits || {};

                    const timeMs = usage[domain] || 0;
                    timerEl.textContent = formatTime(timeMs);

                    if (limits[domain]) {
                        document.getElementById('limit-info').textContent = `Limit: ${limits[domain]} mins`;
                    }

                    // Update list
                    renderUsageList(usage);
                });
            }
        });
    }

    function renderUsageList(usage) {
        usageList.innerHTML = '';
        const sorted = Object.entries(usage).sort((a, b) => b[1] - a[1]);

        sorted.slice(0, 5).forEach(([domain, ms]) => {
            const item = document.createElement('div');
            item.className = 'usage-item';
            item.innerHTML = `
        <span>${domain}</span>
        <strong>${formatTime(ms)}</strong>
      `;
            usageList.appendChild(item);
        });
    }

    setLimitBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const domain = new URL(tabs[0].url).hostname;
            const limit = prompt(`Set daily limit for ${domain} in minutes:`, "30");

            if (limit) {
                chrome.storage.local.get(['limits'], (result) => {
                    const limits = result.limits || {};
                    limits[domain] = parseInt(limit);
                    chrome.storage.local.set({ limits }, updateDisplay);
                });
            }
        });
    });

    function formatTime(ms) {
        const totalSecs = Math.floor(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const hours = Math.floor(mins / 60);

        if (hours > 0) {
            return `${hours}:${(mins % 60).toString().padStart(2, '0')}:${(totalSecs % 60).toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${(totalSecs % 60).toString().padStart(2, '0')}`;
    }
});
