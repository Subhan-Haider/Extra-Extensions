function organizeDMs() {
    const threads = document.querySelectorAll('.msg-conversations-container__convo-item, .x9f611.x10l6tlw');
    const URGENT_KEYWORDS = ['urgent', 'call', 'meeting', 'help', 'question'];

    threads.forEach(thread => {
        const text = thread.innerText.toLowerCase();
        const isUrgent = URGENT_KEYWORDS.some(k => text.includes(k));

        if (isUrgent) {
            thread.style.borderLeft = '4px solid #f43f5e';
            thread.style.backgroundColor = 'rgba(244, 63, 94, 0.05)';
            // Move to top if possible
            thread.parentElement.prepend(thread);
        }
    });
}

// Run periodically as DMs load
setInterval(organizeDMs, 3000);
