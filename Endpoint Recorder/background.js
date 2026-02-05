chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.type === 'xmlhttprequest' || details.type === 'fetch') {
            chrome.storage.local.get(['endpoints'], (res) => {
                const list = res.endpoints || [];
                list.unshift({ url: details.url, method: details.method, time: Date.now() });
                chrome.storage.local.set({ endpoints: list.slice(0, 50) });
            });
        }
    },
    { urls: ["<all_urls>"] }
);
