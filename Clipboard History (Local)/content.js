// Capture copies on any page
document.addEventListener('copy', () => {
    setTimeout(async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                chrome.runtime.sendMessage({ type: 'SAVE_CLIP', text });
            }
        } catch (e) {
            console.log('Clipboard read failed: ', e);
        }
    }, 100);
});
