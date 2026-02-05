chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'JS_ERROR') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'JS Error Detected',
            message: msg.message,
            priority: 2
        });
    }
});
