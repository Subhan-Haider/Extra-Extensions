// Dashboard Script for BlizFlow Extension
// Handles dashboard data loading and interactions

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
    apiCache = {
      isConfigured: async () => {
        const data = await chrome.storage.local.get(['apiKey', 'userData']);
        return !!(data.apiKey || data.userData?.apiKey);
      },
      getDashboardStats: async () => ({ success: false, error: 'API not available' }),
      getRecentActivity: async () => ({ success: false, error: 'API not available' }),
    };
    return apiCache;
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadDashboardData();
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
});

async function loadDashboardData() {
  try {
    // Load user info
    await loadUserInfo();
    
    // Load stats
    await loadStats();
    
    // Load recent activity
    await loadRecentActivity();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadUserInfo() {
  try {
    const data = await chrome.storage.local.get('userData');
    const subtitle = document.getElementById('dashboardSubtitle');
    
    if (subtitle && data.userData) {
      const name = data.userData.name || data.userData.email || data.userData.username || 'User';
      subtitle.textContent = `Welcome back, ${name}!`;
    } else if (subtitle) {
      subtitle.textContent = 'Please log in to see your dashboard';
    }
  } catch (error) {
    console.error('Error loading user info:', error);
  }
}

async function loadStats() {
  try {
    const api = await getApi();
    
    // Try to fetch from API if configured
    if (await api.isConfigured()) {
      try {
        if (typeof api.getDashboardStats === 'function') {
          const result = await api.getDashboardStats();
          if (result.success && result.data) {
            await chrome.storage.local.set({ dashboardStats: result.data });
            updateStatsDisplay(result.data);
            return;
          }
        }
      } catch (error) {
        console.warn('Could not fetch stats from API, using cached data:', error);
      }
    }

    // Load from storage
    const stats = await chrome.storage.local.get('dashboardStats');
    if (stats.dashboardStats) {
      updateStatsDisplay(stats.dashboardStats);
    } else {
      // Calculate from other stored data
      await calculateStatsFromStorage();
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function calculateStatsFromStorage() {
  try {
    const api = await getApi();
    let totalRevenue = 0;
    let totalInvoices = 0;
    let activeClients = 0;
    let pendingTasks = 0;

    // Try to get invoices
    if (await api.isConfigured() && typeof api.getInvoices === 'function') {
      try {
        const invoicesResult = await api.getInvoices();
        if (invoicesResult.success && invoicesResult.data) {
          const invoices = Array.isArray(invoicesResult.data) 
            ? invoicesResult.data 
            : invoicesResult.data.items || [];
          totalInvoices = invoices.length;
          totalRevenue = invoices.reduce((sum, inv) => {
            return sum + (parseFloat(inv.total || inv.amount || 0));
          }, 0);
        }
      } catch (error) {
        console.warn('Could not fetch invoices:', error);
      }
    }

    // Try to get clients
    if (await api.isConfigured() && typeof api.getClients === 'function') {
      try {
        const clientsResult = await api.getClients();
        if (clientsResult.success && clientsResult.data) {
          const clients = Array.isArray(clientsResult.data) 
            ? clientsResult.data 
            : clientsResult.data.items || [];
          activeClients = clients.filter(c => c.status === 'active' || !c.status).length;
        }
      } catch (error) {
        console.warn('Could not fetch clients:', error);
      }
    }

    const stats = {
      totalRevenue,
      totalInvoices,
      activeClients,
      pendingTasks,
    };

    await chrome.storage.local.set({ dashboardStats: stats });
    updateStatsDisplay(stats);
  } catch (error) {
    console.error('Error calculating stats:', error);
  }
}

function updateStatsDisplay(stats) {
  const revenueEl = document.getElementById('totalRevenue');
  const invoicesEl = document.getElementById('totalInvoices');
  const clientsEl = document.getElementById('activeClients');
  const tasksEl = document.getElementById('pendingTasks');

  if (revenueEl) {
    revenueEl.textContent = `$${formatNumber(stats.totalRevenue || 0)}`;
  }
  if (invoicesEl) {
    invoicesEl.textContent = formatNumber(stats.totalInvoices || 0);
  }
  if (clientsEl) {
    clientsEl.textContent = formatNumber(stats.activeClients || 0);
  }
  if (tasksEl) {
    tasksEl.textContent = formatNumber(stats.pendingTasks || 0);
  }
}

async function loadRecentActivity() {
  try {
    const api = await getApi();
    const container = document.getElementById('recentActivity');
    
    if (!container) return;

    // Try to fetch from API if configured
    if (await api.isConfigured()) {
      try {
        if (typeof api.getRecentActivity === 'function') {
          const result = await api.getRecentActivity({ limit: 10 });
          if (result.success && result.data) {
            await chrome.storage.local.set({ recentActivity: result.data });
            displayActivity(result.data);
            return;
          }
        }
      } catch (error) {
        console.warn('Could not fetch activity from API, using cached data:', error);
      }
    }

    // Load from storage or calculate from recent items
    const activity = await chrome.storage.local.get('recentActivity');
    if (activity.recentActivity && activity.recentActivity.length > 0) {
      displayActivity(activity.recentActivity);
    } else {
      // Try to get from recent items
      const recent = await chrome.storage.local.get('recentItems');
      if (recent.recentItems && recent.recentItems.length > 0) {
        const activityItems = recent.recentItems.map(item => ({
          type: item.type,
          title: item.name,
          time: item.time,
        }));
        displayActivity(activityItems);
      } else {
        container.innerHTML = '<div class="empty-state">No recent activity</div>';
      }
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
    const container = document.getElementById('recentActivity');
    if (container) {
      container.innerHTML = '<div class="empty-state">Error loading activity</div>';
    }
  }
}

function displayActivity(activities) {
  const container = document.getElementById('recentActivity');
  if (!container) return;

  if (!activities || activities.length === 0) {
    container.innerHTML = '<div class="empty-state">No recent activity</div>';
    return;
  }

  container.innerHTML = activities.slice(0, 10).map(activity => {
    const icon = getActivityIcon(activity.type);
    const title = activity.title || activity.name || 'Activity';
    const time = formatTime(activity.time || activity.created_at || activity.createdAt);
    
    return `
      <div class="activity-item">
        <div class="activity-icon">${icon}</div>
        <div class="activity-details">
          <div class="activity-title">${title}</div>
          <div class="activity-time">${time}</div>
        </div>
      </div>
    `;
  }).join('');
}

function getActivityIcon(type) {
  const icons = {
    invoice: '📄',
    client: '👤',
    expense: '💰',
    time: '⏱️',
    report: '📊',
    payment: '💳',
    task: '✅',
    note: '📝',
  };
  return icons[type] || '📋';
}

function formatTime(timestamp) {
  if (!timestamp) return 'Unknown time';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.style.transform = 'rotate(360deg)';
      await loadDashboardData();
      setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
      }, 500);
    });
  }

  // Quick links
  const links = {
    linkInvoices: 'https://blizflow.online/invoices',
    linkClients: 'https://blizflow.online/clients',
    linkExpenses: 'https://blizflow.online/expenses',
    linkTime: 'https://blizflow.online/time-tracking',
    linkReports: 'https://blizflow.online/reports',
    linkSettings: 'https://blizflow.online/settings',
  };

  Object.entries(links).forEach(([id, url]) => {
    const link = document.getElementById(id);
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url });
      });
    }
  });
}

