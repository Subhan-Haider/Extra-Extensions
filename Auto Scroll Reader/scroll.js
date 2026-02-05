let scrollInterval;
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'START_SCROLL') {
        clearInterval(scrollInterval);
        scrollInterval = setInterval(() => {
            window.scrollBy(0, 1);
        }, 100 / msg.speed);
    } else {
        clearInterval(scrollInterval);
    }
});
