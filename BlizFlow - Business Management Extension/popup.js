// Popup Script for BlizFlow Extension
// Handles UI interactions and data display

// Lazy load services with fallbacks
let extensionFeatures = null;
let autoLogin = null;

async function initializeServices() {
  try {
    const { ExtensionFeatures } = await import('./features/extension-features.js');
    const { AutoLogin } = await import('./features/auto-login.js');
    
    extensionFeatures = new ExtensionFeatures();
    autoLogin = new AutoLogin();
    return true;
  } catch (error) {
    console.error('Error loading extension services:', error);
    // Create fallback objects
    extensionFeatures = {
      getAllFeatures: () => ({}),
      executeFeature: async () => ({ success: false, error: 'Service not available' })
    };
    autoLogin = {
      saveCredentials: async () => {},
      clearCredentials: async () => {},
      performLogin: async () => ({ success: false, error: 'Service not available' })
    };
    return false;
  }
}

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
      getTodayStats: async () => ({ success: false, error: 'API not available' }),
      getUserInfo: async () => ({ success: false, error: 'API not available' }),
      getInvoices: async () => ({ success: false, error: 'API not available' }),
      getClients: async () => ({ success: false, error: 'API not available' }),
      getExpenses: async () => ({ success: false, error: 'API not available' }),
    };
    return apiCache;
  }
}

// Initialize popup - use hidden attribute
function showMainContent() {
  const loadingState = document.getElementById('loadingState');
  if (loadingState) {
    loadingState.hidden = true;
  }
}

function showLoadingState() {
  const loadingState = document.getElementById('loadingState');
  if (loadingState) {
    loadingState.hidden = false;
  }
}

// Check if extension context is valid
function isExtensionContextValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

// Prevent dragging on all elements
function preventDragging() {
  // Prevent drag events
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, false);

  document.addEventListener('drag', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, false);

  document.addEventListener('dragend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, false);

  // Prevent mouse events that could cause dragging
  document.addEventListener('mousedown', (e) => {
    // Allow mousedown on interactive elements
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.isContentEditable) {
      return;
    }
    // Prevent dragging on other elements
    if (e.button === 0) { // Left mouse button
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent context menu that might enable dragging
  document.addEventListener('contextmenu', (e) => {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return; // Allow context menu for inputs
    }
    e.preventDefault();
    return false;
  }, false);

  // Set draggable="false" on body and all major containers
  document.body.setAttribute('draggable', 'false');
  document.documentElement.setAttribute('draggable', 'false');
  
  const popupScroll = document.querySelector('.popup-scroll');
  if (popupScroll) {
    popupScroll.setAttribute('draggable', 'false');
  }
  
  // Prevent dragging on header (common drag target)
  const header = document.querySelector('.header');
  if (header) {
    header.setAttribute('draggable', 'false');
    header.style.cursor = 'default';
  }
  
  // Prevent dragging on all sections
  document.querySelectorAll('.section').forEach(section => {
    section.setAttribute('draggable', 'false');
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Prevent dragging immediately
  preventDragging();
  
  const loadingState = document.getElementById('loadingState');
  const popupScroll = document.querySelector('.popup-scroll');
  
  // Check extension context
  if (!isExtensionContextValid()) {
    if (popupScroll) {
      popupScroll.innerHTML = '<div style="padding: 20px; text-align: center;"><p>Extension context invalidated.</p><p>Please close and reopen this popup.</p></div>';
    }
    showMainContent();
    return;
  }
  
  // Initially show loading, then switch to content
  showLoadingState();
  
  // Show content after a brief delay to ensure everything is ready
  setTimeout(() => {
    showMainContent();
  }, 100);
  
  try {
    // Initialize services first (with timeout fallback)
    const initPromise = initializeServices();
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
    await Promise.race([initPromise, timeoutPromise]);
    
    // Check context again after async operations
    if (!isExtensionContextValid()) {
      const popupScroll = document.querySelector('.popup-scroll');
      if (popupScroll) {
        popupScroll.innerHTML = '<div style="padding: 20px; text-align: center;"><p>Extension was reloaded.</p><p>Please close and reopen this popup.</p></div>';
        showMainContent();
      }
      return;
    }
    
    // Hide loading, show main content (ensure it's shown)
    showMainContent();
    
    // Quick sync on popup open (fast sync for immediate updates)
    const api = await getApi();
    if (await api.isConfigured()) {
      try {
        chrome.runtime.sendMessage({ action: 'quickSync' }).catch(() => {
          // Ignore errors, will use cached data
        });
        // Also fetch fresh user data immediately
        chrome.runtime.sendMessage({ action: 'getUserData' }).catch(() => {
          // Ignore errors
        });
      } catch (error) {
        // Ignore errors
      }
    }
    
    // Set up periodic status and user data updates (every 15 seconds)
    if (isExtensionContextValid()) {
      const statusUpdateInterval = setInterval(async () => {
        if (!isExtensionContextValid()) {
          clearInterval(statusUpdateInterval);
          return;
        }
        try {
          // Update status first (which will trigger user data update if connected)
          await updateStatus();
          // Also update user data if connected
          const api = await getApi();
          if (await api.isConfigured()) {
            await loadUserData();
          }
        } catch (error) {
          // Ignore errors in periodic update
        }
      }, 15000); // Update every 15 seconds
      
      // Store interval ID for cleanup if needed
      window.statusUpdateInterval = statusUpdateInterval;
    }

    // Then load everything else (don't wait, load in background)
    Promise.all([
      loadUserData().catch(e => {
        if (!e.message?.includes('Extension context invalidated')) {
          console.warn('Error loading user data:', e);
        }
      }),
      loadStats().catch(e => {
        if (!e.message?.includes('Extension context invalidated')) {
          console.warn('Error loading stats:', e);
        }
      }),
      loadRecentItems().catch(e => {
        if (!e.message?.includes('Extension context invalidated')) {
          console.warn('Error loading recent items:', e);
        }
      }),
      loadFeatures().catch(e => {
        if (!e.message?.includes('Extension context invalidated')) {
          console.warn('Error loading features:', e);
        }
      }),
      updateStatus().catch(e => {
        if (!e.message?.includes('Extension context invalidated')) {
          console.warn('Error updating status:', e);
        }
      })
    ]).then(() => {
      if (isExtensionContextValid()) {
        setupEventListeners();
        setupFeatureToggles();
      }
    }).catch(e => {
      if (!e.message?.includes('Extension context invalidated')) {
        console.error('Error in setup:', e);
      }
      if (isExtensionContextValid()) {
        setupEventListeners();
        setupFeatureToggles();
      }
    });
  } catch (error) {
    // Handle extension context errors gracefully
    if (error.message?.includes('Extension context invalidated') || 
        error.message?.includes('message port closed')) {
      const popupScroll = document.querySelector('.popup-scroll');
      if (popupScroll) {
        popupScroll.innerHTML = '<div style="padding: 20px; text-align: center;"><p>Extension was reloaded.</p><p>Please close and reopen this popup.</p></div>';
        showMainContent();
      }
      return;
    }
    
    console.error('Error initializing popup:', error);
    
    // Always show content even on error
    showMainContent();
    
    // Setup event listeners even if data loading failed
    if (isExtensionContextValid()) {
      setupEventListeners();
      setupFeatureToggles();
    }
  }
});

// Fallback: Show content after 1 second if DOMContentLoaded didn't fire
setTimeout(() => {
  if (!isExtensionContextValid()) return;
  
  const loadingState = document.getElementById('loadingState');
  if (loadingState && !loadingState.hidden) {
    console.warn('Fallback: Showing content after timeout');
    showMainContent();
    if (isExtensionContextValid()) {
      setupEventListeners();
      setupFeatureToggles();
    }
  }
}, 1000);

async function loadUserData() {
  try {
    const api = await getApi();
    let userData = null;
    
    // Always try to fetch fresh user data from API if configured
    if (await api.isConfigured()) {
      try {
        const result = await api.getUserInfo();
        if (result.success && result.data) {
          userData = result.data;
          // Save to storage with timestamp
          await chrome.storage.local.set({ 
            userData: userData,
            userDataLastUpdate: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn('Could not fetch user data from API, using cached data:', error);
      }
    }

    // Load from storage if API didn't return data
    if (!userData) {
      const data = await chrome.storage.local.get('userData');
      userData = data.userData;
    }

    // Get DOM elements
    const userNameEl = document.getElementById('userName');
    const userStatusEl = document.getElementById('userStatus');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (!userNameEl || !userStatusEl || !userAvatarEl) {
      console.warn('User info elements not found');
      return;
    }
    
    // Update UI with user data
    if (userData) {
      // Update user name
      const displayName = userData.name || 
                         userData.fullName || 
                         userData.displayName || 
                         userData.email?.split('@')[0] || 
                         userData.username || 
                         'User';
      userNameEl.textContent = displayName;
      
      // Update status
      userStatusEl.textContent = 'Online';
      userStatusEl.classList.add('online');
      
      // Update avatar/profile picture
      updateUserAvatar(userAvatarEl, userData, displayName);
    } else {
      userNameEl.textContent = 'Not logged in';
      userStatusEl.textContent = 'Offline';
      userStatusEl.classList.remove('online');
      // Reset avatar to default
      if (userAvatarEl) {
        userAvatarEl.textContent = 'U';
        userAvatarEl.style.backgroundImage = '';
        userAvatarEl.style.backgroundColor = '';
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Helper function to update user avatar
function updateUserAvatar(avatarEl, userData, displayName) {
  if (!avatarEl) return;
  
  // Try different avatar field names
  const avatarUrl = userData.avatar || 
                   userData.profilePicture || 
                   userData.profile_picture || 
                   userData.avatar_url || 
                   userData.picture ||
                   userData.image;
  
  if (avatarUrl) {
    // Check if it's a valid URL or base64
    if (avatarUrl.startsWith('http://') || 
        avatarUrl.startsWith('https://') || 
        avatarUrl.startsWith('data:image')) {
      // Valid image URL
      avatarEl.style.backgroundImage = `url(${avatarUrl})`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.style.backgroundRepeat = 'no-repeat';
      avatarEl.textContent = ''; // Clear text when image is set
      
      // Handle image load errors
      const img = new Image();
      img.onload = () => {
        // Image loaded successfully
        avatarEl.style.backgroundImage = `url(${avatarUrl})`;
      };
      img.onerror = () => {
        // Image failed to load, fallback to initials
        setAvatarInitials(avatarEl, displayName);
      };
      img.src = avatarUrl;
    } else {
      // Invalid URL, use initials
      setAvatarInitials(avatarEl, displayName);
    }
  } else {
    // No avatar URL, use initials
    setAvatarInitials(avatarEl, displayName);
  }
}

// Helper function to set avatar initials
function setAvatarInitials(avatarEl, displayName) {
  if (!avatarEl) return;
  
  // Generate initials from name
  const initials = displayName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  
  avatarEl.textContent = initials || 'U';
  avatarEl.style.backgroundImage = '';
  avatarEl.style.backgroundSize = '';
  avatarEl.style.backgroundPosition = '';
  avatarEl.style.backgroundRepeat = '';
}

async function loadStats() {
  try {
    const api = await getApi();
    let statsData = {};
    
    // Try to load from API if configured
    if (await api.isConfigured()) {
      try {
        // Fetch comprehensive stats from API
        const [todayStatsResult, invoicesResult, clientsResult] = await Promise.all([
          api.getTodayStats().catch(() => ({ success: false })),
          api.getInvoices({ limit: 1 }).catch(() => ({ success: false })),
          api.getClients({ limit: 1 }).catch(() => ({ success: false })),
        ]);

        // Get today's stats
        if (todayStatsResult.success && todayStatsResult.data) {
          statsData = { ...statsData, ...todayStatsResult.data };
        }

        // Calculate total invoices
        if (invoicesResult.success && invoicesResult.data) {
          const invoices = Array.isArray(invoicesResult.data) 
            ? invoicesResult.data 
            : invoicesResult.data.items || [];
          const totalInvoices = invoicesResult.data.total || invoicesResult.data.count || invoices.length;
          statsData.totalInvoices = totalInvoices;
          
          // Calculate total revenue and pending invoices
          let totalRevenue = 0;
          let pendingCount = 0;
          
          // Get all invoices to calculate revenue
          const allInvoicesResult = await api.getInvoices({ limit: 100 }).catch(() => ({ success: false }));
          if (allInvoicesResult.success && allInvoicesResult.data) {
            const allInvoices = Array.isArray(allInvoicesResult.data)
              ? allInvoicesResult.data
              : allInvoicesResult.data.items || [];
            
            allInvoices.forEach(inv => {
              const amount = parseFloat(inv.total || inv.amount || inv.value || 0);
              if (!isNaN(amount)) {
                totalRevenue += amount;
              }
              
              // Count pending invoices (unpaid, draft, etc.)
              const status = (inv.status || '').toLowerCase();
              if (status === 'pending' || status === 'unpaid' || status === 'draft' || status === 'sent') {
                pendingCount++;
              }
            });
          }
          
          statsData.totalRevenue = totalRevenue;
          statsData.pending = pendingCount;
        }

        // Calculate total clients
        if (clientsResult.success && clientsResult.data) {
          const clients = Array.isArray(clientsResult.data)
            ? clientsResult.data
            : clientsResult.data.items || [];
          const totalClients = clientsResult.data.total || clientsResult.data.count || clients.length;
          statsData.activeClients = totalClients;
        }

        // Save to storage for offline use
        await chrome.storage.local.set({ 
          todayStats: statsData,
          dashboardStats: statsData,
          lastStatsUpdate: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Could not fetch stats from API, using cached data:', error);
      }
    }

    // Load from storage as fallback
    const stats = await chrome.storage.local.get(['todayStats', 'dashboardStats']);
    if (!statsData || Object.keys(statsData).length === 0) {
      statsData = stats.dashboardStats || stats.todayStats || {};
    }
    
    // Get DOM elements
    const invoicesEl = document.getElementById('statInvoices') || document.getElementById('todayInvoices');
    const clientsEl = document.getElementById('statClients');
    const revenueEl = document.getElementById('statRevenue') || document.getElementById('todayRevenue');
    const pendingEl = document.getElementById('statPending');
    const expensesEl = document.getElementById('todayExpenses');
    const timeEl = document.getElementById('todayTime');
    
    // Update UI with stats
    if (invoicesEl) {
      const invoiceCount = statsData.totalInvoices || statsData.invoices || statsData.invoiceCount || 0;
      invoicesEl.textContent = invoiceCount;
    }
    if (clientsEl) {
      const clientCount = statsData.activeClients || statsData.clients || statsData.clientCount || 0;
      clientsEl.textContent = clientCount;
    }
    if (revenueEl) {
      const revenue = statsData.totalRevenue || statsData.revenue || 0;
      revenueEl.textContent = `$${typeof revenue === 'number' ? revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : revenue}`;
    }
    if (pendingEl) {
      const pending = statsData.pending || statsData.pendingTasks || statsData.pendingInvoices || 0;
      pendingEl.textContent = pending;
    }
    if (expensesEl) {
      const expenses = statsData.expenses || statsData.totalExpenses || 0;
      expensesEl.textContent = `$${expenses}`;
    }
    if (timeEl) {
      const time = statsData.time || statsData.totalHours || 0;
      timeEl.textContent = `${time}h`;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
    // Set defaults on error
    const invoicesEl = document.getElementById('statInvoices');
    const clientsEl = document.getElementById('statClients');
    const revenueEl = document.getElementById('statRevenue');
    const pendingEl = document.getElementById('statPending');
    
    if (invoicesEl) invoicesEl.textContent = '0';
    if (clientsEl) clientsEl.textContent = '0';
    if (revenueEl) revenueEl.textContent = '$0';
    if (pendingEl) pendingEl.textContent = '0';
  }
}

async function loadRecentItems() {
  try {
    const api = await getApi();
    let recentItems = [];
    
    // Try to load from API if configured
    if (await api.isConfigured()) {
      try {
        // Get recent invoices, clients, expenses
        const [invoicesResult, clientsResult, expensesResult] = await Promise.all([
          api.getInvoices({ limit: 5, sort: 'created_at', order: 'desc' }).catch(() => ({ success: false })),
          api.getClients({ limit: 3, sort: 'created_at', order: 'desc' }).catch(() => ({ success: false })),
          api.getExpenses({ limit: 3, sort: 'created_at', order: 'desc' }).catch(() => ({ success: false })),
        ]);

        if (invoicesResult.success && invoicesResult.data) {
          const invoices = Array.isArray(invoicesResult.data) 
            ? invoicesResult.data 
            : invoicesResult.data.items || [];
          invoices.forEach(inv => {
            recentItems.push({
              type: 'invoice',
              name: inv.number || inv.title || `Invoice #${inv.id || 'N/A'}`,
              time: inv.created_at || inv.createdAt || inv.updated_at || inv.updatedAt || new Date().toISOString(),
              id: inv.id,
            });
          });
        }

        if (clientsResult.success && clientsResult.data) {
          const clients = Array.isArray(clientsResult.data) 
            ? clientsResult.data 
            : clientsResult.data.items || [];
          clients.forEach(client => {
            recentItems.push({
              type: 'client',
              name: client.name || client.company || client.email || `Client #${client.id || 'N/A'}`,
              time: client.created_at || client.createdAt || client.updated_at || client.updatedAt || new Date().toISOString(),
              id: client.id,
            });
          });
        }

        if (expensesResult.success && expensesResult.data) {
          const expenses = Array.isArray(expensesResult.data) 
            ? expensesResult.data 
            : expensesResult.data.items || [];
          expenses.forEach(exp => {
            recentItems.push({
              type: 'expense',
              name: exp.description || exp.category || exp.name || `Expense #${exp.id || 'N/A'}`,
              time: exp.created_at || exp.createdAt || exp.updated_at || exp.updatedAt || new Date().toISOString(),
              id: exp.id,
            });
          });
        }

        // Sort by time (newest first) and save
        recentItems.sort((a, b) => {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          return timeB - timeA;
        });
        
        await chrome.storage.local.set({ 
          recentItems: recentItems.slice(0, 10),
          recentActivity: recentItems.slice(0, 10),
          lastActivityUpdate: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Could not fetch recent items from API, using cached data:', error);
      }
    }

    // Load from storage as fallback
    if (recentItems.length === 0) {
      const recent = await chrome.storage.local.get(['recentItems', 'recentActivity']);
      recentItems = recent.recentActivity || recent.recentItems || [];
    }
    
    // Get container
    const container = document.getElementById('activityList') || document.getElementById('recentItems');
    if (!container) {
      console.warn('Recent items container not found');
      return;
    }
    
    // Check if API is configured to show appropriate message
    const isConfigured = await api.isConfigured();
    
    if (recentItems.length === 0) {
      if (isConfigured) {
        container.innerHTML = `
          <div class="empty-state">
            <div style="text-align: center; padding: 20px; color: #64748b;">
              <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
              <div style="font-weight: 500; margin-bottom: 4px;">No recent items</div>
              <div style="font-size: 12px;">Check in web app or refresh to update</div>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <div style="text-align: center; padding: 20px; color: #64748b;">
              <div style="font-size: 32px; margin-bottom: 8px;">🔗</div>
              <div style="font-weight: 500; margin-bottom: 4px;">Connect to see activity</div>
              <div style="font-size: 12px;">Configure API in settings to sync data</div>
            </div>
          </div>
        `;
      }
      return;
    }

    // Display recent items
    const isActivityList = container.id === 'activityList';
    
    if (isActivityList) {
      container.innerHTML = recentItems.slice(0, 5).map(item => {
        const time = item.time || item.created_at || item.createdAt || new Date().toISOString();
        return `
          <div class="activity-item">
            <div class="activity-icon">${getItemIcon(item.type)}</div>
            <div class="activity-content">
              <div class="activity-title">${escapeHtml(item.name || item.title || 'Activity')}</div>
              <div class="activity-time">${formatTime(time)}</div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = recentItems.slice(0, 5).map(item => {
        const time = item.time || item.created_at || item.createdAt || new Date().toISOString();
        return `
          <div class="recent-item">
            <span class="recent-icon">${getItemIcon(item.type)}</span>
            <span class="recent-text">${escapeHtml(item.name || item.title)}</span>
            <span class="recent-time">${formatTime(time)}</span>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Error loading recent items:', error);
    const container = document.getElementById('activityList') || document.getElementById('recentItems');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div style="text-align: center; padding: 20px; color: #ef4444;">
            <div style="font-size: 32px; margin-bottom: 8px;">⚠️</div>
            <div style="font-weight: 500; margin-bottom: 4px;">Error loading activity</div>
            <div style="font-size: 12px;">Please try refreshing</div>
          </div>
        </div>
      `;
    }
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadFeatures() {
  try {
    if (!extensionFeatures || typeof extensionFeatures.getAllFeatures !== 'function') {
      const container = document.getElementById('featuresGrid');
      if (container) {
        container.innerHTML = '<div class="empty-state">Features service not available</div>';
      }
      return;
    }

    const features = extensionFeatures.getAllFeatures();
    if (!features || Object.keys(features).length === 0) {
      const container = document.getElementById('featuresGrid');
      if (container) {
        container.innerHTML = '<div class="empty-state">No features available</div>';
      }
      return;
    }

    const enabledFeatures = Object.entries(features)
      .filter(([id, feature]) => feature.enabled)
      .slice(0, 12); // Show first 12 features

    const container = document.getElementById('featuresGrid');
    if (!container) {
      console.warn('Features grid container not found');
      return;
    }

    container.innerHTML = enabledFeatures.map(([id, feature]) => `
      <div class="feature-card" data-feature="${id}">
        <div class="feature-icon">${getFeatureIcon(feature.category)}</div>
        <div class="feature-name">${feature.name}</div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('click', async () => {
        const featureId = card.dataset.feature;
        await executeFeature(featureId);
      });
    });
  } catch (error) {
    console.error('Error loading features:', error);
    const container = document.getElementById('featuresGrid');
    if (container) {
      container.innerHTML = '<div class="empty-state">Error loading features</div>';
    }
  }
}

function setupEventListeners() {
  try {
    // Quick actions - new IDs
    const btnInvoice = document.getElementById('btnInvoice');
    const quickInvoice = document.getElementById('quickInvoice');
    if (btnInvoice || quickInvoice) {
      (btnInvoice || quickInvoice).addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://blizflow.online/invoices/new' });
      });
    }

    const btnClient = document.getElementById('btnClient');
    const quickClient = document.getElementById('quickClient');
    if (btnClient || quickClient) {
      (btnClient || quickClient).addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://blizflow.online/clients' });
      });
    }

    const btnExpense = document.getElementById('btnExpense');
    const quickExpense = document.getElementById('quickExpense');
    if (btnExpense || quickExpense) {
      (btnExpense || quickExpense).addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://blizflow.online/expenses' });
      });
    }

    const btnDashboard = document.getElementById('btnDashboard');
    const openDashboard = document.getElementById('openDashboard');
    if (btnDashboard || openDashboard) {
      (btnDashboard || openDashboard).addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://blizflow.online/dashboard' });
      });
    }

    const quickTime = document.getElementById('quickTime');
    if (quickTime) {
      quickTime.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://blizflow.online/time-tracking' });
      });
    }

    // Dashboard popup
    const openDashboardPopup = document.getElementById('openDashboardPopup');
    if (openDashboardPopup) {
      openDashboardPopup.addEventListener('click', () => {
        chrome.windows.create({
          url: chrome.runtime.getURL('dashboard.html'),
          type: 'popup',
          width: 550,
          height: 700
        });
      });
    }

    // Settings button
    const btnSettings = document.getElementById('btnSettings');
    const openSettings = document.getElementById('openSettings');
    if (btnSettings || openSettings) {
      (btnSettings || openSettings).addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
    }

    // Refresh button
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', async () => {
        btnRefresh.disabled = true;
        const originalText = btnRefresh.textContent;
        btnRefresh.textContent = 'Refreshing...';
        try {
          // Trigger full sync with web app
          const syncResult = await chrome.runtime.sendMessage({ action: 'syncData' });
          
          if (syncResult && syncResult.success) {
            // Clear cached data to force fresh fetch
            await chrome.storage.local.remove(['todayStats', 'dashboardStats', 'recentItems', 'recentActivity']);
            
            // Reload all data
            await Promise.all([
              loadUserData(),
              loadStats(),
              loadRecentItems()
            ]);
            
            showNotification('Data synced and refreshed!');
          } else {
            // Still refresh from cache
            await chrome.storage.local.remove(['todayStats', 'dashboardStats', 'recentItems', 'recentActivity']);
            await Promise.all([
              loadUserData(),
              loadStats(),
              loadRecentItems()
            ]);
            showNotification('Data refreshed from cache');
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
          // Still try to refresh from cache
          try {
            await chrome.storage.local.remove(['todayStats', 'dashboardStats', 'recentItems', 'recentActivity']);
            await Promise.all([
              loadUserData(),
              loadStats(),
              loadRecentItems()
            ]);
            showNotification('Data refreshed from cache');
          } catch (e) {
            showNotification('Error refreshing data', 'error');
          }
        } finally {
          btnRefresh.disabled = false;
          btnRefresh.textContent = originalText;
        }
      });
    }

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await chrome.storage.local.remove(['userData', 'credentials']);
        await loadUserData();
      });
    }

    // Footer links
    const helpLink = document.getElementById('helpLink');
    if (helpLink) {
      helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://blizflow.online/help' });
      });
    }

    const feedbackLink = document.getElementById('feedbackLink');
    if (feedbackLink) {
      feedbackLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://blizflow.online/feedback' });
      });
    }
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

async function executeFeature(featureId) {
  try {
    if (!extensionFeatures || typeof extensionFeatures.executeFeature !== 'function') {
      showNotification('Feature service not available. Please reload the extension.', 'error');
      return;
    }

    const result = await chrome.runtime.sendMessage({
      action: 'executeFeature',
      featureId,
    });

    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      showNotification('Error: ' + chrome.runtime.lastError.message, 'error');
      return;
    }

    if (result && result.success) {
      // Show success notification
      showNotification('Feature executed successfully');
    } else {
      showNotification('Error: ' + (result?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error executing feature:', error);
    showNotification('Error executing feature: ' + error.message, 'error');
  }
}

function getItemIcon(type) {
  const icons = {
    invoice: '📄',
    client: '👤',
    expense: '💰',
    time: '⏱️',
    report: '📊',
  };
  return icons[type] || '📋';
}

function getFeatureIcon(category) {
  const icons = {
    auth: '🔐',
    invoice: '📄',
    client: '👥',
    expense: '💰',
    inventory: '📦',
    time: '⏱️',
    reports: '📊',
    email: '📧',
    automation: '⚙️',
    data: '💾',
    ai: '🤖',
  };
  return icons[category] || '✨';
}

function formatTime(timestamp) {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Unknown';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    return 'Unknown';
  }
}

function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

async function updateStatus() {
  try {
    const statusEl = document.getElementById('status');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (!statusEl || !statusDot || !statusText) return;
    
    const api = await getApi();
    const isConfigured = await api.isConfigured();
    const userData = await chrome.storage.local.get('userData');
    
    // Store previous status to detect changes
    const previousStatus = statusText.textContent;
    let newStatus = '';
    let isConnected = false;
    
    if (isConfigured && userData.userData) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'Connected';
      newStatus = 'Connected';
      isConnected = true;
    } else if (userData.userData) {
      statusDot.className = 'status-dot connecting';
      statusText.textContent = 'Offline Mode';
      newStatus = 'Offline Mode';
    } else {
      statusDot.className = 'status-dot offline';
      statusText.textContent = 'Not Connected';
      newStatus = 'Not Connected';
    }
    
    // If status changed to "Connected", update user data immediately
    if (isConnected && previousStatus !== 'Connected') {
      console.log('User connected - updating user data...');
      // Fetch fresh user data from API
      try {
        if (await api.isConfigured()) {
          const result = await api.getUserInfo();
          if (result.success && result.data) {
            await chrome.storage.local.set({ 
              userData: result.data,
              userDataLastUpdate: new Date().toISOString()
            });
            // Update the UI with new user data
            await loadUserData();
          }
        }
      } catch (error) {
        console.warn('Error fetching user data on connection:', error);
        // Still try to load from cache
        await loadUserData();
      }
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

function setupFeatureToggles() {
  try {
    // Load saved feature states
    chrome.storage.local.get('featureToggles', async (data) => {
      const toggles = data.featureToggles || {
        autoFill: true,
        notifications: true,
        quickCapture: true,
        performance: true
      };
      
      const autoFill = document.getElementById('toggleAutoFill');
      const notifications = document.getElementById('toggleNotifications');
      const quickCapture = document.getElementById('toggleQuickCapture');
      const performance = document.getElementById('togglePerformance');
      
      if (autoFill) {
        autoFill.checked = toggles.autoFill !== false;
        autoFill.addEventListener('change', () => {
          chrome.storage.local.set({
            featureToggles: { ...toggles, autoFill: autoFill.checked }
          });
        });
      }
      
      if (notifications) {
        notifications.checked = toggles.notifications !== false;
        notifications.addEventListener('change', () => {
          chrome.storage.local.set({
            featureToggles: { ...toggles, notifications: notifications.checked }
          });
        });
      }
      
      if (quickCapture) {
        quickCapture.checked = toggles.quickCapture !== false;
        quickCapture.addEventListener('change', () => {
          chrome.storage.local.set({
            featureToggles: { ...toggles, quickCapture: quickCapture.checked }
          });
        });
      }
      
      if (performance) {
        performance.checked = toggles.performance !== false;
        performance.addEventListener('change', () => {
          chrome.storage.local.set({
            featureToggles: { ...toggles, performance: performance.checked }
          });
        });
      }
    });
  } catch (error) {
    console.error('Error setting up feature toggles:', error);
  }
}

