document.addEventListener('DOMContentLoaded', () => {
    const patternInput = document.getElementById('pattern');
    const testStringArea = document.getElementById('test-string');
    const resultBox = document.getElementById('result-box');

    function update() {
        const pattern = patternInput.value;
        const text = testStringArea.value;

        if (!pattern || !text) {
            resultBox.innerHTML = '<span style="color:#94a3b8">Waiting for input...</span>';
            return;
        }

        try {
            const regex = new RegExp(pattern, 'g');
            const matches = text.matchAll(regex);
            let output = text;
            let matchFound = false;

            // Use replace with a function to wrap matches in highlights
            output = text.replace(regex, (match) => {
                matchFound = true;
                return `<span class="match">${match}</span>`;
            });

            if (!matchFound) {
                resultBox.innerHTML = '<span style="color:#ef4444">No matches found.</span>';
            } else {
                resultBox.innerHTML = output;
            }
        } catch (e) {
            resultBox.innerHTML = `<span style="color:#ef4444">Invalid Regex: ${e.message}</span>`;
        }
    }

    patternInput.oninput = update;
    testStringArea.oninput = update;
});
