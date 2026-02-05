// Track tab open times
chrome.tabs.onCreated.addListener((tab) => {
    const timestamp = Date.now();
    chrome.storage.local.get(['tabTimes'], (result) => {
        const tabTimes = result.tabTimes || {};
        tabTimes[tab.id] = timestamp;
        chrome.storage.local.set({ tabTimes });
    });
});

chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.get(['tabTimes'], (result) => {
        const tabTimes = result.tabTimes || {};
        delete tabTimes[tabId];
        chrome.storage.local.set({ tabTimes });
    });
});

// Initialize existing tabs on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
        const tabTimes = {};
        const now = Date.now();
        tabs.forEach(tab => {
            tabTimes[tab.id] = now; // Best guess for existing tabs
        });
        chrome.storage.local.set({ tabTimes });
    });
});
