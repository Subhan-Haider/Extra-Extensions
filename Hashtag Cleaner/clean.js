(function () {
    const inputs = document.querySelectorAll('div[role="textbox"], textarea');
    inputs.forEach(input => {
        let text = input.innerText || input.value;
        // Keep first 3 hashtags, remove the rest
        const hashtags = text.match(/#\w+/g) || [];
        if (hashtags.length > 5) {
            const excess = hashtags.slice(5);
            excess.forEach(tag => {
                text = text.replace(tag, '');
            });
            if (input.tagName === 'TEXTAREA') input.value = text.trim();
            else input.innerText = text.trim();
            alert('Cleaned excess hashtags for clarity.');
        }
    });
})();
