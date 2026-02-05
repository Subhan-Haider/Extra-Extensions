document.getElementById('save-bookmark').onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const btn = document.getElementById('save-bookmark');

    btn.textContent = 'Summarizing...';

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText.substring(0, 3000)
    }, async (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) {
            btn.textContent = 'Bookmark current tab';
            return;
        }
        const text = results[0].result;

        chrome.storage.local.get(['global_ai_key'], async (res) => {
            if (!res.global_ai_key) {
                btn.textContent = 'API Key Missing';
                return;
            }

            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${res.global_ai_key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'google/gemini-2.0-flash-exp:free',
                        messages: [{ role: 'user', content: `Summarize this page in 1 sentence for a bookmark description: "${text}"` }]
                    })
                });

                const data = await response.json();
                const summary = data.choices[0].message.content;

                // Create the actual bookmark
                chrome.bookmarks.create({
                    title: tab.title,
                    url: tab.url
                }, (newBookmark) => {
                    // Store summary in local storage associated with URL
                    chrome.storage.local.set({ [`bookmark_desc_${tab.url}`]: summary });
                    btn.textContent = 'Saved with AI Summary!';
                });
            } catch (e) {
                btn.textContent = 'Saved (No AI)';
                chrome.bookmarks.create({ title: tab.title, url: tab.url });
            }
        });
    });
};
