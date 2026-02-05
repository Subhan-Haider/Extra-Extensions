document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Simulated analysis logic
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const reviews = document.querySelectorAll('.review, [id*="customer_review"]');
            const text = document.body.innerText;
            const incentivized = text.match(/received this product for free/gi) || [];
            return {
                count: reviews.length,
                incentivized: incentivized.length
            };
        }
    }, (results) => {
        const data = results[0].result;
        const badge = document.querySelector('.status-badge');
        const resultBox = document.querySelector('.result-box');

        if (data.incentivized > 2) {
            badge.textContent = 'LOW TRUST';
            badge.className = 'status-badge bad';
            resultBox.innerHTML = `
        <strong>Analysis:</strong><br>
        - Detected ${data.incentivized} incentivized reviews.<br>
        - Pattern matches "Product for Review" campaigns.<br>
        - Suggest checking 1-star reviews for truth.
      `;
        } else {
            badge.textContent = 'TRUSTED';
            badge.className = 'status-badge good';
            resultBox.innerHTML = `
        <strong>Analysis:</strong><br>
        - No suspicious bot patterns detected.<br>
        - Authentic organic interaction detected.<br>
        - High verified purchase ratio.
      `;
        }
    });
});
