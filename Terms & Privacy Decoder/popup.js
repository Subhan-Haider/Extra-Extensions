document.getElementById('scan-btn').onclick = async () => {
    const scanBtn = document.getElementById('scan-btn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const indicator = document.getElementById('indicator');

    scanBtn.style.display = 'none';
    loading.style.display = 'block';
    results.style.display = 'none';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText.substring(0, 10000)
    }, async (scriptResults) => {
        if (chrome.runtime.lastError || !scriptResults || !scriptResults[0]) return;
        const text = scriptResults[0].result;

        chrome.storage.local.get(['global_ai_key'], async (res) => {
            if (!res.global_ai_key) {
                loading.textContent = 'API Key Missing! Set it in AI Assistant Settings.';
                indicator.style.backgroundColor = '#ef4444';
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
                            content: `Summarize the 3 most important privacy points from this TOS (one per line, format: BAD/GOOD: Description): "${text}"`
                        }]
                    })
                });

                const data = await response.json();
                const raw = data.choices[0].message.content.split('\n');

                loading.style.display = 'none';
                results.style.display = 'block';
                indicator.style.backgroundColor = '#10b981';

                // Map results to UI
                for (let i = 0; i < 3; i++) {
                    const line = raw[i] || 'GOOD: Standard compliance';
                    const isBad = line.toUpperCase().includes('BAD');
                    const badge = document.getElementById(`badge-${i + 1}`);
                    const textEl = document.getElementById(`text-${i + 1}`);

                    badge.textContent = isBad ? 'Red Flag' : 'Good';
                    badge.className = 'badge ' + (isBad ? 'risky' : 'good');
                    textEl.textContent = line.split(': ')[1] || line;
                }

            } catch (e) {
                loading.textContent = 'Connection Error';
                indicator.style.backgroundColor = '#ef4444';
            }
        });
    });
};
