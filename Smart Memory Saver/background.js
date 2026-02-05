let tabActivity = {};

chrome.tabs.onActivated.addListener((info) => {
    tabActivity[info.tabId] = Date.now();
});

chrome.alarms.create('check-memory', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'check-memory') {
        const now = Date.now();
        chrome.tabs.query({ active: false }, (tabs) => {
            tabs.forEach(t => {
                const lastActive = tabActivity[t.id] || 0;
                // Freeze if inactive for > 30 mins
                if (now - lastActive > 30 * 60 * 1000) {
                    chrome.tabs.discard(t.id);
                }
            });
        });
    }
});
