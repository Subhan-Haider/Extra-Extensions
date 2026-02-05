document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        injectMagicButton(e.target);
    }
});

function injectMagicButton(target) {
    if (target.parentElement.querySelector('.ai-magic-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'ai-magic-btn';
    btn.textContent = '✨ AI Fill';

    btn.onclick = () => {
        const label = target.placeholder || target.name || 'this field';
        target.value = `Drafting smart response for ${label}...`;
        // AI fetch call would happen here using global key
    };

    target.parentElement.appendChild(btn);
}
