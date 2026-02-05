document.addEventListener('DOMContentLoaded', () => {
    const countEl = document.getElementById('history-count');
    const clearBtn = document.getElementById('clear-history');

    function updateDisplay() {
        chrome.storage.local.get(null, (items) => {
            const urls = Object.keys(items).filter(k => k.startsWith('http'));
            countEl.textContent = `${urls.length} pages`;
        });
    }

    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved scroll positions?')) {
            chrome.storage.local.clear(updateDisplay);
        }
    });

    updateDisplay();
});
