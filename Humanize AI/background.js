/**
 * Authentify Pro - Background Service Worker
 * Handles cross-origin requests and persistence logic.
 */

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for requests from the UI (Side Panel)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'HUMANIZE_REQUEST') {
    handleHumanizeRequest(message.url, message.payload)
      .then(data => sendResponse(data))
      .catch(error => {
        console.error("Background Error:", error);
        sendResponse({ status: 'error', msg: 'Neural Grid Congestion' });
      });

    // Return true to indicate we wish to send a response asynchronously
    return true;
  }
});

async function handleHumanizeRequest(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Failure:", error);
    return { status: 'error', msg: 'Protocol Connection Failed' };
  }
}