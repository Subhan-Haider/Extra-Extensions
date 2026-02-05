// Popup script
let allHistory = [];
let filteredHistory = [];
let currentFilter = 'all';
let searchQuery = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadHistory();
    setupEventListeners();
    await loadSettings();
});

// Listen for storage changes to update UI instantly
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.clipboardHistory) {
        loadHistory();
    }
});

// Setup event listeners
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    if (searchInput && clearSearchBtn) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
            filterAndRenderHistory();
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.style.display = 'none';
            filterAndRenderHistory();
        });
    }

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            filterAndRenderHistory();
        });
    });

    // Clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all clipboard history?')) {
                await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
                await loadHistory();
            }
        });
    }

    // Settings
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }

    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Save settings button
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Load history from storage
async function loadHistory() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
        allHistory = response || [];
        filterAndRenderHistory();
        updateCounts();
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Filter and render history
function filterAndRenderHistory() {
    // Apply filter
    filteredHistory = allHistory.filter(item => {
        // Filter by type
        if (currentFilter !== 'all' && item.type !== currentFilter) {
            return false;
        }

        // Filter by search query
        if (searchQuery && !item.text.toLowerCase().includes(searchQuery)) {
            return false;
        }

        return true;
    });

    renderHistory();
}

// Render history items
let lastRenderedSignature = '';

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    const noResults = document.getElementById('noResults');

    // Create a signature to check if re-render is needed
    // We purposefully include timeAgo related data indirectly or we accept that timeAgo updates might be skipped until new data comes. 
    // Actually, users WANT time ago updates. But full re-render flickers.
    // The main flicker cause is innerHTML = ''.

    // Let's rely on IDs + Timestamp + Favorites status.
    const currentSignature = JSON.stringify(filteredHistory.map(h => ({ id: h.id, text: h.text, type: h.type, fav: h.isFavorite, time: Math.floor(h.timestamp / 1000) })));

    if (currentSignature === lastRenderedSignature) {
        // Data hasn't changed, but maybe we should update "Time Ago" text?
        // For now, let's just abort to solve the "Refresh Flicker" issue.
        return;
    }

    lastRenderedSignature = currentSignature;

    // Clear current list
    historyList.innerHTML = '';

    if (allHistory.length === 0) {
        emptyState.style.display = 'flex';
        noResults.style.display = 'none';
        historyList.style.display = 'none';
        return;
    }

    if (filteredHistory.length === 0) {
        emptyState.style.display = 'none';
        noResults.style.display = 'flex';
        historyList.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    noResults.style.display = 'none';
    historyList.style.display = 'flex';

    // Render items
    filteredHistory.forEach(item => {
        const itemEl = createHistoryItem(item);
        historyList.appendChild(itemEl);
    });

    updateTotalItems();
}

// Create history item element
function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = `history-item type-${item.type}`;
    div.dataset.id = item.id;

    const timeAgo = getTimeAgo(item.timestamp);
    const truncatedText = item.text.length > 200 ? item.text.substring(0, 200) + '...' : item.text;

    div.innerHTML = `
    <div class="item-meta">
      <div class="item-text" title="${escapeHtml(item.text)}">${escapeHtml(truncatedText)}</div>
      <div class="item-time">
        ${timeAgo} // ${escapeHtml(item.title)}
      </div>
    </div>
    <div class="item-actions">
      <button class="item-action-btn copy-btn" data-id="${item.id}">
        COPY
      </button>
      <button class="item-action-btn delete-btn" data-id="${item.id}" title="Delete">
        DELETE
      </button>
    </div>
  `;

    // Add event listeners
    const copyBtn = div.querySelector('.copy-btn');
    const deleteBtn = div.querySelector('.delete-btn');

    copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const text = item.text;
        await copyToClipboard(text, copyBtn);
    });

    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteItem(item.id);
    });

    return div;
}

// Copy to clipboard
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);

        // Visual feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copied!
    `;
        button.style.pointerEvents = 'none';

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.pointerEvents = 'auto';
        }, 2000);
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        alert('Failed to copy to clipboard');
    }
}

// Delete item
async function deleteItem(id) {
    try {
        await chrome.runtime.sendMessage({ type: 'DELETE_ITEM', id });
        await loadHistory();
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

// Update counts (Safely)
function updateCounts() {
    // Only update if elements exist (they were removed in the new UI)
}

// Update total items
function updateTotalItems() {
    const totalFiltered = filteredHistory.length;
    const totalAll = allHistory.length;
    const totalEl = document.getElementById('totalItems');
    if (totalEl) {
        totalEl.textContent = `Showing ${totalFiltered} of ${totalAll} items`;
    }
}

// Get time ago
function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load settings
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};

        const trackCopyToggle = document.getElementById('trackCopyToggle');
        const trackPasteToggle = document.getElementById('trackPasteToggle');
        const maxItemsInput = document.getElementById('maxItemsInput');

        if (trackCopyToggle) trackCopyToggle.checked = settings.trackCopy !== false;
        if (trackPasteToggle) trackPasteToggle.checked = settings.trackPaste !== false;
        if (maxItemsInput) maxItemsInput.value = settings.maxItems || 500;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save settings
async function saveSettings() {
    try {
        const trackCopyToggle = document.getElementById('trackCopyToggle');
        const trackPasteToggle = document.getElementById('trackPasteToggle');
        const maxItemsInput = document.getElementById('maxItemsInput');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        const settingsModal = document.getElementById('settingsModal');

        if (!trackCopyToggle || !trackPasteToggle || !maxItemsInput) {
            console.error('Settings form elements not found');
            return;
        }

        const settings = {
            trackCopy: trackCopyToggle.checked,
            trackPaste: trackPasteToggle.checked,
            maxItems: parseInt(maxItemsInput.value) || 500
        };

        await chrome.storage.local.set({ settings });

        // Visual feedback
        if (saveSettingsBtn) {
            const originalText = saveSettingsBtn.textContent;
            saveSettingsBtn.textContent = 'Saved!';

            setTimeout(() => {
                saveSettingsBtn.textContent = originalText;
                if (settingsModal) {
                    settingsModal.classList.remove('active');
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings');
    }
}

// Auto-refresh every 5 seconds
setInterval(async () => {
    await loadHistory();
}, 1000);
