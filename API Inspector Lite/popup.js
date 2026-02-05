document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('log-list');
    const clearBtn = document.getElementById('clear-btn');

    function updateLogs() {
        chrome.storage.local.get(['api_logs'], (res) => {
            list.innerHTML = '';
            const logs = res.api_logs || [];
            if (logs.length === 0) {
                list.innerHTML = '<div class="empty">No requests detected yet.</div>';
                return;
            }
            logs.forEach(log => {
                const item = document.createElement('div');
                item.className = 'log-item';
                item.innerHTML = `
          <span class="method">${log.method}</span>
          <span class="url" title="${log.url}">${log.url}</span>
          <span class="time">${log.time}</span>
        `;
                list.appendChild(item);
            });
        });
    }

    clearBtn.onclick = () => {
        chrome.storage.local.set({ api_logs: [] }, updateLogs);
    };

    updateLogs();
    // Refresh every 2 seconds if popup is open
    setInterval(updateLogs, 2000);
});
