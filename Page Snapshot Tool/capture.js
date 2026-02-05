(function () {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshot-${new Date().getTime()}.html`;
    a.click();
})();
