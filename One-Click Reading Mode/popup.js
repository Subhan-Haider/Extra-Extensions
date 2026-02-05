document.getElementById('toggle-reader').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['reader.js']
    });

    // Inject CSS
    chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['popup.css']
    });
});

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.theme-btn.active').classList.remove('active');
        btn.classList.add('active');
        // Save preference
        chrome.storage.local.set({ theme: btn.dataset.theme });
    });
});
