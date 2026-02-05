// Logic to detect and convert times
const TIME_REGEX = /(\d{1,2}:\d{2})\s?(AM|PM)?\s?([A-Z]{3,4})?/gi;

document.addEventListener('mouseover', (e) => {
    if (e.target.innerText && TIME_REGEX.test(e.target.innerText)) {
        const text = e.target.innerText;
        const match = text.match(TIME_REGEX)[0];
        showTooltip(e, match);
    } else {
        hideTooltip();
    }
});

let tooltip = null;

function showTooltip(e, timeStr) {
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'tz-tooltip';
        document.body.appendChild(tooltip);
    }

    // Basic conversion (simplified for demonstration)
    // In a real version, we'd use Luxon or similar to parse 'EST' etc.
    const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    tooltip.innerHTML = `
    <div class="tz-header">Local Time</div>
    <div class="tz-value">${localTime}</div>
    <div class="tz-sub">Your Zone</div>
  `;

    tooltip.style.left = e.pageX + 10 + 'px';
    tooltip.style.top = e.pageY + 10 + 'px';
    tooltip.style.display = 'block';
}

function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none';
}
