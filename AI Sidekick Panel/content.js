// Floating sidebar logic
const sidekick = document.createElement('div');
sidekick.id = 'ai-sidekick-container';
sidekick.innerHTML = `
  <div class="sidekick-header">AI Sidekick <button id="sidekick-close">×</button></div>
  <div class="sidekick-chat" id="sidekick-messages">
    <div class="msg bot">Hi! I've read this page. How can I help?</div>
  </div>
  <div class="sidekick-input-area">
    <input type="text" id="sidekick-query" placeholder="Ask about this page...">
  </div>
`;

document.body.appendChild(sidekick);

document.getElementById('sidekick-close').onclick = () => sidekick.style.display = 'none';

document.getElementById('sidekick-query').onkeydown = async (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value;
        addMessage(query, 'user');
        e.target.value = '';

        // Simulate thinking
        const botMsg = addMessage('...', 'bot');

        // AI fetch call would happen here using global key
        setTimeout(() => {
            botMsg.textContent = "Based on this page, it seems the main focus is on product efficiency and user privacy.";
        }, 1000);
    }
};

function addMessage(text, role) {
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;
    msg.textContent = text;
    document.getElementById('sidekick-messages').appendChild(msg);
    return msg;
}
