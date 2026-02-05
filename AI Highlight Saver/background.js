chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({ id: "save-with-meaning", title: "Save with AI Meaning", contexts: ["selection"] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-with-meaning") {
        // Logic to call AI and save to storage
        chrome.storage.local.get(['highlights'], (res) => {
            const list = res.highlights || [];
            list.push({ text: info.selectionText, date: new Date().toLocaleDateString(), context: 'Context analysis pending...' });
            chrome.storage.local.set({ highlights: list });
        });
    }
});
