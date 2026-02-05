chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SAVE_CLIP') {
        chrome.storage.local.get(['history'], (result) => {
            let history = result.history || [];
            // Don't save duplicates in a row
            if (history[0] === message.text) return;

            history.unshift(message.text);
            // Keep only last 50
            history = history.slice(0, 50);
            chrome.storage.local.set({ history });
        });
    }
});
