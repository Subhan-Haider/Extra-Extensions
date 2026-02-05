let activeTabId = null;
let activeDomain = null;
let startTime = null;

chrome.tabs.onActivated.addListener(activeInfo => {
    updateTime();
    activeTabId = activeInfo.tabId;
    chrome.tabs.get(activeTabId, tab => {
        if (tab.url) {
            activeDomain = new URL(tab.url).hostname;
            startTime = Date.now();
        }
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        updateTime();
        activeDomain = new URL(changeInfo.url).hostname;
        startTime = Date.now();
    }
});

function updateTime() {
    if (activeDomain && startTime) {
        const elapsed = Date.now() - startTime;
        chrome.storage.local.get(['usage', 'limits'], (result) => {
            const usage = result.usage || {};
            const limits = result.limits || {};

            usage[activeDomain] = (usage[activeDomain] || 0) + elapsed;
            chrome.storage.local.set({ usage });

            // Check limits
            if (limits[activeDomain] && usage[activeDomain] > limits[activeDomain] * 60000) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'Zen Focus Alert',
                    message: `You've reached your limit for ${activeDomain}. Take a breath.`
                });
            }
        });
    }
}

// Periodic save every minute
setInterval(updateTime, 60000);
