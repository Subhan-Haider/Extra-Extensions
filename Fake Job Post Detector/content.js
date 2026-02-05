// Basic heuristic for fake jobs
function analyzeJob() {
    const text = document.body.innerText.toLowerCase();
    const RED_FLAGS = [
        'immediate start', 'no experience needed', 'telegram', 'whatsapp',
        'earn daily', 'unlimited earning', 'high commission only'
    ];

    const foundFlags = RED_FLAGS.filter(flag => text.includes(flag));

    if (foundFlags.length >= 2) {
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:40px; background:#ef4444; color:white; display:flex; align-items:center; justify-content:center; z-index:999999; font-weight:bold;';
        banner.textContent = '🚩 WARNING: This job post matches multiple scam patterns.';
        document.body.prepend(banner);
    }
}

setTimeout(analyzeJob, 2000);
