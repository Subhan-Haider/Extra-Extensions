(async function () {
    const links = Array.from(document.querySelectorAll('a[href]'));

    for (const link of links) {
        const url = link.href;
        if (!url.startsWith('http')) continue;

        try {
            const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            // Note: 'no-cors' means we can't always see the status, but for many sites, a failing request will throw an error.
            // A more robust version would use a background proxy.
        } catch (e) {
            link.style.outline = '2px dashed #ef4444';
            link.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            link.title = 'Potential Broken Link';
        }
    }
    alert('Link scan complete.');
})();
