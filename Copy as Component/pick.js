document.addEventListener('mouseover', (e) => {
    e.target.style.outline = '2px solid #6366f1';
    e.target.style.cursor = 'crosshair';
}, true);

document.addEventListener('mouseout', (e) => {
    e.target.style.outline = '';
}, true);

document.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    let html = el.outerHTML;

    // Simple conversion logic
    let jsx = html
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        .replace(/style="([^"]*)"/g, (match, styleStr) => {
            const styleObj = styleStr.split(';').filter(s => s.trim()).reduce((acc, s) => {
                const [prop, val] = s.split(':');
                const camelProp = prop.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                acc[camelProp] = val.trim();
                return acc;
            }, {});
            return `style={${JSON.stringify(styleObj)}}`;
        });

    const textArea = document.createElement('textarea');
    textArea.value = jsx;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    // Clean up
    document.querySelectorAll('*').forEach(el => {
        el.style.outline = '';
        el.style.cursor = '';
    });

    alert('Component code copied to clipboard!');
}, { capture: true, once: true });
