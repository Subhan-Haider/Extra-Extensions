// Basic content extractor for common sites
function getContext() {
    if (window.location.hostname === 'mail.google.com') {
        return document.querySelector('.ii.gt')?.innerText || '';
    }
    if (window.location.hostname === 'www.linkedin.com') {
        return document.querySelector('.msg-s-event-listitem__body')?.innerText || '';
    }
    return document.body.innerText.substring(0, 1000); // Fallback
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_REPLY') {
        const context = getContext();
        // Communicate with background/API
        chrome.runtime.sendMessage({ type: 'CALL_AI_REPLY', context }, (res) => {
            sendResponse(res);
        });
        return true;
    }
});
