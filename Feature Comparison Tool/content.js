function injectComparison() {
    chrome.storage.local.get(['last_competitor'], (res) => {
        if (!res.last_competitor) return;

        if (document.querySelector('#floating-compare-box')) return;

        const box = document.createElement('div');
        box.id = 'floating-compare-box';
        box.innerHTML = `
      <div style="font-weight:700; margin-bottom:5px;">Comparison with ${res.last_competitor.name}</div>
      <div style="font-size:10px; color:#64748b;">${res.last_competitor.price} / mo vs Current</div>
      <button id="close-compare" style="margin-top:5px; font-size:9px;">Close</button>
    `;
        document.body.appendChild(box);
        document.getElementById('close-compare').onclick = () => box.remove();
    });
}

setTimeout(injectComparison, 2000);
