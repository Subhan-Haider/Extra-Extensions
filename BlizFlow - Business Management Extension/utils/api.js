// API Utility - Centralized API handling for the extension
// Handles API key retrieval and API calls

export class API {
  constructor() {
    this.baseUrl = 'https://blizflow.online/api';
  }

  // Get API key from storage (checks both locations)
  async getApiKey() {
    try {
      const data = await chrome.storage.local.get(['apiKey', 'userData']);
      
      // Check direct apiKey storage first
      if (data.apiKey) {
        return data.apiKey.trim();
      }
      
      // Check userData.apiKey
      if (data.userData?.apiKey) {
        return data.userData.apiKey.trim();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  // Get API URL from storage or use default
  async getApiUrl() {
    try {
      const data = await chrome.storage.local.get(['apiUrl', 'userData']);
      
      if (data.apiUrl) {
        return data.apiUrl.trim();
      }
      
      if (data.userData?.apiUrl) {
        return data.userData.apiUrl.trim();
      }
      
      return this.baseUrl;
    } catch (error) {
      console.error('Error getting API URL:', error);
      return this.baseUrl;
    }
  }

  // Check if API is configured
  async isConfigured() {
    const apiKey = await this.getApiKey();
    return !!apiKey;
  }

  // Make API request with authentication
  async request(endpoint, options = {}) {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        return { success: false, error: 'API key not configured. Please set your API key in settings.' };
      }

      const apiUrl = await this.getApiUrl();
      const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {}),
        },
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data,
        };
      }

      return {
        success: true,
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error.message || 'Network error. Please check your connection.',
      };
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  // Test API connection
  async testConnection() {
    return this.get('/health');
  }

  // Get user info
  async getUserInfo() {
    return this.get('/user');
  }

  // Invoices
  async getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/invoices${query ? '?' + query : ''}`);
  }

  async createInvoice(data) {
    return this.post('/invoices', data);
  }

  async updateInvoice(id, data) {
    return this.put(`/invoices/${id}`, data);
  }

  async deleteInvoice(id) {
    return this.delete(`/invoices/${id}`);
  }

  // Clients
  async getClients(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/clients${query ? '?' + query : ''}`);
  }

  async createClient(data) {
    return this.post('/clients', data);
  }

  async updateClient(id, data) {
    return this.put(`/clients/${id}`, data);
  }

  async deleteClient(id) {
    return this.delete(`/clients/${id}`);
  }

  // Expenses
  async getExpenses(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/expenses${query ? '?' + query : ''}`);
  }

  async createExpense(data) {
    return this.post('/expenses', data);
  }

  async updateExpense(id, data) {
    return this.put(`/expenses/${id}`, data);
  }

  async deleteExpense(id) {
    return this.delete(`/expenses/${id}`);
  }

  // Stats
  async getTodayStats() {
    return this.get('/stats/today');
  }

  async getStats(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/stats${query ? '?' + query : ''}`);
  }

  // Time Tracking
  async getTimeEntries(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/time-entries${query ? '?' + query : ''}`);
  }

  async createTimeEntry(data) {
    return this.post('/time-entries', data);
  }

  // Reports
  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/reports${query ? '?' + query : ''}`);
  }
}

// Export singleton instance
export const api = new API();

