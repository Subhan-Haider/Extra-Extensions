# API Integration Guide

## ✅ Complete API Integration

The extension now has full API integration across all components!

## 📁 New Files

### `utils/api.js`
- **Centralized API utility** for all API calls
- Handles API key retrieval from storage
- Provides methods for all API endpoints
- Automatic error handling and validation

## 🔧 Updated Components

### 1. **Extension Features** (`features/extension-features.js`)
- ✅ Uses API utility for all operations
- ✅ `createInvoice()` - Creates invoices via API
- ✅ `createClient()` - Creates clients via API
- ✅ `addExpense()` - Creates expenses via API
- ✅ All methods check for API key configuration

### 2. **Sync Service** (`features/sync.js`)
- ✅ Uses API utility for all sync operations
- ✅ Syncs invoices, clients, expenses, stats
- ✅ Fetches user info from API
- ✅ Handles errors gracefully

### 3. **Popup** (`popup.js`)
- ✅ Loads stats from API
- ✅ Loads recent items from API
- ✅ Loads user data from API
- ✅ Falls back to cached data if API unavailable

### 4. **Background Service Worker** (`background.js`)
- ✅ Uses API for user data retrieval
- ✅ All feature operations use API
- ✅ Sync operations use API

### 5. **Options Page** (`options.js`)
- ✅ Tests API connection
- ✅ Saves API key to storage
- ✅ Validates API key format

## 🚀 API Methods Available

### User & Authentication
- `api.getUserInfo()` - Get current user information
- `api.testConnection()` - Test API connection

### Invoices
- `api.getInvoices(params)` - Get list of invoices
- `api.createInvoice(data)` - Create new invoice
- `api.updateInvoice(id, data)` - Update invoice
- `api.deleteInvoice(id)` - Delete invoice

### Clients
- `api.getClients(params)` - Get list of clients
- `api.createClient(data)` - Create new client
- `api.updateClient(id, data)` - Update client
- `api.deleteClient(id)` - Delete client

### Expenses
- `api.getExpenses(params)` - Get list of expenses
- `api.createExpense(data)` - Create new expense
- `api.updateExpense(id, data)` - Update expense
- `api.deleteExpense(id)` - Delete expense

### Statistics
- `api.getTodayStats()` - Get today's statistics
- `api.getStats(params)` - Get statistics with filters

### Time Tracking
- `api.getTimeEntries(params)` - Get time entries
- `api.createTimeEntry(data)` - Create time entry

### Reports
- `api.getReports(params)` - Get reports

## 📝 Usage Examples

### In Popup or Content Script
```javascript
import { api } from './utils/api.js';

// Check if API is configured
if (await api.isConfigured()) {
  // Get invoices
  const result = await api.getInvoices({ limit: 10 });
  if (result.success) {
    console.log('Invoices:', result.data);
  }
  
  // Create invoice
  const newInvoice = await api.createInvoice({
    clientId: '123',
    amount: 1000,
    description: 'Service fee'
  });
}
```

### In Background Service Worker
```javascript
import { api } from './utils/api.js';

// Sync data
const syncResult = await api.getTodayStats();
if (syncResult.success) {
  await chrome.storage.local.set({ todayStats: syncResult.data });
}
```

## 🔑 API Key Management

The API utility automatically:
- ✅ Retrieves API key from storage (checks both `apiKey` and `userData.apiKey`)
- ✅ Retrieves API URL from storage (defaults to `https://blizflow.online/api`)
- ✅ Validates API key before making requests
- ✅ Provides helpful error messages if API key is missing

## ⚙️ Configuration

API key is stored in:
1. `chrome.storage.local.apiKey` (primary)
2. `chrome.storage.local.userData.apiKey` (fallback)

API URL is stored in:
1. `chrome.storage.local.apiUrl` (primary)
2. `chrome.storage.local.userData.apiUrl` (fallback)

## 🛡️ Error Handling

All API calls:
- ✅ Check for API key before making requests
- ✅ Return structured error responses
- ✅ Handle network errors gracefully
- ✅ Provide user-friendly error messages

## 📊 Data Flow

1. **User enters API key** → Saved to storage
2. **Extension loads** → API utility retrieves key
3. **User action** → API call made with key
4. **Response received** → Data saved to storage
5. **UI updates** → Shows fresh data from API

## 🔄 Sync Flow

1. **Auto-sync** (every 15 minutes)
   - Syncs invoices, clients, expenses, stats
   - Updates local storage
   - Updates UI if popup is open

2. **Manual sync** (user clicks "Sync Now")
   - Same as auto-sync
   - Shows success/error message

3. **On-demand sync** (when popup opens)
   - Fetches latest stats
   - Fetches recent items
   - Updates user info

## ✅ Benefits

- **Centralized**: All API calls go through one utility
- **Consistent**: Same error handling everywhere
- **Maintainable**: Easy to update API endpoints
- **Reliable**: Automatic fallbacks and error handling
- **User-friendly**: Clear error messages

---

**All components now use the API! 🎉**

