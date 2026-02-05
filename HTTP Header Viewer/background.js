let headersByTab = {};

chrome.webRequest.onResponseStarted.addListener(
    (details) => {
        if (details.tabId === -1) return;
        headersByTab[details.tabId] = details.responseHeaders;
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_HEADERS') {
        sendResponse(headersByTab[msg.tabId] || []);
    }
});
