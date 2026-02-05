(function () {
    const host = window.location.hostname;
    chrome.storage.local.get([host], (res) => {
        const settings = res[host] || { dark: false, brightness: 100, contrast: 100 };
        applySettings(settings);
    });

    function applySettings(s) {
        let filter = '';
        if (s.dark) filter += 'invert(1) hue-rotate(180deg) ';
        filter += `brightness(${s.brightness}%) contrast(${s.contrast}%)`;

        document.documentElement.style.filter = filter;
        // Don't invert images and videos
        const media = document.querySelectorAll('img, video, canvas');
        media.forEach(m => {
            m.style.filter = s.dark ? 'invert(1) hue-rotate(180deg)' : 'none';
        });
    }
})();
