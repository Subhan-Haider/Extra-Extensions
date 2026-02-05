document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const perf = window.performance.timing;
            const ttfb = perf.responseStart - perf.requestStart;
            const domLoad = perf.domContentLoadedEventEnd - perf.navigationStart;
            return { ttfb, domLoad };
        }
    }, (results) => {
        const data = results[0].result;
        const culprit = document.querySelector('.culprit');
        const detail = document.querySelector('.detail');

        if (data.ttfb > 1000) {
            culprit.textContent = 'Site Server';
            detail.textContent = `Server took ${data.ttfb}ms to respond. This is likely a bottleneck on their end.`;
        } else if (data.domLoad > 5000) {
            culprit.textContent = 'Heavy Page Assets';
            detail.textContent = `General loading took ${data.domLoad}ms. Your connection might be fine, but the page is bloated.`;
        } else {
            culprit.textContent = 'Minimal Latency';
            culprit.style.color = '#10b981';
            detail.textContent = 'Everything seems to be performing within normal limits.';
        }
    });
});
