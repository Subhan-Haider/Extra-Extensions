(function () {
    document.body.style.cursor = 'crosshair';

    const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const el = e.target;
        const styles = window.getComputedStyle(el);
        let cssText = '';

        // Pick most useful properties
        const props = ['color', 'background-color', 'font-size', 'margin', 'padding', 'display', 'position'];
        props.forEach(p => {
            cssText += `${p}: ${styles.getPropertyValue(p)};\n`;
        });

        console.log('CSS for', el.tagName, ':\n', cssText);
        alert(`Applied CSS for <${el.tagName.toLowerCase()}>\n\n${cssText}`);

        document.body.style.cursor = 'default';
        document.removeEventListener('click', onClick, true);
    };

    document.addEventListener('click', onClick, true);
})();
