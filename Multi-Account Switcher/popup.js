document.querySelectorAll('.profile').forEach(p => {
    p.onclick = () => {
        const name = p.querySelector('.name').textContent;
        alert(`Switching session context to ${name}... [Simulation: In production this would swap cookie stores]`);
    };
});
