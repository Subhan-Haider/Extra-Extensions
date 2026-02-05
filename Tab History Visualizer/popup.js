document.addEventListener('DOMContentLoaded', () => {
    const timeline = document.querySelector('.timeline');

    chrome.tabs.query({}, (tabs) => {
        timeline.innerHTML = '';
        tabs.slice(0, 5).forEach((tab, i) => {
            const node = document.createElement('div');
            node.className = 'journey-node';
            node.innerHTML = `
        <div class="time">${new Date().toLocaleTimeString()}</div>
        <div class="title">${tab.title}</div>
      `;
            timeline.appendChild(node);
        });
    });
});
