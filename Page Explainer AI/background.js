chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "explain-this",
        title: "Explain like I'm 12",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "explain-this") {
        const text = info.selectionText;

        chrome.storage.local.get(['global_ai_key'], async (res) => {
            if (!res.global_ai_key) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'API Key Missing',
                    message: 'Please set your key in AI Assistant Settings.'
                });
                return;
            }

            // Show notification that AI is thinking
            chrome.notifications.create('thinking', {
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'AI is thinking...',
                message: 'Analyzing the text for you.'
            });

            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${res.global_ai_key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'google/gemini-2.0-flash-exp:free',
                        messages: [{
                            role: 'user',
                            content: `Explain this like I'm 12 years old: "${text}"`
                        }]
                    })
                });

                const data = await response.json();
                const explanation = data.choices[0].message.content;

                chrome.notifications.clear('thinking');
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'Explanation',
                    message: explanation.substring(0, 500) // Notification limit
                });

            } catch (e) {
                chrome.notifications.clear('thinking');
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'Error',
                    message: 'Failed to connect to AI.'
                });
            }
        });
    }
});
