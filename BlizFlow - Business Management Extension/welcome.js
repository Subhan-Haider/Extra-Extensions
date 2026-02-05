// Welcome page script
// Handles button clicks for the welcome page

function openSettings() {
  try {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      // Fallback: open options page in new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    }
    // Close welcome page after a short delay
    setTimeout(() => {
      if (window.close) {
        window.close();
      }
    }, 100);
  } catch (error) {
    console.error('Error opening settings:', error);
    // Fallback: try opening options page directly
    try {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    } catch (e) {
      console.error('Could not open options page:', e);
    }
  }
}

function openDashboard() {
  try {
    chrome.tabs.create({ url: 'https://blizflow.online/dashboard' });
    // Close welcome page after a short delay
    setTimeout(() => {
      if (window.close) {
        window.close();
      }
    }, 100);
  } catch (error) {
    console.error('Error opening dashboard:', error);
  }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Get buttons by ID (more reliable)
  const getStartedBtn = document.getElementById('get-started-btn');
  const dashboardBtn = document.getElementById('dashboard-btn');
  
  // Add event listeners
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openSettings();
    });
  } else {
    console.error('Get Started button not found');
  }
  
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openDashboard();
    });
  } else {
    console.error('Dashboard button not found');
  }
});

