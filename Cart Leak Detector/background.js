// Basic detector for session replay scripts
const TRACKING_PATTERNS = [
    'fullstory.com', 'hotjar.com', 'logrocket.com', 'inspectlet.com'
];

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        const isTracker = TRACKING_PATTERNS.some(p => details.url.includes(p));
        if (isTracker) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'Privacy Alert!',
                message: 'Aggressive cart tracking script detected on this page.'
            });
        }
    },
    { urls: ["<all_urls>"] }
);
