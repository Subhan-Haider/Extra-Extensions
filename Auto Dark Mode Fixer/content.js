(function () {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
        const style = document.createElement('style');
        style.textContent = `
      body, html { background-color: #000 !important; color: #e4e4e7 !important; }
      a { color: #38bdf8 !important; }
      div, section, header, nav { border-color: #27272a !important; }
    `;
        document.documentElement.appendChild(style);
    }
})();
