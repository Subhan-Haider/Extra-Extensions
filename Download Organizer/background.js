chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    chrome.storage.local.get(['rules', 'enabled'], (result) => {
        if (result.enabled === false) return;

        const rules = result.rules || {
            'pdf': 'Documents/PDFs',
            'jpg': 'Images',
            'png': 'Images',
            'zip': 'Archives/Zips',
            'mp4': 'Videos',
            'mp3': 'Audio'
        };

        const ext = item.filename.split('.').pop().toLowerCase();

        if (rules[ext]) {
            suggest({ filename: `${rules[ext]}/${item.filename}` });
        } else {
            suggest();
        }
    });
    return true; // Keep listener open for async suggest
});
