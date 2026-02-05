document.getElementById('add-btn').onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    if (!url.startsWith('http')) {
        alert('Please open a valid store page.');
        return;
    }

    // Create alarm to check every 15 minutes
    chrome.alarms.create(`stock-check-${url}`, { periodInMinutes: 15 });

    alert('Monitoring started! You will be notified when this item is in stock.');
    window.close();
};
