(function () {
    chrome.storage.local.get(['condition'], (res) => {
        if (!res.condition) return;

        const textFound = document.body.innerText.includes(res.condition);
        if (textFound) {
            chrome.runtime.sendMessage({ type: 'CONDITION_MET', text: res.condition });
        }
    });
})();
