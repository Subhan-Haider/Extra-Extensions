function injectUnsubscribe() {
    const emailBody = document.querySelector('.ii.gt');
    if (!emailBody || document.querySelector('#ai-unsubscribe-btn')) return;

    const links = Array.from(emailBody.querySelectorAll('a'));
    const unsubLink = links.find(l => l.innerText.toLowerCase().includes('unsubscribe'));

    if (unsubLink) {
        const btn = document.createElement('button');
        btn.id = 'ai-unsubscribe-btn';
        btn.textContent = '🕊️ Instant Unsubscribe';
        btn.onclick = () => window.open(unsubLink.href, '_blank');

        document.querySelector('.gE.iv.gt').appendChild(btn);
    }
}

setInterval(injectUnsubscribe, 2000);
