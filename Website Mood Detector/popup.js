document.getElementById('analyze').onclick = async () => {
    const ring = document.getElementById('ring');
    const moodText = document.getElementById('mood-text');
    const biasText = document.getElementById('bias-text');

    ring.textContent = '🧠';
    moodText.textContent = 'Extracting content...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Script to extract page text
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText.substring(0, 5000)
    }, async (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) return;
        const text = results[0].result;

        moodText.textContent = 'AI is analyzing...';

        chrome.storage.local.get(['global_ai_key'], async (res) => {
            if (!res.global_ai_key) {
                ring.textContent = '🔑';
                moodText.textContent = 'API Key Missing';
                biasText.textContent = 'Set your key in AI Assistant Settings.';
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
                        messages: [{ role: 'user', content: `Analyze the mood and bias of this text in 10 words: "${text}"` }]
                    })
                });

                const data = await response.json();
                const analysis = data.choices[0].message.content;

                ring.textContent = '✨';
                moodText.textContent = 'Tone: ' + (analysis.split(',')[0] || 'Neutral');
                biasText.textContent = 'Bias: ' + analysis;
            } catch (e) {
                ring.textContent = '❌';
                moodText.textContent = 'Error';
            }
        });
    });
};
