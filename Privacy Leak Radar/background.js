const leaks = {};

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.tabId === -1) return;
        const url = new URL(details.url);
        const mainUrl = new URL(details.initiator || 'http://unknown');

        if (url.hostname !== mainUrl.hostname && !url.hostname.includes('google-analytics')) {
            if (!leaks[details.tabId]) leaks[details.tabId] = [];
            leaks[details.tabId].unshift({ host: url.hostname, time: new Date().toLocaleTimeString() });
            leaks[details.tabId] = leaks[details.tabId].slice(0, 20);
        }
    },
    { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_LEAKS') sendResponse(leaks[msg.tabId] || []);
});
