document.getElementById('toggle-enabled').addEventListener('change', (e) => {
    chrome.storage.local.set({ enabled: e.target.checked });
});

chrome.storage.local.get(['enabled'], (result) => {
    if (result.enabled !== undefined) {
        document.getElementById('toggle-enabled').checked = result.enabled;
    }
});
