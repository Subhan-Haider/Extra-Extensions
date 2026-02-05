(function () {
    chrome.storage.local.get(['formRules'], (result) => {
        const rules = result.formRules || {
            'first name': 'John',
            'last name': 'Doe',
            'email': 'john.doe@example.com',
            'phone': '123-456-7890',
            'address': '123 Main St'
        };

        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            const label = (input.name || input.id || input.placeholder || '').toLowerCase();

            for (const [key, value] of Object.entries(rules)) {
                if (label.includes(key)) {
                    input.value = value;
                    // Trigger events
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        });
    });
})();
