// Logic to handle sticky notes
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ADD_NOTE') {
        createNote();
    }
});

function createNote(text = '', x = 100, y = 100) {
    const note = document.createElement('div');
    note.className = 'pn-sticky-note';
    note.style.left = x + 'px';
    note.style.top = y + 'px';
    note.innerHTML = `
    <div class="pn-drag-handle"></div>
    <textarea placeholder="Write something...">${text}</textarea>
    <button class="pn-close">×</button>
  `;

    document.body.appendChild(note);

    const textarea = note.querySelector('textarea');
    const close = note.querySelector('.pn-close');
    const handle = note.querySelector('.pn-drag-handle');

    // Auto-save on change
    textarea.addEventListener('input', saveNotes);
    close.addEventListener('click', () => {
        note.remove();
        saveNotes();
    });

    // Simple Drag Logic
    let isDragging = false;
    handle.onmousedown = (e) => {
        isDragging = true;
        let offset = { x: e.clientX - note.offsetLeft, y: e.clientY - note.offsetTop };
        document.onmousemove = (e) => {
            if (!isDragging) return;
            note.style.left = (e.clientX - offset.x) + 'px';
            note.style.top = (e.clientY - offset.y) + 'px';
        };
        document.onmouseup = () => {
            isDragging = false;
            saveNotes();
        };
    };
}

function saveNotes() {
    const notes = Array.from(document.querySelectorAll('.pn-sticky-note')).map(n => ({
        text: n.querySelector('textarea').value,
        x: parseInt(n.style.left),
        y: parseInt(n.style.top)
    }));
    const url = window.location.href;
    chrome.storage.local.set({ [url]: notes });
}

// Restore on load
chrome.storage.local.get([window.location.href], (result) => {
    const notes = result[window.location.href] || [];
    notes.forEach(n => createNote(n.text, n.x, n.y));
});
