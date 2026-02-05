const TRACKING_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'msclkid'
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        const url = new URL(changeInfo.url);
        let changed = false;

        TRACKING_PARAMS.forEach(param => {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
                changed = true;
            }
        });

        if (changed) {
            chrome.tabs.update(tabId, { url: url.toString() });
            chrome.storage.local.get(['cleanCount'], (res) => {
                chrome.storage.local.set({ cleanCount: (res.cleanCount || 0) + 1 });
            });
        }
    }
});
