document.addEventListener('DOMContentLoaded', () => {
    const keyInput = document.getElementById('api-key');
    const providerSelect = document.getElementById('provider');
    const saveBtn = document.getElementById('save-btn');
    const status = document.getElementById('status');

    // Load existing settings
    chrome.storage.local.get(['global_ai_key', 'global_ai_provider'], (res) => {
        if (res.global_ai_key) keyInput.value = res.global_ai_key;
        if (res.global_ai_provider) providerSelect.value = res.global_ai_provider;
    });

    saveBtn.addEventListener('click', () => {
        const key = keyInput.value.trim();
        const provider = providerSelect.value;

        if (!key) {
            showStatus('Please enter a key', 'error');
            return;
        }

        chrome.storage.local.set({
            global_ai_key: key,
            global_ai_provider: provider
        }, () => {
            showStatus('Settings saved successfully!', 'success');

            // Visual feedback on button
            saveBtn.textContent = 'Saved!';
            setTimeout(() => {
                saveBtn.textContent = 'Save Configuration';
            }, 2000);
        });
    });

    function showStatus(msg, type) {
        status.textContent = msg;
        status.className = 'status ' + type;
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
});
