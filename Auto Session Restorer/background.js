chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        const session = sessions.find(s => s.id === alarm.name);

        if (session && session.autoRestore) {
            restoreSession(session);
        }
    });
});

function restoreSession(session) {
    session.tabs.forEach(url => {
        chrome.tabs.create({ url });
    });
}

// Background listener for scheduling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCHEDULE_SESSION') {
        const { id, when } = message;
        chrome.alarms.create(id, { when });
    }
});
