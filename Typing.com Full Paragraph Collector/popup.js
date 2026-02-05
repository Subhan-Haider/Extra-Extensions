document.getElementById('collectBtn').addEventListener('click', async () => {
    // Run content script on current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: collectParagraph
    }, (results) => {
        if(results && results[0] && results[0].result){
            document.getElementById('paragraph').value = results[0].result;
        }
    });
});

// Function to run in page context
function collectParagraph() {
    let words = [];
    document.querySelectorAll('.word, .letter').forEach(el => {
        if(el.innerText.trim() !== "") words.push(el.innerText.trim());
    });
    // Combine words into a single paragraph
    return words.join(' ');
}
