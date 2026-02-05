document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // Very basic price detection
            const priceSelectors = ['.a-price-whole', '.price', '#priceblock_ourprice', '[data-price]'];
            let price = 0;
            for (const s of priceSelectors) {
                const el = document.querySelector(s);
                if (el) {
                    price = parseFloat(el.innerText.replace(/[^0-9.]/g, ''));
                    if (price > 0) break;
                }
            }
            return price;
        }
    }, (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) return;
        const currentPrice = results[0].result || 0;
        const marketAvg = currentPrice ? currentPrice * 0.85 : 0; // Simulated market average

        const fill = document.getElementById('meter-fill');
        const status = document.getElementById('status');
        const info = document.getElementById('price-info');

        if (currentPrice > 0) {
            const overpaid = ((currentPrice - marketAvg) / marketAvg) * 100;
            fill.style.width = Math.min(Math.max(overpaid, 20), 100) + '%';

            if (overpaid > 10) {
                status.textContent = 'OVERPAYING!';
                status.style.color = '#ef4444';
            } else {
                status.textContent = 'GOOD DEAL';
                status.style.color = '#22c55e';
            }

            info.innerHTML = `Market avg: $${marketAvg.toFixed(2)}<br>Current: $${currentPrice.toFixed(2)}`;
        } else {
            status.textContent = 'NO PRICE FOUND';
            info.textContent = 'Navigate to a product page.';
        }
    });
});
