document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.url.includes('checkout') || tab.url.includes('confirm')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const text = document.body.innerText;
                const orderId = text.match(/Order #([A-Z0-9-]+)/)?.[1] || "Unknown";
                return { orderId, date: new Date().toLocaleDateString() };
            }
        }, (results) => {
            const data = results[0].result;
            document.getElementById('order-info').textContent = `Order Found: ${data.orderId}`;
        });
    }
});

document.getElementById('track-btn').onclick = () => {
    alert('Warranty added to your local tracker! You will be reminded 1 month before expiry.');
};
