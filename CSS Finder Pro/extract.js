(function () {
    document.body.style.cursor = 'crosshair';

    const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const el = e.target;
        const styles = window.getComputedStyle(el);

        const results = {
            tag: el.tagName.toLowerCase(),
            css: {
                'background-color': styles.backgroundColor,
                'color': styles.color,
                'padding': styles.padding,
                'font-family': styles.fontFamily.split(',')[0],
                'font-size': styles.fontSize,
                'border-radius': styles.borderRadius
            }
        };

        // Simple Tailwind Mapper
        const tw = [];
        if (styles.display === 'flex') tw.push('flex');
        if (results.css['font-size'] === '16px') tw.push('text-base');
        if (results.css['border-radius'] !== '0px') tw.push('rounded');

        alert(`CSS Found for <${results.tag}>\n\nTailwind Guess: ${tw.join(' ')}\n\nProperties:\n${JSON.stringify(results.css, null, 2)}`);

        document.body.style.cursor = 'default';
        document.removeEventListener('click', onClick, true);
    };

    document.addEventListener('click', onClick, true);
})();
