// Listen for input fields
document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        addFixButton(e.target);
    }
});

function addFixButton(target) {
    if (target.parentElement.querySelector('.tone-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'tone-btn';
    btn.textContent = '✨ Tone Fix';
    btn.style.position = 'absolute';

    const rect = target.getBoundingClientRect();
    btn.style.top = (window.scrollY + rect.top + 5) + 'px';
    btn.style.right = (window.innerWidth - rect.right + 5) + 'px';

    document.body.appendChild(btn);

    btn.onclick = async () => {
        const originalText = target.value || target.innerText;
        btn.textContent = 'Fixing...';

        // Communication with background/storage for API call
        chrome.runtime.sendMessage({ type: 'FIX_TONE', text: originalText }, (response) => {
            if (response && response.fixed) {
                if (target.tagName === 'TEXTAREA') target.value = response.fixed;
                else target.innerText = response.fixed;
            }
            btn.textContent = '✨ Tone Fix';
        });
    };

    target.addEventListener('focusout', () => {
        setTimeout(() => btn.remove(), 2000);
    });
}
