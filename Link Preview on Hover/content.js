let previewTimer;
let previewFrame;

document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.href.startsWith('http')) {
        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
            showPreview(link.href, e.pageX, e.pageY);
        }, 800);
    }
});

document.addEventListener('mouseout', (e) => {
    const link = e.target.closest('a');
    if (link) {
        clearTimeout(previewTimer);
    }
});

function showPreview(url, x, y) {
    if (previewFrame) previewFrame.remove();

    previewFrame = document.createElement('div');
    previewFrame.className = 'lp-frame';
    previewFrame.innerHTML = `
    <div class="lp-header">PREVIEW: ${new URL(url).hostname}</div>
    <iframe src="${url}"></iframe>
    <div class="lp-footer">Alt + Click to open in new tab</div>
  `;

    document.body.appendChild(previewFrame);

    // Position
    const winWidth = window.innerWidth;
    const frameWidth = 400;
    let left = x + 20;
    if (left + frameWidth > winWidth) left = x - frameWidth - 20;

    previewFrame.style.left = left + 'px';
    previewFrame.style.top = y + 20 + 'px';

    // Remove on move away
    const close = () => {
        previewFrame.remove();
        document.removeEventListener('mousemove', checkDist);
    };

    const checkDist = (me) => {
        const dist = Math.sqrt(Math.pow(me.pageX - x, 2) + Math.pow(me.pageY - y, 2));
        if (dist > 500) close();
    };
    document.addEventListener('mousemove', checkDist);
}
