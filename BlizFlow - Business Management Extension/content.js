// Content Script - Runs on all web pages
// Provides features that work on any website

(function() {
  'use strict';

  // Initialize extension features on page
  if (document.body) {
    initExtensionFeatures();
  } else {
    document.addEventListener('DOMContentLoaded', initExtensionFeatures);
  }

  function initExtensionFeatures() {
    try {
      // Check if already initialized
      if (document.getElementById('blizflow-fab')) {
        return;
      }

      // Add BlizFlow floating button
      addFloatingButton();
      
      // Add context menu integration
      setupContextMenu();
      
      // Add page scanning for business data
      scanPageForData();
      
      // Add quick capture features
      setupQuickCapture();
    } catch (error) {
      console.error('Error initializing extension features:', error);
    }
  }

  function addFloatingButton() {
    try {
      // Don't add on extension pages
      if (window.location.protocol === 'chrome-extension:') {
        return;
      }

      // Create floating action button
      const fab = document.createElement('div');
      fab.id = 'blizflow-fab';
      fab.innerHTML = '⚡';
      fab.setAttribute('aria-label', 'BlizFlow Quick Actions');
      fab.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transition: transform 0.2s;
        user-select: none;
      `;
      
      fab.addEventListener('mouseenter', () => {
        fab.style.transform = 'scale(1.1)';
      });
      
      fab.addEventListener('mouseleave', () => {
        fab.style.transform = 'scale(1)';
      });
      
      fab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showQuickMenu();
      });
      
      if (document.body) {
        document.body.appendChild(fab);
      } else {
        // Wait for body to be available
        setTimeout(() => {
          if (document.body) {
            document.body.appendChild(fab);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error adding floating button:', error);
    }
  }

  function showQuickMenu() {
    // Show quick action menu
    const menu = document.createElement('div');
    menu.id = 'blizflow-quick-menu';
    menu.innerHTML = `
      <div class="blizflow-menu-item" data-action="capture-email">📧 Capture Email</div>
      <div class="blizflow-menu-item" data-action="capture-phone">📞 Capture Phone</div>
      <div class="blizflow-menu-item" data-action="create-invoice">📄 Create Invoice</div>
      <div class="blizflow-menu-item" data-action="add-client">👤 Add Client</div>
      <div class="blizflow-menu-item" data-action="track-time">⏱️ Track Time</div>
      <div class="blizflow-menu-item" data-action="open-dashboard">🚀 Open Dashboard</div>
    `;
    
    menu.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      padding: 8px;
      z-index: 10001;
      min-width: 200px;
    `;
    
    // Add styles for menu items (if not already loaded from content.css)
    if (!document.getElementById('blizflow-menu-styles')) {
      const style = document.createElement('style');
      style.id = 'blizflow-menu-styles';
      style.textContent = `
        .blizflow-menu-item {
          padding: 12px 16px;
          cursor: pointer;
          border-radius: 6px;
          font-size: 14px;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #333;
        }
        .blizflow-menu-item:hover {
          background: #f5f5f5;
        }
        .blizflow-menu-item:active {
          background: #e5e5e5;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add click handlers
    menu.querySelectorAll('.blizflow-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        handleQuickAction(item.dataset.action);
        menu.remove();
      });
    });
    
    document.body.appendChild(menu);
    
    // Close menu on outside click
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target.id !== 'blizflow-fab') {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }

  function handleQuickAction(action) {
    // Check if extension context is valid
    if (!chrome.runtime || !chrome.runtime.id) {
      showNotification('Extension context invalidated. Please reload the extension.');
      return;
    }

    switch (action) {
      case 'capture-email':
        captureEmailFromPage();
        break;
      case 'capture-phone':
        capturePhoneFromPage();
        break;
      case 'create-invoice':
        try {
          chrome.runtime.sendMessage({ action: 'openQuickInvoice' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error opening invoice:', chrome.runtime.lastError);
              showNotification('Error: Could not open invoice page');
            }
          });
        } catch (error) {
          console.error('Error sending message:', error);
          showNotification('Error: Extension context invalidated. Please reload the extension.');
        }
        break;
      case 'add-client':
        try {
          chrome.runtime.sendMessage({ action: 'openQuickClient' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error opening client:', chrome.runtime.lastError);
              showNotification('Error: Could not open client page');
            }
          });
        } catch (error) {
          console.error('Error sending message:', error);
          showNotification('Error: Extension context invalidated. Please reload the extension.');
        }
        break;
      case 'track-time':
        try {
          chrome.runtime.sendMessage({ action: 'openTimeTracker' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error opening time tracker:', chrome.runtime.lastError);
              showNotification('Error: Could not open time tracker');
            }
          });
        } catch (error) {
          console.error('Error sending message:', error);
          showNotification('Error: Extension context invalidated. Please reload the extension.');
        }
        break;
      case 'open-dashboard':
        try {
          chrome.runtime.sendMessage({ action: 'openDashboard' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error opening dashboard:', chrome.runtime.lastError);
              showNotification('Error: Could not open dashboard');
            }
          });
        } catch (error) {
          console.error('Error sending message:', error);
          showNotification('Error: Extension context invalidated. Please reload the extension.');
        }
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  function captureEmailFromPage() {
    // Find all email addresses on page
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const text = document.body.innerText;
    const emails = text.match(emailRegex) || [];
    
    if (emails.length > 0) {
      const uniqueEmails = [...new Set(emails)];
      chrome.runtime.sendMessage({
        action: 'capturedEmails',
        emails: uniqueEmails,
      });
      
      showNotification(`Captured ${uniqueEmails.length} email(s)`);
    } else {
      showNotification('No emails found on this page');
    }
  }

  function capturePhoneFromPage() {
    // Find phone numbers
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const text = document.body.innerText;
    const phones = text.match(phoneRegex) || [];
    
    if (phones.length > 0) {
      const uniquePhones = [...new Set(phones)];
      chrome.runtime.sendMessage({
        action: 'capturedPhones',
        phones: uniquePhones,
      });
      
      showNotification(`Captured ${uniquePhones.length} phone number(s)`);
    } else {
      showNotification('No phone numbers found on this page');
    }
  }

  function setupContextMenu() {
    // Context menu is handled by manifest.json
    // This function can add additional context menu handlers
  }

  function scanPageForData() {
    // Scan page for business-relevant data
    const businessData = {
      emails: [],
      phones: [],
      addresses: [],
      companyNames: [],
    };
    
    // Extract emails
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const emails = document.body.innerText.match(emailRegex) || [];
    businessData.emails = [...new Set(emails)];
    
    // Extract phone numbers
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = document.body.innerText.match(phoneRegex) || [];
    businessData.phones = [...new Set(phones)];
    
    // Store extracted data
    if (businessData.emails.length > 0 || businessData.phones.length > 0) {
      chrome.storage.local.set({ lastScannedData: businessData });
    }
  }

  function setupQuickCapture() {
    // Add keyboard shortcut listeners
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+B for BlizFlow quick capture
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        showQuickMenu();
      }
    });
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #667eea;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10002;
      font-size: 14px;
      animation: slideIn 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request && request.action === 'capturePageData') {
        scanPageForData();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep channel open for async response
  });

  console.log('BlizFlow Extension Content Script loaded');
})();

