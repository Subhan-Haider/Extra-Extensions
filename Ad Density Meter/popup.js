document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { type: 'GET_DENSITY' }, (res) => {
        if (chrome.runtime.lastError || !res) {
            document.querySelector('.gauge').textContent = '??';
            return;
        }

        const density = Math.min(res.density, 100);
        const gauge = document.querySelector('.gauge');
        const status = document.querySelector('.aggression');

        gauge.textContent = density + '%';
        gauge.style.borderTopColor = density > 30 ? '#ef4444' : '#22c55e';

        if (density > 40) status.textContent = 'Status: Highly Aggressive';
        else if (density > 20) status.textContent = 'Status: Moderate';
        else status.textContent = 'Status: Clean';
    });
});
