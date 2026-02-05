// Logic to save scroll position
let scrollTimeout;

window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        const scrollPos = window.scrollY;
        const url = window.location.href;
        chrome.storage.local.set({ [url]: scrollPos });
    }, 1000); // Debounce saves
});

// Restore on load
window.addEventListener('load', () => {
    const url = window.location.href;
    chrome.storage.local.get([url], (result) => {
        if (result[url]) {
            window.scrollTo({
                top: result[url],
                behavior: 'smooth'
            });
        }
    });
});
