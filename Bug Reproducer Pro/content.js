let logs = [];

// Track clicks
document.addEventListener('click', (e) => {
    logs.push({ type: 'click', target: e.target.tagName, id: e.target.id, time: Date.now() });
});

// Track input
document.addEventListener('input', (e) => {
    logs.push({ type: 'input', target: e.target.tagName, time: Date.now() });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_LOGS') sendResponse(logs);
    if (msg.type === 'CLEAR_LOGS') { logs = []; sendResponse(true); }
});
