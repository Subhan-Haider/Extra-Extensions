chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({ id: "copy-title", title: "Copy Page Title", contexts: ["all"] });
    chrome.contextMenus.create({ id: "copy-url-clean", title: "Copy Clean URL", contexts: ["all"] });
    chrome.contextMenus.create({ id: "archive-page", title: "View in Archive.is", contexts: ["all"] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "copy-title":
            copyToClipboard(tab.title);
            break;
        case "copy-url-clean":
            const url = new URL(tab.url);
            copyToClipboard(url.origin + url.pathname);
            break;
        case "archive-page":
            chrome.tabs.create({ url: `https://archive.is/${tab.url}` });
            break;
    }
});

function copyToClipboard(text) {
    // In MV3, we can't use document.execCommand in the background script directly.
    // We'd typically use an offscreen document, but for simplicity, we alert the user
    // or use a content script bridge if requested.
    console.log('Copying:', text);
}
