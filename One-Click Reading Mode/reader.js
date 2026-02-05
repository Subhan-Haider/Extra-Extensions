(function () {
    if (document.getElementById('reader-mode-overlay')) {
        document.getElementById('reader-mode-overlay').remove();
        document.body.style.overflow = 'auto';
        return;
    }

    // Basic content extraction
    const article = document.querySelector('article') || document.querySelector('main') || document.body;
    const content = article.cloneNode(true);

    // Remove scripts, styles, and common ad classes
    const clean = (node) => {
        const junk = node.querySelectorAll('script, style, iframe, nav, footer, ads, .ads, .sidebar');
        junk.forEach(j => j.remove());
    };
    clean(content);

    const overlay = document.createElement('div');
    overlay.id = 'reader-mode-overlay';
    overlay.innerHTML = `
    <div class="reader-container">
      <button class="reader-close">Esc to Close</button>
      <div class="reader-content">
        ${content.innerHTML}
      </div>
    </div>
  `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.querySelector('.reader-close').onclick = () => {
        overlay.remove();
        document.body.style.overflow = 'auto';
    };
})();
