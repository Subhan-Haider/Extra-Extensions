(function () {
    const priceRegex = /\$\d+(\.\d{2})?/;
    const match = document.body.innerText.match(priceRegex);

    if (match) {
        const price = match[0];
        const url = window.location.href;
        const hostname = window.location.hostname;

        chrome.storage.local.get(['priceHistory'], (res) => {
            const history = res.priceHistory || {};
            if (!history[url]) history[url] = [];

            const lastPrice = history[url][history[url].length - 1]?.price;
            if (lastPrice !== price) {
                history[url].push({ price, date: new Date().toLocaleDateString(), host: hostname });
                chrome.storage.local.set({ priceHistory: history });
            }
        });
    }
})();
