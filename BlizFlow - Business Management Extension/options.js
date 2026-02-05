// Options Page Script
// Handles extension settings

let extensionFeatures, autoLogin, syncService;

// Initialize services
async function initializeServices() {
  try {
    const { ExtensionFeatures } = await import('./features/extension-features.js');
    const { AutoLogin } = await import('./features/auto-login.js');
    const { SyncService } = await import('./features/sync.js');
    
    extensionFeatures = new ExtensionFeatures();
    autoLogin = new AutoLogin();
    syncService = new SyncService();
    return true;
  } catch (error) {
    console.error('Error loading extension features:', error);
    // Create fallback objects
    extensionFeatures = { 
      getAllFeatures: () => ({}) 
    };
    autoLogin = { 
      saveCredentials: async () => {}, 
      clearCredentials: async () => {} 
    };
    syncService = { 
      sync: async () => ({ success: false, error: 'Service not available' }) 
    };
    return false;
  }
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      showError('Extension context invalidated. Please reload this page.');
      return;
    }
    
    // Initialize services first
    await initializeServices();
    
    // Then load everything else
    await loadSettings();
    await loadFeatures();
    setupEventListeners();
  } catch (error) {
    // Handle extension context invalidated error
    if (error.message?.includes('Extension context invalidated') || 
        error.message?.includes('message port closed')) {
      showError('Extension was reloaded. Please refresh this page.');
      return;
    }
    
    console.error('Error initializing options page:', error);
    showError('Error loading settings. Please check the console and refresh the page.');
  }
});

// Listen for extension reload
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      showError('Extension was reloaded. Please refresh this page.');
    }
  });
});

function showError(message) {
  const container = document.querySelector('.container');
  if (container) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background: #fee; color: #c33; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #fcc;';
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.firstChild);
  }
}

function setupEventListeners() {
  try {
    // Auto-login buttons
    const saveAutoLoginBtn = document.getElementById('saveAutoLoginBtn');
    if (saveAutoLoginBtn) {
      saveAutoLoginBtn.addEventListener('click', window.saveAutoLogin);
    }
    
    const clearCredentialsBtn = document.getElementById('clearCredentialsBtn');
    if (clearCredentialsBtn) {
      clearCredentialsBtn.addEventListener('click', window.clearCredentials);
    }
    
    // Sync buttons
    const saveSyncSettingsBtn = document.getElementById('saveSyncSettingsBtn');
    if (saveSyncSettingsBtn) {
      saveSyncSettingsBtn.addEventListener('click', window.saveSyncSettings);
    }
    
    const syncNowBtn = document.getElementById('syncNowBtn');
    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', window.syncNow);
    }
    
    // Notification buttons
    const saveNotificationSettingsBtn = document.getElementById('saveNotificationSettingsBtn');
    if (saveNotificationSettingsBtn) {
      saveNotificationSettingsBtn.addEventListener('click', window.saveNotificationSettings);
    }
    
    // API buttons
    const saveAPISettingsBtn = document.getElementById('saveAPISettingsBtn');
    if (saveAPISettingsBtn) {
      saveAPISettingsBtn.addEventListener('click', window.saveAPISettings);
    }
    
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', window.testConnection);
    }
    
    // Toggle API key visibility
    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
    if (toggleApiKeyBtn) {
      toggleApiKeyBtn.addEventListener('click', () => {
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput) {
          if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleApiKeyBtn.textContent = '🙈 Hide Key';
          } else {
            apiKeyInput.type = 'password';
            toggleApiKeyBtn.textContent = '👁️ Show Key';
          }
        }
      });
    }
    
    // Save all button
    const saveAllSettingsBtn = document.getElementById('saveAllSettingsBtn');
    if (saveAllSettingsBtn) {
      saveAllSettingsBtn.addEventListener('click', window.saveAllSettings);
    }
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(['settings', 'credentials', 'apiKey']);
    
    // Auto-login settings
    const autoLoginCheckbox = document.getElementById('autoLogin');
    const loginEmailInput = document.getElementById('loginEmail');
    if (autoLoginCheckbox && loginEmailInput && data.credentials) {
      autoLoginCheckbox.checked = data.credentials.autoLogin || false;
      loginEmailInput.value = data.credentials.email || '';
      // Password is encrypted, don't show it
    }
    
    // Sync settings
    if (data.settings) {
      const autoSync = document.getElementById('autoSync');
      const syncInvoices = document.getElementById('syncInvoices');
      const syncClients = document.getElementById('syncClients');
      const syncExpenses = document.getElementById('syncExpenses');
      const enableNotifications = document.getElementById('enableNotifications');
      const invoiceNotifications = document.getElementById('invoiceNotifications');
      const reminderNotifications = document.getElementById('reminderNotifications');
      
      if (autoSync) autoSync.checked = data.settings.autoSync !== false;
      if (syncInvoices) syncInvoices.checked = data.settings.syncInvoices !== false;
      if (syncClients) syncClients.checked = data.settings.syncClients !== false;
      if (syncExpenses) syncExpenses.checked = data.settings.syncExpenses !== false;
      if (enableNotifications) enableNotifications.checked = data.settings.notifications !== false;
      if (invoiceNotifications) invoiceNotifications.checked = data.settings.invoiceNotifications !== false;
      if (reminderNotifications) reminderNotifications.checked = data.settings.reminderNotifications !== false;
    }
    
    // API settings
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput && data.apiKey) {
      apiKeyInput.value = data.apiKey;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function loadFeatures() {
  try {
    const container = document.getElementById('featuresList');
    if (!container) {
      console.warn('Features list container not found');
      return;
    }

    if (!extensionFeatures || typeof extensionFeatures.getAllFeatures !== 'function') {
      container.innerHTML = '<p style="color: #666; padding: 20px;">Features service not available. Please refresh the page.</p>';
      return;
    }

    const features = extensionFeatures.getAllFeatures();
    if (!features || Object.keys(features).length === 0) {
      container.innerHTML = '<p style="color: #666; padding: 20px;">No features available.</p>';
      return;
    }
    
    // Group features by category
    const categories = {};
    Object.entries(features).forEach(([id, feature]) => {
      const category = feature.category || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({ id, ...feature });
    });

    // Category display names
    const categoryNames = {
      'auth': '🔐 Authentication',
      'invoice': '📄 Invoices',
      'client': '👥 Clients',
      'expense': '💰 Expenses',
      'inventory': '📦 Inventory',
      'time': '⏱️ Time Tracking',
      'reports': '📊 Reports',
      'email': '📧 Email',
      'automation': '⚙️ Automation',
      'data': '💾 Data',
      'ai': '🤖 AI Features',
      'productivity': '⚡ Productivity',
      'tools': '🛠️ Business Tools'
    };

    // Load saved feature states
    const savedFeatures = await chrome.storage.local.get('features');
    const savedStates = savedFeatures.features || {};

    // Render categories
    container.innerHTML = Object.entries(categories)
      .sort(([a], [b]) => {
        const order = ['auth', 'invoice', 'client', 'expense', 'inventory', 'time', 'reports', 'email', 'automation', 'data', 'ai', 'productivity', 'tools'];
        return (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 999 : order.indexOf(b));
      })
      .map(([category, categoryFeatures]) => {
        const categoryName = categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
        const enabledCount = categoryFeatures.filter(f => savedStates[f.id] !== undefined ? savedStates[f.id] : f.enabled).length;
        
        return `
          <div class="feature-category" data-category="${category}">
            <div class="feature-category-header" onclick="toggleCategory('${category}')">
              <div class="feature-category-title">
                <span>${categoryName}</span>
                <span class="feature-category-count">${enabledCount}/${categoryFeatures.length}</span>
              </div>
              <span class="feature-category-toggle">▼</span>
            </div>
            <div class="feature-category-content">
              <div class="feature-category-grid">
                ${categoryFeatures.map(({ id, name, enabled }) => `
                  <div class="feature-item">
                    <input type="checkbox" id="feature-${id}" data-feature="${id}" ${savedStates[id] !== undefined ? (savedStates[id] ? 'checked' : '') : (enabled ? 'checked' : '')} />
                    <label for="feature-${id}">${name}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('');

    // Setup search functionality
    const searchInput = document.getElementById('featureSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const categories = container.querySelectorAll('.feature-category');
        
        categories.forEach(category => {
          const features = category.querySelectorAll('.feature-item');
          let hasMatch = false;
          
          features.forEach(feature => {
            const label = feature.querySelector('label').textContent.toLowerCase();
            if (label.includes(searchTerm)) {
              feature.style.display = '';
              hasMatch = true;
            } else {
              feature.style.display = 'none';
            }
          });
          
          // Show/hide category based on matches
          category.style.display = hasMatch || !searchTerm ? '' : 'none';
        });
      });
    }

    // Setup expand all button
    const expandAllBtn = document.getElementById('expandAllBtn');
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        const categories = container.querySelectorAll('.feature-category');
        const allOpen = Array.from(categories).every(cat => cat.classList.contains('open'));
        
        categories.forEach(cat => {
          if (allOpen) {
            cat.classList.remove('open');
            expandAllBtn.textContent = 'Expand All';
          } else {
            cat.classList.add('open');
            expandAllBtn.textContent = 'Collapse All';
          }
        });
      });
    }

    // Open first 3 categories by default
    const firstCategories = container.querySelectorAll('.feature-category');
    firstCategories.forEach((cat, index) => {
      if (index < 3) {
        cat.classList.add('open');
      }
    });
  } catch (error) {
    console.error('Error loading features:', error);
    const container = document.getElementById('featuresList');
    if (container) {
      container.innerHTML = '<p style="color: #c33; padding: 20px;">Error loading features. Please refresh the page.</p>';
    }
  }
}

// Toggle category function
window.toggleCategory = function(category) {
  const categoryEl = document.querySelector(`.feature-category[data-category="${category}"]`);
  if (categoryEl) {
    categoryEl.classList.toggle('open');
  }
};

// Save functions
window.saveAutoLogin = async function() {
  try {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const autoLoginCheckbox = document.getElementById('autoLogin');
    
    if (!emailInput || !passwordInput || !autoLoginCheckbox) {
      alert('Error: Form elements not found');
      return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;
    const autoLoginEnabled = autoLoginCheckbox.checked;
    
    if (email && password) {
      if (autoLogin && typeof autoLogin.saveCredentials === 'function') {
        await autoLogin.saveCredentials(email, password, autoLoginEnabled);
      } else {
        // Fallback: save directly to storage
        await chrome.storage.local.set({
          credentials: {
            email,
            password, // In production, encrypt this
            autoLogin: autoLoginEnabled
          }
        });
      }
      alert('Auto-login credentials saved!');
    } else {
      alert('Please enter email and password');
    }
  } catch (error) {
    console.error('Error saving auto-login:', error);
    alert('Error saving credentials: ' + error.message);
  }
};

window.clearCredentials = async function() {
  try {
    if (confirm('Are you sure you want to clear saved credentials?')) {
      if (autoLogin && typeof autoLogin.clearCredentials === 'function') {
        await autoLogin.clearCredentials();
      } else {
        // Fallback: clear from storage
        await chrome.storage.local.remove('credentials');
      }
      
      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const autoLoginCheckbox = document.getElementById('autoLogin');
      
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (autoLoginCheckbox) autoLoginCheckbox.checked = false;
      
      alert('Credentials cleared');
    }
  } catch (error) {
    console.error('Error clearing credentials:', error);
    alert('Error clearing credentials: ' + error.message);
  }
};

window.saveSyncSettings = async function() {
  try {
    const autoSync = document.getElementById('autoSync');
    const syncInvoices = document.getElementById('syncInvoices');
    const syncClients = document.getElementById('syncClients');
    const syncExpenses = document.getElementById('syncExpenses');
    
    if (!autoSync || !syncInvoices || !syncClients || !syncExpenses) {
      alert('Error: Form elements not found');
      return;
    }
    
    const settings = {
      autoSync: autoSync.checked,
      syncInvoices: syncInvoices.checked,
      syncClients: syncClients.checked,
      syncExpenses: syncExpenses.checked,
    };
    
    await chrome.storage.local.set({ settings });
    alert('Sync settings saved!');
  } catch (error) {
    console.error('Error saving sync settings:', error);
    alert('Error saving sync settings: ' + error.message);
  }
};

window.saveNotificationSettings = async function() {
  try {
    const enableNotifications = document.getElementById('enableNotifications');
    const invoiceNotifications = document.getElementById('invoiceNotifications');
    const reminderNotifications = document.getElementById('reminderNotifications');
    
    if (!enableNotifications || !invoiceNotifications || !reminderNotifications) {
      alert('Error: Form elements not found');
      return;
    }
    
    const currentSettings = await chrome.storage.local.get('settings');
    const settings = currentSettings.settings || {};
    settings.notifications = enableNotifications.checked;
    settings.invoiceNotifications = invoiceNotifications.checked;
    settings.reminderNotifications = reminderNotifications.checked;
    
    await chrome.storage.local.set({ settings });
    alert('Notification settings saved!');
  } catch (error) {
    console.error('Error saving notification settings:', error);
    alert('Error saving notification settings: ' + error.message);
  }
};

window.saveAPISettings = async function() {
  try {
    const apiKeyInput = document.getElementById('apiKey');
    const apiUrlInput = document.getElementById('apiUrl');
    
    if (!apiKeyInput || !apiUrlInput) {
      alert('Error: Form elements not found');
      return;
    }
    
    let apiKey = apiKeyInput.value.trim();
    const apiUrl = apiUrlInput.value.trim();
    
    // Remove any extra whitespace
    apiKey = apiKey.replace(/\s+/g, '');
    
    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }
    
    // Very lenient validation - just check minimum length
    // Let the API server validate the actual format
    if (apiKey.length < 5) {
      alert('API key seems too short. Please check if you copied the complete key.');
      return;
    }
    
    await chrome.storage.local.set({
      apiKey,
      apiUrl,
    });
    
    // Also save to userData for compatibility
    const userData = await chrome.storage.local.get('userData');
    await chrome.storage.local.set({
      userData: {
        ...userData.userData,
        apiKey,
        apiUrl,
      }
    });
    
    alert('✅ API settings saved successfully!');
  } catch (error) {
    console.error('Error saving API settings:', error);
    alert('Error saving API settings: ' + error.message);
  }
};

window.testConnection = async function() {
  try {
    const apiKeyInput = document.getElementById('apiKey');
    const apiUrlInput = document.getElementById('apiUrl');
    
    if (!apiKeyInput) {
      alert('Error: API key input not found');
      return;
    }
    
    let apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('Please enter API key');
      return;
    }
    
    // Remove any extra whitespace or newlines
    apiKey = apiKey.replace(/\s+/g, '');
    
    // Basic validation - just check minimum length (very lenient)
    if (apiKey.length < 5) {
      alert('API key seems too short. Please check if you copied the complete key.');
      return;
    }
    
    // No format validation - let the API server validate the key
    // This allows for any API key format that the server accepts
    
    const apiUrl = (apiUrlInput && apiUrlInput.value.trim()) ? apiUrlInput.value.trim() : 'https://blizflow.online/api';
    const testUrl = apiUrl.endsWith('/') ? apiUrl + 'health' : apiUrl + '/health';
    
    // Show loading state
    const testBtn = document.getElementById('testConnectionBtn');
    const originalText = testBtn ? testBtn.textContent : 'Test Connection';
    if (testBtn) {
      testBtn.textContent = 'Testing...';
      testBtn.disabled = true;
    }
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        alert('✅ Connection successful! Your API key is valid.\n\nYou can now use all extension features that require API access.');
      } else if (response.status === 401) {
        alert('❌ Authentication failed. Please check your API key.\n\nMake sure:\n- The key is correct\n- The key hasn\'t been revoked\n- You copied the complete key');
      } else {
        alert(`Connection failed (Status: ${response.status}). Please check your API key and try again.`);
      }
    } catch (error) {
      const errorMsg = error.message || String(error);
      
      // Check for CSP errors
      if (errorMsg.includes('Content Security Policy') || errorMsg.includes('CSP') || errorMsg.includes('violates')) {
        const currentUrl = testUrl;
        const isLocalhost = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');
        const isLocalIP = /http:\/\/\d+\.\d+\.\d+\.\d+/.test(currentUrl);
        
        let message = '❌ Content Security Policy (CSP) Error\n\n';
        message += 'The extension cannot connect to this URL due to security restrictions.\n\n';
        
        if (isLocalhost) {
          message += '✅ localhost should work. Try:\n';
          message += '1. Reload the extension (chrome://extensions/)\n';
          message += '2. Close and reopen this options page\n';
          message += '3. Try again\n\n';
        } else if (isLocalIP) {
          message += '⚠️ Local IP detected. You may need to:\n';
          message += '1. Add this IP to manifest.json CSP\n';
          message += '2. Reload the extension\n';
          message += '3. See: extension/CSP_LOCAL_DEVELOPMENT_FIX.md\n\n';
        }
        
        message += `URL: ${currentUrl}\n`;
        message += '\nFor development, use: http://localhost:3000/api';
        
        alert(message);
      } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        alert('❌ Network error. Please check:\n- Your internet connection\n- The API URL is correct\n- No firewall is blocking the connection\n- The server is running');
      } else {
        alert('Connection error: ' + errorMsg);
      }
    } finally {
      if (testBtn) {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
      }
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    alert('Error testing connection: ' + error.message);
  }
};

window.syncNow = async function() {
  try {
    if (syncService && typeof syncService.sync === 'function') {
      const result = await syncService.sync();
      if (result.success) {
        alert('Data synced successfully!');
      } else {
        alert('Sync failed: ' + (result.error || 'Unknown error'));
      }
    } else {
      alert('Sync service not available. Please refresh the page.');
    }
  } catch (error) {
    console.error('Error syncing:', error);
    alert('Error syncing: ' + error.message);
  }
};

window.saveAllSettings = async function() {
  try {
    // Save feature states
    const features = {};
    const featureCheckboxes = document.querySelectorAll('#featuresList input[type="checkbox"]');
    featureCheckboxes.forEach(checkbox => {
      features[checkbox.dataset.feature] = checkbox.checked;
    });
    await chrome.storage.local.set({ features });
    
    // Save all other settings
    await window.saveSyncSettings();
    await window.saveNotificationSettings();
    await window.saveAPISettings();
    
    alert('All settings saved!');
  } catch (error) {
    console.error('Error saving all settings:', error);
    alert('Error saving settings: ' + error.message);
  }
};
