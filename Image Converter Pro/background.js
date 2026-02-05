// Background Service Worker for Image Converter Pro Extension

// Install event - set up context menu
chrome.runtime.onInstalled.addListener(() => {
    // Create context menu items
    chrome.contextMenus.create({
        id: "convertImage",
        title: "Convert Image with Image Converter Pro",
        contexts: ["image"]
    });

    chrome.contextMenus.create({
        id: "convertAllImages",
        title: "Convert All Images on Page",
        contexts: ["page"]
    });

    chrome.contextMenus.create({
        id: "openConverter",
        title: "Open Image Converter Pro",
        contexts: ["page", "selection"]
    });

    console.log("Image Converter Pro extension installed");
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "convertImage") {
        // Save image URL for quick convert
        chrome.storage.local.set({ lastImageUrl: info.srcUrl });
        
        // Open converter with the image URL
        chrome.tabs.create({
            url: chrome.runtime.getURL(`index.html?imageUrl=${encodeURIComponent(info.srcUrl)}`)
        });
    } else if (info.menuItemId === "convertAllImages") {
        // Send message to content script to extract all images
        chrome.tabs.sendMessage(tab.id, {
            action: "extractAllImages"
        });
    } else if (info.menuItemId === "openConverter") {
        // Open converter in new tab
        chrome.tabs.create({
            url: chrome.runtime.getURL("index.html")
        });
    }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadFile") {
        // Handle file download
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: request.saveAs || false
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, downloadId });
            }
        });
        return true; // Keep channel open for async response
    }

    if (request.action === "saveToStorage") {
        // Save data to chrome.storage
        chrome.storage.local.set({ [request.key]: request.value }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === "getFromStorage") {
        // Get data from chrome.storage
        chrome.storage.local.get([request.key], (result) => {
            sendResponse({ success: true, value: result[request.key] });
        });
        return true;
    }

    if (request.action === "openConverter") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("index.html")
        });
        sendResponse({ success: true });
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("index.html")
    });
});

// Listen for downloads
chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    // Allow user to choose filename
    suggest({ filename: downloadItem.filename });
});

