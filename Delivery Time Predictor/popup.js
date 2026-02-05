document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const text = document.body.innerText.toLowerCase();
            const match = text.match(/delivery in (\d+)/);
            return match ? parseInt(match[1]) : 2; // Default to 2 days
        }
    }, (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) {
            console.log("Unable to scan this page.");
            return;
        }
        const theirEst = results[0].result || 2;
        const realEst = theirEst + Math.floor(Math.random() * 3) + 1; // Add 1-3 days jitter

        document.querySelectorAll('.val')[0].textContent = theirEst + ' Days';
        document.querySelectorAll('.val')[1].textContent = realEst + ' Days';

        const truth = document.querySelector('.truth');
        truth.style.color = realEst > theirEst ? '#ef4444' : '#10b981';
    });
});
