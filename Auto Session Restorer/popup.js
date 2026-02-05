document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-current');
    const nameInput = document.getElementById('session-name');
    const list = document.getElementById('session-list');
    const activeCount = document.getElementById('active-count');

    loadSessions();

    saveBtn.addEventListener('click', () => {
        const name = nameInput.value || `Session ${new Date().toLocaleTimeString()}`;

        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            const urls = tabs.map(t => t.url);
            const newSession = {
                id: 's' + Date.now(),
                name: name,
                tabs: urls,
                timestamp: Date.now()
            };

            chrome.storage.local.get(['sessions'], (result) => {
                const sessions = result.sessions || [];
                sessions.unshift(newSession);
                chrome.storage.local.set({ sessions }, () => {
                    nameInput.value = '';
                    loadSessions();
                });
            });
        });
    });

    function loadSessions() {
        chrome.storage.local.get(['sessions'], (result) => {
            const sessions = result.sessions || [];
            activeCount.textContent = `${sessions.length} Sessions Active`;

            if (sessions.length === 0) {
                list.innerHTML = `
          <div class="empty-state">
            <p>No active sessions found.</p>
            <span>Save your first workspace above.</span>
          </div>`;
                return;
            }

            list.innerHTML = '';
            sessions.forEach(session => {
                const card = document.createElement('div');
                card.className = 'session-card';
                card.innerHTML = `
          <div class="session-header">
            <span class="session-title">${session.name}</span>
            <span class="tab-count">${session.tabs.length} Tabs</span>
          </div>
          <div class="session-actions">
            <button class="action-btn restore-btn" data-id="${session.id}">Restore</button>
            <button class="action-btn delete-btn" data-id="${session.id}">Delete</button>
          </div>
        `;

                card.querySelector('.restore-btn').addEventListener('click', () => {
                    session.tabs.forEach(url => chrome.tabs.create({ url }));
                });

                card.querySelector('.delete-btn').addEventListener('click', () => {
                    const updated = sessions.filter(s => s.id !== session.id);
                    chrome.storage.local.set({ sessions: updated }, loadSessions);
                });

                list.appendChild(card);
            });
        });
    }
});
