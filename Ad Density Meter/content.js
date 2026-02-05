function calculateAdDensity() {
    const adSelectors = [
        '[id*="google_ads"]', '[class*="adsbygoogle"]', '[id*="ad-"]', '[class*="ad-"]',
        'ins.adsbygoogle', 'div[data-ad-unit]', '.ad-container', '#ad-banner'
    ];

    let adArea = 0;
    adSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 10 && rect.height > 10) {
                adArea += rect.width * rect.height;
            }
        });
    });

    const totalArea = window.innerWidth * window.innerHeight;
    const density = Math.round((adArea / totalArea) * 100);

    return {
        density: density,
        count: document.querySelectorAll(adSelectors.join(',')).length
    };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_DENSITY') {
        sendResponse(calculateAdDensity());
    }
});
