document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const scoreRing = document.querySelector('.score-ring');
    const skillsList = document.querySelector('.missing-skills');

    // Simulated logic looking for keywords on page
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const keywords = ['react', 'node', 'typescript', 'aws', 'docker', 'graphql', 'next.js'];
            const text = document.body.innerText.toLowerCase();
            return keywords.filter(k => text.includes(k));
        }
    }, (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) return;
        const found = results[0].result;
        const score = Math.round((found.length / 7) * 100);

        scoreRing.textContent = score + '%';
        scoreRing.style.borderColor = score > 70 ? '#10b981' : (score > 40 ? '#f59e0b' : '#ef4444');

        const missing = ['react', 'node', 'typescript', 'aws', 'docker', 'graphql', 'next.js'].filter(k => !found.includes(k));
        skillsList.innerHTML = `<strong>Missing Keywords:</strong> ${missing.join(', ') || 'None! You are a perfect match.'}`;
    });
});
