// Sync Service for Extension
// Syncs data between extension and web app

export class SyncService {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
  }

  // Lazy load API utility
  async getApi() {
    try {
      const apiModule = await import('../utils/api.js');
      return apiModule.api;
    } catch (error) {
      console.warn('API utility not available:', error);
      return {
        isConfigured: async () => {
          const data = await chrome.storage.local.get(['apiKey', 'userData']);
          return !!(data.apiKey || data.userData?.apiKey);
        },
        getInvoices: async () => ({ success: false, error: 'API not available' }),
        getClients: async () => ({ success: false, error: 'API not available' }),
        getExpenses: async () => ({ success: false, error: 'API not available' }),
        getTodayStats: async () => ({ success: false, error: 'API not available' }),
        getUserInfo: async () => ({ success: false, error: 'API not available' }),
        createClient: async () => ({ success: false, error: 'API not available' }),
        createInvoice: async () => ({ success: false, error: 'API not available' }),
        createExpense: async () => ({ success: false, error: 'API not available' }),
      };
    }
  }

  // Sync all data from web app
  async sync() {
    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    try {
      const api = await this.getApi();
      // Check if API is configured
      if (!await api.isConfigured()) {
        this.isSyncing = false;
        return { success: false, error: 'API key not configured. Please set your API key in extension settings.' };
      }

      console.log('Starting full sync with web app...');

      // Sync user info first (always get fresh data)
      const userResult = await api.getUserInfo();
      if (userResult.success && userResult.data) {
        await chrome.storage.local.set({ 
          userData: userResult.data,
          userDataLastUpdate: new Date().toISOString()
        });
      }

      // Sync invoices
      const invoicesResult = await api.getInvoices({ limit: 100 });
      if (invoicesResult.success && invoicesResult.data) {
        const invoices = Array.isArray(invoicesResult.data) 
          ? invoicesResult.data 
          : invoicesResult.data.items || [];
        await chrome.storage.local.set({ invoices: invoices });
      }
      
      // Sync clients
      const clientsResult = await api.getClients({ limit: 100 });
      if (clientsResult.success && clientsResult.data) {
        const clients = Array.isArray(clientsResult.data)
          ? clientsResult.data
          : clientsResult.data.items || [];
        await chrome.storage.local.set({ clients: clients });
      }
      
      // Sync expenses
      const expensesResult = await api.getExpenses({ limit: 100 });
      if (expensesResult.success && expensesResult.data) {
        const expenses = Array.isArray(expensesResult.data)
          ? expensesResult.data
          : expensesResult.data.items || [];
        await chrome.storage.local.set({ expenses: expenses });
      }
      
      // Sync stats
      const statsResult = await api.getTodayStats();
      if (statsResult.success && statsResult.data) {
        await chrome.storage.local.set({ todayStats: statsResult.data });
      }

      // Calculate and save dashboard stats
      const dashboardStats = await this.calculateDashboardStats(api);
      if (dashboardStats) {
        await chrome.storage.local.set({ dashboardStats });
      }

      // Sync recent activity
      await this.syncRecentActivity(api);

      // Sync captured data to web app
      await this.syncCapturedData(api);

      await chrome.storage.local.set({
        lastSync: new Date().toISOString(),
        syncStatus: 'success'
      });

      console.log('Full sync completed successfully');
      this.isSyncing = false;
      return { success: true, message: 'Data synced successfully' };
    } catch (error) {
      console.error('Sync error:', error);
      await chrome.storage.local.set({
        syncStatus: 'error',
        lastSyncError: error.message
      });
      this.isSyncing = false;
      return { success: false, error: error.message };
    }
  }

  // Calculate comprehensive dashboard stats
  async calculateDashboardStats(api) {
    try {
      const [invoicesResult, clientsResult] = await Promise.all([
        api.getInvoices({ limit: 100 }).catch(() => ({ success: false })),
        api.getClients({ limit: 100 }).catch(() => ({ success: false })),
      ]);

      let totalInvoices = 0;
      let totalRevenue = 0;
      let pendingCount = 0;
      let totalClients = 0;

      if (invoicesResult.success && invoicesResult.data) {
        const invoices = Array.isArray(invoicesResult.data)
          ? invoicesResult.data
          : invoicesResult.data.items || [];
        
        totalInvoices = invoicesResult.data.total || invoices.length;
        
        invoices.forEach(inv => {
          const amount = parseFloat(inv.total || inv.amount || inv.value || 0);
          if (!isNaN(amount)) {
            totalRevenue += amount;
          }
          
          const status = (inv.status || '').toLowerCase();
          if (status === 'pending' || status === 'unpaid' || status === 'draft' || status === 'sent') {
            pendingCount++;
          }
        });
      }

      if (clientsResult.success && clientsResult.data) {
        const clients = Array.isArray(clientsResult.data)
          ? clientsResult.data
          : clientsResult.data.items || [];
        totalClients = clientsResult.data.total || clients.length;
      }

      return {
        totalInvoices,
        activeClients: totalClients,
        totalRevenue,
        pending: pendingCount
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      return null;
    }
  }

  // Sync recent activity
  async syncRecentActivity(api) {
    try {
      const [invoicesResult, clientsResult, expensesResult] = await Promise.all([
        api.getInvoices({ limit: 5, sort: 'created_at', order: 'desc' }).catch(() => ({ success: false })),
        api.getClients({ limit: 3, sort: 'created_at', order: 'desc' }).catch(() => ({ success: false })),
        api.getExpenses({ limit: 3, sort: 'created_at', order: 'desc' }).catch(() => ({ success: false })),
      ]);

      const recentItems = [];

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
      console.error('Error syncing recent activity:', error);
    }
  }

  // Sync captured data (emails, phones) to web app
  async syncCapturedData(api) {
    try {
      const capturedData = await chrome.storage.local.get('capturedData');
      if (!capturedData.capturedData || !capturedData.capturedData.clients) {
        return;
      }

      const clientsToSync = capturedData.capturedData.clients.filter(c => c.savedLocally && !c.synced);
      
      for (const client of clientsToSync) {
        try {
          const clientData = {
            email: client.email,
            phone: client.phone,
            name: client.name || (client.email ? client.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : `Contact ${client.phone?.slice(-4) || ''}`),
            source: 'extension_capture',
            capturedAt: client.createdAt || new Date().toISOString()
          };

          const result = await api.createClient(clientData);
          if (result.success) {
            // Mark as synced
            client.synced = true;
            client.id = result.data?.id;
            client.syncedAt = new Date().toISOString();
          }
        } catch (error) {
          console.warn(`Failed to sync captured client ${client.email || client.phone}:`, error);
        }
      }

      // Update captured data
      await chrome.storage.local.set({ capturedData: capturedData.capturedData });
    } catch (error) {
      console.error('Error syncing captured data:', error);
    }
  }

  // Start automatic background sync
  startAutoSync(intervalMinutes = 5) {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    // Sync immediately
    this.sync();

    // Then sync at intervals
    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalMinutes * 60 * 1000);

    console.log(`Auto-sync started (every ${intervalMinutes} minutes)`);
  }

  // Stop automatic background sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  // Quick sync (only essential data)
  async quickSync() {
    try {
      const api = await this.getApi();
      if (!await api.isConfigured()) {
        return { success: false, error: 'API not configured' };
      }

      // Sync only stats and recent activity
      const [statsResult, userResult] = await Promise.all([
        api.getTodayStats().catch(() => ({ success: false })),
        api.getUserInfo().catch(() => ({ success: false })),
      ]);

      if (statsResult.success && statsResult.data) {
        await chrome.storage.local.set({ todayStats: statsResult.data });
      }

      if (userResult.success && userResult.data) {
        await chrome.storage.local.set({ userData: userResult.data });
      }

      await this.syncRecentActivity(api);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

