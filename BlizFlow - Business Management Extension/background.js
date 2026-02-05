// Background Service Worker for BlizFlow Extension
// Handles auto-login, background tasks, notifications, and more

import { ExtensionFeatures } from './features/extension-features.js';
import { AutoLogin } from './features/auto-login.js';
import { NotificationService } from './features/notifications.js';
import { SyncService } from './features/sync.js';

// Lazy load API utility
let apiCache = null;
async function getApi() {
  if (apiCache) return apiCache;
  
  try {
    const apiModule = await import('./utils/api.js');
    apiCache = apiModule.api;
    return apiCache;
  } catch (error) {
    console.warn('API utility not available:', error);
    // Create a fallback API object
    apiCache = {
      isConfigured: async () => {
        const data = await chrome.storage.local.get(['apiKey', 'userData']);
        return !!(data.apiKey || data.userData?.apiKey);
      },
      getUserInfo: async () => ({ success: false, error: 'API not available' }),
      getClients: async () => ({ success: false, error: 'API not available' }),
      createClient: async () => ({ success: false, error: 'API not available' }),
    };
    return apiCache;
  }
}

// Initialize services
const extensionFeatures = new ExtensionFeatures();
const autoLogin = new AutoLogin();
const notificationService = new NotificationService();
const syncService = new SyncService();

// Extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === 'install') {
      // First time installation
      await chrome.storage.local.set({
        installed: true,
        installDate: new Date().toISOString(),
        features: {},
        settings: {
          autoLogin: true,
          notifications: true,
          sync: true,
          autoSync: true,
          syncInterval: 5, // minutes
          theme: 'light',
        },
      });
      
      // Open welcome page
      try {
        chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
      } catch (error) {
        console.warn('Could not open welcome page:', error);
      }
    } else if (details.reason === 'update') {
      // Extension updated
      console.log('Extension updated to version', chrome.runtime.getManifest().version);
    }

    // Start auto-sync if enabled
    const settings = await chrome.storage.local.get('settings');
    if (settings.settings?.autoSync !== false && settings.settings?.sync !== false) {
      const syncInterval = settings.settings?.syncInterval || 5;
      if (syncService && typeof syncService.startAutoSync === 'function') {
        syncService.startAutoSync(syncInterval);
      }
    }
  } catch (error) {
    console.error('Error during installation:', error);
  }
});

// Start auto-sync when extension starts
chrome.runtime.onStartup.addListener(async () => {
  try {
    const settings = await chrome.storage.local.get('settings');
    if (settings.settings?.autoSync !== false && settings.settings?.sync !== false) {
      const syncInterval = settings.settings?.syncInterval || 5;
      if (syncService && typeof syncService.startAutoSync === 'function') {
        syncService.startAutoSync(syncInterval);
      }
    }
  } catch (error) {
    console.error('Error starting auto-sync:', error);
  }
});

// Initialize auto-sync on service worker startup
(async () => {
  try {
    const settings = await chrome.storage.local.get('settings');
    if (settings.settings?.autoSync !== false && settings.settings?.sync !== false) {
      const syncInterval = settings.settings?.syncInterval || 5;
      if (syncService && typeof syncService.startAutoSync === 'function') {
        // Wait a bit before starting sync
        setTimeout(() => {
          syncService.startAutoSync(syncInterval);
        }, 2000);
      }
    }
  } catch (error) {
    console.error('Error initializing auto-sync:', error);
  }
})();

// Auto-login on page load
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'complete' && tab.url) {
      const settings = await chrome.storage.local.get('settings');
      if (settings.settings?.autoLogin && autoLogin) {
        await autoLogin.checkAndLogin(tab.url, tabId);
      }
    }
  } catch (error) {
    console.error('Error in tab update listener:', error);
  }
});

// Handle extension icon click (only if popup is not defined)
// Note: This won't fire if default_popup is set in manifest
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const dashboardUrl = await chrome.storage.local.get('dashboardUrl');
    if (dashboardUrl.dashboardUrl) {
      chrome.tabs.create({ url: dashboardUrl.dashboardUrl });
    } else {
      chrome.tabs.create({ url: 'https://blizflow.online/dashboard' });
    }
  } catch (error) {
    console.error('Error handling action click:', error);
  }
});

// Handle commands (keyboard shortcuts)
chrome.commands.onCommand.addListener(async (command) => {
  try {
    switch (command) {
      case 'quick-invoice':
        if (extensionFeatures && typeof extensionFeatures.quickCreateInvoice === 'function') {
          await extensionFeatures.quickCreateInvoice();
        } else {
          chrome.tabs.create({ url: 'https://blizflow.online/invoices/new' });
        }
        break;
      case 'quick-client':
        if (extensionFeatures && typeof extensionFeatures.quickAddClient === 'function') {
          await extensionFeatures.quickAddClient();
        } else {
          chrome.tabs.create({ url: 'https://blizflow.online/clients/new' });
        }
        break;
      case 'quick-expense':
        if (extensionFeatures && typeof extensionFeatures.quickAddExpense === 'function') {
          await extensionFeatures.quickAddExpense();
        } else {
          chrome.tabs.create({ url: 'https://blizflow.online/expenses/new' });
        }
        break;
      case 'open-dashboard':
        chrome.tabs.create({ url: 'https://blizflow.online/dashboard' });
        break;
      default:
        console.warn('Unknown command:', command);
    }
  } catch (error) {
    console.error('Error handling command:', error);
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (!request || !request.action) {
        sendResponse({ success: false, error: 'Invalid request' });
        return;
      }

      switch (request.action) {
        case 'getUserData':
          // Always try to get fresh data from API first if configured
          const api = await getApi();
          if (await api.isConfigured()) {
            try {
              const result = await api.getUserInfo();
              if (result.success && result.data) {
                await chrome.storage.local.set({ 
                  userData: result.data,
                  userDataLastUpdate: new Date().toISOString()
                });
                sendResponse({ success: true, data: result.data });
                break;
              }
            } catch (error) {
              console.warn('Could not fetch user data from API, using cached:', error);
            }
          }
          // Fallback to storage
          const userData = await chrome.storage.local.get('userData');
          sendResponse({ success: true, data: userData.userData });
          break;

        case 'saveUserData':
          await chrome.storage.local.set({ userData: request.data });
          sendResponse({ success: true });
          break;

        case 'autoLogin':
          if (autoLogin && typeof autoLogin.performLogin === 'function') {
            const loginResult = await autoLogin.performLogin(request.credentials);
            sendResponse(loginResult);
          } else {
            sendResponse({ success: false, error: 'Auto-login service not available' });
          }
          break;

        case 'createInvoice':
          if (extensionFeatures && typeof extensionFeatures.createInvoice === 'function') {
            const invoiceResult = await extensionFeatures.createInvoice(request.data);
            sendResponse(invoiceResult);
          } else {
            sendResponse({ success: false, error: 'Feature service not available' });
          }
          break;

        case 'createClient':
          if (extensionFeatures && typeof extensionFeatures.createClient === 'function') {
            const clientResult = await extensionFeatures.createClient(request.data);
            sendResponse(clientResult);
          } else {
            sendResponse({ success: false, error: 'Feature service not available' });
          }
          break;

        case 'addExpense':
          if (extensionFeatures && typeof extensionFeatures.addExpense === 'function') {
            const expenseResult = await extensionFeatures.addExpense(request.data);
            sendResponse(expenseResult);
          } else {
            sendResponse({ success: false, error: 'Feature service not available' });
          }
          break;

        case 'syncData':
          if (syncService && typeof syncService.sync === 'function') {
            const syncResult = await syncService.sync();
            sendResponse(syncResult);
          } else {
            sendResponse({ success: false, error: 'Sync service not available' });
          }
          break;

        case 'quickSync':
          if (syncService && typeof syncService.quickSync === 'function') {
            const syncResult = await syncService.quickSync();
            sendResponse(syncResult);
          } else {
            sendResponse({ success: false, error: 'Sync service not available' });
          }
          break;

        case 'startAutoSync':
          if (syncService && typeof syncService.startAutoSync === 'function') {
            const interval = request.interval || 5;
            syncService.startAutoSync(interval);
            const settings = await chrome.storage.local.get('settings');
            const currentSettings = settings.settings || {};
            await chrome.storage.local.set({
              settings: {
                ...currentSettings,
                autoSync: true,
                syncInterval: interval
              }
            });
            sendResponse({ success: true, message: `Auto-sync started (every ${interval} minutes)` });
          } else {
            sendResponse({ success: false, error: 'Sync service not available' });
          }
          break;

        case 'stopAutoSync':
          if (syncService && typeof syncService.stopAutoSync === 'function') {
            syncService.stopAutoSync();
            const settings = await chrome.storage.local.get('settings');
            const currentSettings = settings.settings || {};
            await chrome.storage.local.set({
              settings: {
                ...currentSettings,
                autoSync: false
              }
            });
            sendResponse({ success: true, message: 'Auto-sync stopped' });
          } else {
            sendResponse({ success: false, error: 'Sync service not available' });
          }
          break;

        case 'getNotifications':
          if (notificationService && typeof notificationService.getNotifications === 'function') {
            const notifications = await notificationService.getNotifications();
            sendResponse({ success: true, notifications });
          } else {
            sendResponse({ success: true, notifications: [] });
          }
          break;

        case 'executeFeature':
          if (extensionFeatures && typeof extensionFeatures.executeFeature === 'function') {
            const featureResult = await extensionFeatures.executeFeature(request.featureId, request.params);
            sendResponse(featureResult);
          } else {
            sendResponse({ success: false, error: 'Feature service not available' });
          }
          break;

        case 'openQuickInvoice':
          try {
            if (extensionFeatures && typeof extensionFeatures.quickCreateInvoice === 'function') {
              await extensionFeatures.quickCreateInvoice();
            } else {
              chrome.tabs.create({ url: 'https://blizflow.online/invoices/new' });
            }
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'openQuickClient':
          try {
            if (extensionFeatures && typeof extensionFeatures.quickAddClient === 'function') {
              await extensionFeatures.quickAddClient();
            } else {
              chrome.tabs.create({ url: 'https://blizflow.online/clients/new' });
            }
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'openTimeTracker':
          try {
            chrome.tabs.create({ url: 'https://blizflow.online/time-tracking' });
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'openDashboard':
          try {
            chrome.tabs.create({ url: 'https://blizflow.online/dashboard' });
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'capturedEmails':
          try {
            const emails = request.emails || [];
            if (emails.length === 0) {
              sendResponse({ success: false, error: 'No emails provided' });
              return;
            }

            const uniqueEmails = [...new Set(emails)];
            
            // Store captured emails
            const existingData = await chrome.storage.local.get('capturedData');
            const capturedData = existingData.capturedData || { emails: [], phones: [], clients: [] };
            capturedData.emails = [...new Set([...capturedData.emails, ...uniqueEmails])];
            
            // Try to automatically create clients from emails
            const api = await getApi();
            let createdCount = 0;
            let savedLocally = 0;

            if (await api.isConfigured()) {
              // Create clients via API
              for (const email of uniqueEmails) {
                try {
                  // Check if client already exists locally
                  const existingLocalClient = capturedData.clients?.find(c => c.email === email);
                  if (existingLocalClient) {
                    continue; // Already captured
                  }

                  // Check if client exists in API (try to get all clients and filter)
                  // Note: This is a simple check - API might have better search capabilities
                  const existingClients = await api.getClients();
                  if (existingClients.success && existingClients.data?.items) {
                    const found = existingClients.data.items.find(c => c.email === email);
                    if (found) {
                      // Client exists in API, just track it locally
                      capturedData.clients = capturedData.clients || [];
                      capturedData.clients.push({ email, id: found.id, createdAt: new Date().toISOString() });
                      continue;
                    }
                  }

                  // Create new client
                  const clientData = {
                    email: email,
                    name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    source: 'extension_capture',
                    capturedAt: new Date().toISOString()
                  };

                  const result = await api.createClient(clientData);
                  if (result.success) {
                    createdCount++;
                    capturedData.clients = capturedData.clients || [];
                    capturedData.clients.push({ email, id: result.data?.id, createdAt: new Date().toISOString() });
                  }
                } catch (error) {
                  console.warn(`Failed to create client for ${email}:`, error);
                  // Save locally if API fails
                  savedLocally++;
                  capturedData.clients = capturedData.clients || [];
                  capturedData.clients.push({ email, savedLocally: true, createdAt: new Date().toISOString() });
                }
              }
            } else {
              // Save locally if API not configured
              savedLocally = uniqueEmails.length;
              capturedData.clients = capturedData.clients || [];
              uniqueEmails.forEach(email => {
                capturedData.clients.push({
                  email,
                  name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  savedLocally: true,
                  createdAt: new Date().toISOString()
                });
              });
            }

            await chrome.storage.local.set({ capturedData });
            
            // Show notification
            if (chrome.notifications) {
              let message = `Captured ${uniqueEmails.length} email(s)`;
              if (createdCount > 0) {
                message += ` • ${createdCount} client(s) created`;
              } else if (savedLocally > 0) {
                message += ` • ${savedLocally} saved locally`;
              }
              
              chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                title: 'BlizFlow',
                message: message,
              });
            }
            
            // Trigger sync to web app in background
            if (syncService && typeof syncService.syncCapturedData === 'function') {
              syncService.syncCapturedData(api).catch(err => {
                console.warn('Background sync of captured data failed:', err);
              });
            }
            
            sendResponse({ 
              success: true, 
              count: uniqueEmails.length,
              clientsCreated: createdCount,
              savedLocally: savedLocally
            });
          } catch (error) {
            console.error('Error capturing emails:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'capturedPhones':
          try {
            const phones = request.phones || [];
            if (phones.length === 0) {
              sendResponse({ success: false, error: 'No phone numbers provided' });
              return;
            }

            const uniquePhones = [...new Set(phones)];
            
            // Store captured phone numbers
            const existingData = await chrome.storage.local.get('capturedData');
            const capturedData = existingData.capturedData || { emails: [], phones: [], clients: [] };
            capturedData.phones = [...new Set([...capturedData.phones, ...uniquePhones])];
            
            // Try to automatically create clients from phone numbers
            const api = await getApi();
            let createdCount = 0;
            let savedLocally = 0;

            if (await api.isConfigured()) {
              // Create clients via API
              for (const phone of uniquePhones) {
                try {
                  // Check if client already exists locally
                  const existingLocalClient = capturedData.clients?.find(c => c.phone === phone);
                  if (existingLocalClient) {
                    continue; // Already captured
                  }

                  // Check if client exists in API
                  const existingClients = await api.getClients();
                  if (existingClients.success && existingClients.data?.items) {
                    const found = existingClients.data.items.find(c => c.phone === phone);
                    if (found) {
                      // Client exists in API, just track it locally
                      capturedData.clients = capturedData.clients || [];
                      capturedData.clients.push({ phone, id: found.id, createdAt: new Date().toISOString() });
                      continue;
                    }
                  }

                  // Create new client
                  const clientData = {
                    phone: phone,
                    name: `Contact ${phone.slice(-4)}`, // Use last 4 digits as identifier
                    source: 'extension_capture',
                    capturedAt: new Date().toISOString()
                  };

                  const result = await api.createClient(clientData);
                  if (result.success) {
                    createdCount++;
                    capturedData.clients = capturedData.clients || [];
                    capturedData.clients.push({ phone, id: result.data?.id, createdAt: new Date().toISOString() });
                  }
                } catch (error) {
                  console.warn(`Failed to create client for ${phone}:`, error);
                  // Save locally if API fails
                  savedLocally++;
                  capturedData.clients = capturedData.clients || [];
                  capturedData.clients.push({ phone, savedLocally: true, createdAt: new Date().toISOString() });
                }
              }
            } else {
              // Save locally if API not configured
              savedLocally = uniquePhones.length;
              capturedData.clients = capturedData.clients || [];
              uniquePhones.forEach(phone => {
                capturedData.clients.push({
                  phone,
                  name: `Contact ${phone.slice(-4)}`,
                  savedLocally: true,
                  createdAt: new Date().toISOString()
                });
              });
            }

            await chrome.storage.local.set({ capturedData });
            
            // Show notification
            if (chrome.notifications) {
              let message = `Captured ${uniquePhones.length} phone number(s)`;
              if (createdCount > 0) {
                message += ` • ${createdCount} client(s) created`;
              } else if (savedLocally > 0) {
                message += ` • ${savedLocally} saved locally`;
              }
              
              chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                title: 'BlizFlow',
                message: message,
              });
            }
            
            // Trigger sync to web app in background
            if (syncService && typeof syncService.syncCapturedData === 'function') {
              syncService.syncCapturedData(api).catch(err => {
                console.warn('Background sync of captured data failed:', err);
              });
            }
            
            sendResponse({ 
              success: true, 
              count: uniquePhones.length,
              clientsCreated: createdCount,
              savedLocally: savedLocally
            });
          } catch (error) {
            console.error('Error capturing phones:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action: ' + request.action });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message || 'Unknown error' });
    }
  })();
  return true; // Keep message channel open for async response
});

// Periodic sync
try {
  chrome.alarms.create('syncData', { periodInMinutes: 15 });
} catch (error) {
  console.warn('Could not create sync alarm:', error);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (alarm.name === 'syncData' && syncService) {
      const settings = await chrome.storage.local.get('settings');
      if (settings.settings?.sync !== false) {
        await syncService.sync();
      }
    }
  } catch (error) {
    console.error('Error in alarm listener:', error);
  }
});

// Notification click handler
chrome.notifications.onClicked.addListener((notificationId) => {
  try {
    chrome.tabs.create({ url: 'https://blizflow.online/dashboard' });
  } catch (error) {
    console.error('Error handling notification click:', error);
  }
});

console.log('BlizFlow Extension Background Service Worker loaded');

