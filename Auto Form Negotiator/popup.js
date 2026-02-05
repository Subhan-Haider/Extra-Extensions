document.getElementById('draft-btn').onclick = async () => {
    const draft = document.getElementById('draft');
    draft.style.display = 'block';
    draft.textContent = 'Analyzing pricing context...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = new URL(tab.url).hostname;

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const prices = Array.from(document.querySelectorAll('.price, .pricing, [class*="price"]'))
                .map(el => el.innerText)
                .filter(t => t.includes('$'))
                .slice(0, 3);
            return prices.join(', ');
        }
    }, (results) => {
        const context = results[0].result || "Standard Pricing";
        const text = `Subject: Inquiry regarding specialized pricing for ${domain}\n\nHi Team,\n\nI'm very interested in your platform, particularly the offerings around ${context}. However, my current budget is quite optimized. Do you offer seasonal discounts, startup pricing, or non-profit rates? \n\nLooking forward to joining your ecosystem.`;
        draft.textContent = text;

        // Auto-copy to clipboard
        navigator.clipboard.writeText(text);
        alert('Negotiation draft copied to clipboard!');
    });
};
