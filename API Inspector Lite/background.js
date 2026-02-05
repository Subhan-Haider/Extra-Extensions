chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.type === 'xmlhttprequest' || details.type === 'fetch') {
            chrome.storage.local.get(['api_logs'], (res) => {
                const logs = res.api_logs || [];
                logs.unshift({
                    url: details.url,
                    method: details.method,
                    time: new Date().toLocaleTimeString()
                });
                chrome.storage.local.set({ api_logs: logs.slice(0, 50) });
            });
        }
    },
    { urls: ["<all_urls>"] }
);
