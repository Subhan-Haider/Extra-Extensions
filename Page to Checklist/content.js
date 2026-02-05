function extractSteps() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, li'));
    const steps = headings.filter(h => h.innerText.length < 100 && h.innerText.length > 5);

    const container = document.createElement('div');
    container.id = 'checklist-sidebar';
    container.innerHTML = `
    <div style="font-weight:bold; margin-bottom:15px; border-bottom:1px solid #ddd; padding-bottom:5px;">Mission Checklist</div>
    <div id="steps-container"></div>
  `;

    steps.slice(0, 10).forEach((s, i) => {
        const item = document.createElement('div');
        item.style.marginBottom = '10px';
        item.innerHTML = `<input type="checkbox"> <label>${s.innerText}</label>`;
        container.querySelector('#steps-container').appendChild(item);
    });

    document.body.appendChild(container);
}

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_CHECKLIST') extractSteps();
});
