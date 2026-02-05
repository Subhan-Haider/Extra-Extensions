chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('stock-check-')) {
        const url = alarm.name.replace('stock-check-', '');
        checkStock(url);
    }
});

async function checkStock(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();

        // Heuristic for stock status
        const inStock = !html.toLowerCase().includes('out of stock') &&
            (html.toLowerCase().includes('add to cart') || html.toLowerCase().includes('in stock'));

        if (inStock) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'Item in Stock!',
                message: `Your item at ${new URL(url).hostname} is back!`,
                buttons: [{ title: 'Open Page' }]
            });
            // Stop checking once found
            chrome.alarms.clear(`stock-check-${url}`);
        }
    } catch (e) {
        console.error('Stock check failed', e);
    }
}

chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
    // Logic to open the URL would go here
});
