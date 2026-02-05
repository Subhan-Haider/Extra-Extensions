(function () {
    document.body.style.cursor = 'cell';

    const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const path = getSelector(e.target);
        chrome.storage.local.get(['bookmarks'], (res) => {
            const bookmarks = res.bookmarks || [];
            bookmarks.push({ path, url: window.location.href, tag: e.target.tagName.toLowerCase() });
            chrome.storage.local.set({ bookmarks });
        });

        alert('Selector Bookmarked: ' + path);
        document.body.style.cursor = 'default';
        document.removeEventListener('click', onClick, true);
    };

    const getSelector = (el) => {
        let path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break;
            } else {
                let sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() == selector) nth++;
                }
                if (nth != 1) selector += ":nth-of-type(" + nth + ")";
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
    }

    document.addEventListener('click', onClick, true);
})();
