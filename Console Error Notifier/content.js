// Injected at document_start to catch early errors
window.addEventListener('error', (event) => {
    chrome.runtime.sendMessage({
        type: 'JS_ERROR',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
    });
});

window.addEventListener('unhandledrejection', (event) => {
    chrome.runtime.sendMessage({
        type: 'JS_ERROR',
        message: 'Unhandled Promise Rejection: ' + event.reason
    });
});
