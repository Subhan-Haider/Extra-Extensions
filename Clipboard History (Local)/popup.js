document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('clip-list');
    const search = document.getElementById('filter');
    const clear = document.getElementById('clear-all');

    function render(filter = '') {
        chrome.storage.local.get(['history'], (result) => {
            const history = result.history || [];
            const filtered = history.filter(text =>
                text.toLowerCase().includes(filter.toLowerCase())
            );

            list.innerHTML = '';
            filtered.forEach(text => {
                const card = document.createElement('div');
                card.className = 'clip-card';
                card.innerHTML = `<div class="clip-text">${escapeHtml(text)}</div>`;

                card.addEventListener('click', () => {
                    navigator.clipboard.writeText(text);
                    card.classList.add('copied');
                    setTimeout(() => card.classList.remove('copied'), 1000);
                });

                list.appendChild(card);
            });

            if (filtered.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:40px; color:#737373;">No snippets found.</div>';
            }
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    search.addEventListener('input', (e) => render(e.target.value));
    clear.addEventListener('click', () => {
        chrome.storage.local.set({ history: [] }, render);
    });

    render();
});
