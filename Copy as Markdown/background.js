chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "copy-markdown",
        title: "Copy as Markdown",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "copy-markdown") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: convertToMarkdown
        });
    }
});

function convertToMarkdown() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const container = document.createElement('div');
    container.appendChild(selection.getRangeAt(0).cloneContents());

    let markdown = container.innerHTML
        .replace(/<b>(.*?)<\/b>/g, '**$1**')
        .replace(/<i>(.*?)<\/i>/g, '*$1*')
        .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n');

    // Strip remaining tags
    markdown = markdown.replace(/<[^>]*>?/gm, '');

    const el = document.createElement('textarea');
    el.value = markdown.trim();
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    alert('Copied as Markdown!');
}
