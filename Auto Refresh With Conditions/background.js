chrome.storage.onChanged.addListener((changes) => {
    if (changes.active && changes.active.newValue) {
        chrome.alarms.create('refresh-alarm', { periodInMinutes: (parseInt(changes.interval.newValue || 30) / 60) });
    } else if (changes.active && !changes.active.newValue) {
        chrome.alarms.clear('refresh-alarm');
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'refresh-alarm') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.reload(tabs[0].id, {}, () => {
                    // After reload, inject the check script
                    setTimeout(() => {
                        chrome.scripting.executeScript({
                            target: { tabId: tabs[0].id },
                            files: ['check.js']
                        });
                    }, 2000);
                });
            }
        });
    }
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'CONDITION_MET') {
        chrome.alarms.clear('refresh-alarm');
        chrome.storage.local.set({ active: false });
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.svg',
            title: 'Condition Met!',
            message: `The text "${msg.text}" was found on the page.`
        });
    }
});
