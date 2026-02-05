document.getElementById('view-refurb').onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // Basic product name extraction
            const title = document.querySelector('h1')?.innerText || document.title;
            return title.split(' ').slice(0, 4).join(' '); // Search first 4 words
        }
    }, (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) return;
        const query = encodeURIComponent(results[0].result + ' refurbished');
        window.open(`https://www.backmarket.com/en-us/search?q=${query}`, '_blank');
    });
};
