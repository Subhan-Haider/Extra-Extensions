document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const records = performance.getEntriesByType('resource');
            let totalSize = 0;
            records.forEach(r => totalSize += (r.transferSize || 0));
            const loadTime = performance.now();
            return {
                sizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                requests: records.length,
                timeSec: (loadTime / 1000).toFixed(2)
            };
        }
    }, (results) => {
        const data = results[0].result;
        document.getElementById('size').textContent = data.sizeMB + ' MB';
        document.getElementById('requests').textContent = data.requests;
        document.getElementById('time').textContent = data.timeSec + 's';
    });
});
