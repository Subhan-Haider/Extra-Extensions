document.addEventListener('DOMContentLoaded', () => {
    renderTabs();

    document.getElementById('clear-all').addEventListener('click', () => {
        chrome.storage.local.get(['tabTimes'], (result) => {
            const tabTimes = result.tabTimes || {};
            const staleThreshold = 2 * 60 * 60 * 1000; // 2 hours
            const now = Date.now();

            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    const openTime = tabTimes[tab.id] || now;
                    if (now - openTime > staleThreshold && !tab.active) {
                        chrome.tabs.remove(tab.id);
                    }
                });
                setTimeout(renderTabs, 500);
            });
        });
    });
});

function renderTabs() {
    const tabList = document.getElementById('tab-list');
    const debtCount = document.getElementById('debt-count');
    const totalTimeEl = document.getElementById('total-time');
    const oldestTabEl = document.getElementById('oldest-tab-time');
    const debtCircle = document.getElementById('debt-circle');

    chrome.tabs.query({}, (tabs) => {
        chrome.storage.local.get(['tabTimes'], (result) => {
            const tabTimes = result.tabTimes || {};
            const now = Date.now();

            // Filter out internal pages and sort by age (oldest first)
            const managedTabs = tabs.filter(t => !t.url.startsWith('chrome://'));

            managedTabs.sort((a, b) => {
                const timeA = tabTimes[a.id] || now;
                const timeB = tabTimes[b.id] || now;
                return timeA - timeB;
            });

            tabList.innerHTML = '';
            let totalDebtMs = 0;
            let oldestMs = 0;

            managedTabs.forEach(tab => {
                const openTime = tabTimes[tab.id] || now;
                const ageMs = now - openTime;
                totalDebtMs += ageMs;
                if (ageMs > oldestMs) oldestMs = ageMs;

                const tabItem = document.createElement('div');
                tabItem.className = 'tab-item';
                tabItem.innerHTML = `
          <div class="tab-info">
            <div class="tab-title">${tab.title}</div>
            <div class="tab-meta">
              <span class="time-badge">${formatDuration(ageMs)}</span>
              <span class="url">${new URL(tab.url).hostname}</span>
            </div>
          </div>
          <button class="close-btn" data-id="${tab.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        `;

                tabItem.querySelector('.close-btn').addEventListener('click', () => {
                    chrome.tabs.remove(tab.id, () => {
                        tabItem.style.opacity = '0';
                        tabItem.style.transform = 'translateX(20px)';
                        setTimeout(renderTabs, 200);
                    });
                });

                tabList.appendChild(tabItem);
            });

            // Update Dashboard
            debtCount.textContent = managedTabs.length;
            totalTimeEl.textContent = formatDuration(totalDebtMs);
            oldestTabEl.textContent = oldestMs > 0 ? formatDuration(oldestMs) : '--';

            // Update Debt Ring (max 50 tabs for 100%)
            const percentage = Math.min((managedTabs.length / 30) * 100, 100);
            debtCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);

            if (managedTabs.length === 0) {
                tabList.innerHTML = '<div class="loader">Zero debt. You are a productivity god!</div>';
            }
        });
    });
}

function formatDuration(ms) {
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
}
