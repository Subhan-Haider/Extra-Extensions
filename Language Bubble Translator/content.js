// Create bubble
const bubble = document.createElement('div');
bubble.id = 'translation-bubble';
document.body.appendChild(bubble);

document.addEventListener('mouseover', (e) => {
    const text = window.getSelection().toString().trim();
    if (text && text.length < 100) {
        bubble.textContent = `Translating: ${text}...`;
        bubble.style.display = 'block';
        bubble.style.top = (e.pageY + 15) + 'px';
        bubble.style.left = (e.pageX + 15) + 'px';

        // Placeholder translation
        setTimeout(() => {
            bubble.textContent = `Translated: [Simulated Result]`;
        }, 500);
    } else {
        bubble.style.display = 'none';
    }
});
