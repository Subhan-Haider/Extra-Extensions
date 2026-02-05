function injectHints() {
    const codeArea = document.querySelector('.monaco-editor, .ace_editor');
    if (!codeArea) return;

    const hintBox = document.createElement('div');
    hintBox.id = 'discrete-hint-box';
    hintBox.innerHTML = `
    <div style="font-size:10px; opacity:0.6; margin-bottom:5px;">💡 Hint Mode</div>
    <div id="hint-content">Try using Two Pointers or a Hash Map for O(n) complexity.</div>
  `;

    document.body.appendChild(hintBox);
}

setTimeout(injectHints, 2000);
