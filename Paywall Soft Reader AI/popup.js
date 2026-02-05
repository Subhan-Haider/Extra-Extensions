document.querySelector('.btn').onclick = async () => {
    const btn = document.querySelector('.btn');
    const summaryBox = document.querySelector('.summary-box');

    btn.textContent = 'Analyzing Metadata...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const meta = document.querySelector('meta[name="description"]')?.content || "";
            const headings = Array.from(document.querySelectorAll('h1, h2')).map(h => h.innerText).join(' ');
            return meta + " " + headings;
        }
    }, async (results) => {
        const text = results[0].result;

        chrome.storage.local.get(['global_ai_key'], async (res) => {
            if (!res.global_ai_key) {
                summaryBox.textContent = 'API Key Missing! Set it in AI Assistant Settings.';
                btn.textContent = 'Generate Soft Summary';
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
                        messages: [{
                            role: 'user',
                            content: `Based on this metadata and headings, summarize what this article is about in 3 bullets: "${text}"`
                        }]
                    })
                });

                const data = await response.json();
                summaryBox.textContent = data.choices[0].message.content;
            } catch (e) {
                summaryBox.textContent = 'AI Generation Failed.';
            }
            btn.textContent = 'Generate Soft Summary';
        });
    });
};
