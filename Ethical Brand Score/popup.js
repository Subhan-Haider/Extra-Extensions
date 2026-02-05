document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = new URL(tab.url).hostname.replace('www.', '');

    // Simulated lookup based on brand
    const scores = {
        'apple.com': { overall: 'B+', sub: 'Good', labor: 'Excellent', supply: 'Good' },
        'amazon.com': { overall: 'C', sub: 'Neutral', labor: 'Risky', supply: 'Good' },
        'patagonia.com': { overall: 'A+', sub: 'Excellent', labor: 'Excellent', supply: 'Excellent' }
    };

    const score = scores[domain] || { overall: 'B', sub: 'Good', labor: 'Good', supply: 'Neutral' };

    document.querySelector('.overall').textContent = score.overall;
    const ratings = document.querySelectorAll('.rating');
    ratings[0].textContent = score.sub;
    ratings[1].textContent = score.labor;
    ratings[2].textContent = score.supply;

    if (score.overall.includes('C')) {
        document.querySelector('.overall').style.color = '#d97706';
    } else if (score.overall.includes('A')) {
        document.querySelector('.overall').style.color = '#15803d';
    }
});
