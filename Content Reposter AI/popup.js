document.querySelector('.btn').onclick = async () => {
    const btn = document.querySelector('.btn');
    const textarea = document.querySelector('textarea');
    const activeTab = document.querySelector('.tab.active').textContent;

    btn.textContent = 'Generating...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText.substring(0, 5000)
    }, async (results) => {
        const text = results[0].result;

        chrome.storage.local.get(['global_ai_key'], async (res) => {
            if (!res.global_ai_key) {
                btn.textContent = 'Error: No Key';
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
                            content: `Convert this article into a 3-part ${activeTab} post: "${text}"`
                        }]
                    })
                });

                const data = await response.json();
                textarea.value = data.choices[0].message.content;
                btn.textContent = 'Generate Repost Material';
            } catch (e) {
                btn.textContent = 'Connection Error';
            }
        });
    });
};

document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelector('.tab.active').classList.remove('active');
        tab.classList.add('active');
    };
});
