// Enhanced popup functionality for ClipTrack v2.0

let bulkSelectMode = false;
let selectedItems = new Set();
let allFavorites = [];
let allTemplates = [];

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', () => {
  setupEnhancedEventListeners();
  loadFavorites();
  loadTemplates();
  initTheme();
  initSettingsListeners();
});

async function initSettingsListeners() {
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || {};

  const showStatisticsToggle = document.getElementById('showStatisticsToggle');
  const showExportToggle = document.getElementById('showExportToggle');
  const showTemplatesToggle = document.getElementById('showTemplatesToggle');

  const statsBtn = document.getElementById('statsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const templatesBtn = document.getElementById('templatesBtn');

  // Set initial state
  if (showStatisticsToggle) showStatisticsToggle.checked = settings.showStatistics !== false;
  if (showExportToggle) showExportToggle.checked = settings.showExport !== false;
  if (showTemplatesToggle) showTemplatesToggle.checked = settings.showTemplates !== false;

  updateHeaderButtons();

  // Add listeners
  [showStatisticsToggle, showExportToggle, showTemplatesToggle].forEach(toggle => {
    if (toggle) {
      toggle.addEventListener('change', () => {
        updateHeaderButtons();
        saveSettingsEnhanced();
      });
    }
  });

  function updateHeaderButtons() {
    if (statsBtn) statsBtn.style.display = (showStatisticsToggle && showStatisticsToggle.checked) ? 'flex' : 'none';
    if (exportBtn) exportBtn.style.display = (showExportToggle && showExportToggle.checked) ? 'flex' : 'none';
    if (templatesBtn) templatesBtn.style.display = (showTemplatesToggle && showTemplatesToggle.checked) ? 'flex' : 'none';
  }
}

async function saveSettingsEnhanced() {
  const trackCopyToggle = document.getElementById('trackCopyToggle');
  const trackPasteToggle = document.getElementById('trackPasteToggle');
  const autoSaveTemplatesToggle = document.getElementById('autoSaveTemplatesToggle');
  const showStatisticsToggle = document.getElementById('showStatisticsToggle');
  const showExportToggle = document.getElementById('showExportToggle');
  const showTemplatesToggle = document.getElementById('showTemplatesToggle');
  const maxItemsInput = document.getElementById('maxItemsInput');

  const settings = {
    trackCopy: trackCopyToggle ? trackCopyToggle.checked : true,
    trackPaste: trackPasteToggle ? trackPasteToggle.checked : true,
    autoSaveTemplates: autoSaveTemplatesToggle ? autoSaveTemplatesToggle.checked : false,
    showStatistics: showStatisticsToggle ? showStatisticsToggle.checked : true,
    showExport: showExportToggle ? showExportToggle.checked : true,
    showTemplates: showTemplatesToggle ? showTemplatesToggle.checked : true,
    maxItems: maxItemsInput ? (parseInt(maxItemsInput.value) || 500) : 500
  };

  await chrome.storage.local.set({ settings });
}

async function initTheme() {
  const { theme } = await chrome.storage.local.get('theme');

  // Default to light if not set, or if explicitly light
  if (theme === 'light' || !theme) {
    document.documentElement.setAttribute('data-theme', 'light');
    const toggle = document.getElementById('themeToggle');
    if (toggle) toggle.checked = true;
  }

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      const newTheme = e.target.checked ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      chrome.storage.local.set({ theme: newTheme });
    });
  }
}

function setupEnhancedEventListeners() {
  const elements = [
    { id: 'exportBtn', event: 'click', handler: () => document.getElementById('exportModal')?.classList.add('active') },
    { id: 'statsBtn', event: 'click', handler: async () => { await loadStatistics(); document.getElementById('statsModal')?.classList.add('active'); } },
    { id: 'templatesBtn', event: 'click', handler: () => { loadTemplates(); document.getElementById('templatesModal')?.classList.add('active'); } },
    { id: 'bulkSelectBtn', event: 'click', handler: toggleBulkSelectMode },
    { id: 'bulkTagBtn', event: 'click', handler: bulkAddTag },
    { id: 'bulkDeleteBtn', event: 'click', handler: bulkDeleteItems },
    { id: 'cancelBulkBtn', event: 'click', handler: cancelBulkSelect },
    { id: 'saveTemplateBtn', event: 'click', handler: saveNewTemplate }
  ];

  elements.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (el) el.addEventListener(cfg.event, cfg.handler);
  });

  // Export format buttons
  document.querySelectorAll('.export-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      exportData(format);
    });
  });

  // Close modal buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal')?.classList.remove('active');
    });
  });

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

// Bulk Selection Mode
function toggleBulkSelectMode() {
  bulkSelectMode = !bulkSelectMode;
  selectedItems.clear();

  const bulkBtn = document.getElementById('bulkSelectBtn');
  const bulkBar = document.getElementById('bulkActionsBar');

  if (bulkSelectMode) {
    if (bulkBtn) bulkBtn.textContent = 'Cancel';
    if (bulkBar) bulkBar.style.display = 'flex';
    document.querySelectorAll('.history-item').forEach(item => {
      item.classList.add('bulk-select-mode');
      addCheckboxToItem(item);
    });
  } else {
    if (bulkBtn) bulkBtn.textContent = 'Select';
    if (bulkBar) bulkBar.style.display = 'none';
    document.querySelectorAll('.history-item').forEach(item => {
      item.classList.remove('bulk-select-mode');
      const checkbox = item.querySelector('.item-checkbox');
      if (checkbox) checkbox.remove();
    });
  }

  updateSelectedCount();
}

function addCheckboxToItem(item) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'item-checkbox';
  checkbox.dataset.id = item.dataset.id;

  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      selectedItems.add(item.dataset.id);
    } else {
      selectedItems.delete(item.dataset.id);
    }
    updateSelectedCount();
  });

  item.insertBefore(checkbox, item.firstChild);
}

function updateSelectedCount() {
  document.getElementById('selectedCount').textContent = selectedItems.size;
}

function cancelBulkSelect() {
  toggleBulkSelectMode();
}

async function bulkAddTag() {
  if (selectedItems.size === 0) {
    alert('Please select items first');
    return;
  }

  const tag = prompt('Enter tag name:');
  if (!tag) return;

  const ids = Array.from(selectedItems);
  await chrome.runtime.sendMessage({ type: 'BULK_TAG', ids, tag });

  toggleBulkSelectMode();
  await loadHistory();
}

async function bulkDeleteItems() {
  if (selectedItems.size === 0) {
    alert('Please select items first');
    return;
  }

  if (!confirm(`Delete ${selectedItems.size} items?`)) return;

  const ids = Array.from(selectedItems);
  await chrome.runtime.sendMessage({ type: 'BULK_DELETE', ids });

  toggleBulkSelectMode();
  await loadHistory();
}

// Favorites
async function loadFavorites() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_FAVORITES' });
  allFavorites = response || [];
  updateCounts();
}

async function toggleFavorite(id, button) {
  const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_FAVORITE', id });

  if (response.success) {
    button.classList.toggle('active', response.isFavorite);
    await loadFavorites();
    await loadHistory();
  }
}

// Tags
async function addTagToItem(id) {
  const tag = prompt('Enter tag name:');
  if (!tag) return;

  await chrome.runtime.sendMessage({ type: 'ADD_TAG', id, tag });
  await loadHistory();
}

async function removeTagFromItem(id, tag) {
  await chrome.runtime.sendMessage({ type: 'REMOVE_TAG', id, tag });
  await loadHistory();
}

// Export Data
async function exportData(format) {
  const history = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });

  let content, filename, mimeType;

  if (format === 'json') {
    content = JSON.stringify(history, null, 2);
    filename = `cliptrack-export-${Date.now()}.json`;
    mimeType = 'application/json';
  } else if (format === 'csv') {
    content = convertToCSV(history);
    filename = `cliptrack-export-${Date.now()}.csv`;
    mimeType = 'text/csv';
  } else if (format === 'txt') {
    content = convertToText(history);
    filename = `cliptrack-export-${Date.now()}.txt`;
    mimeType = 'text/plain';
  }

  downloadFile(content, filename, mimeType);
  document.getElementById('exportModal').classList.remove('active');
}

function convertToCSV(data) {
  const headers = ['Type', 'Text', 'URL', 'Title', 'Timestamp', 'Tags'];
  const rows = data.map(item => [
    item.type,
    `"${item.text.replace(/"/g, '""')}"`,
    item.url,
    `"${item.title.replace(/"/g, '""')}"`,
    new Date(item.timestamp).toISOString(),
    (item.tags || []).join(';')
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function convertToText(data) {
  return data.map(item => {
    const date = new Date(item.timestamp).toLocaleString();
    const tags = item.tags && item.tags.length > 0 ? `\nTags: ${item.tags.join(', ')}` : '';
    return `[${item.type.toUpperCase()}] ${date}\n${item.title}\n${item.url}\n\n${item.text}${tags}\n\n${'='.repeat(80)}\n`;
  }).join('\n');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Statistics
async function loadStatistics() {
  const stats = await chrome.runtime.sendMessage({ type: 'GET_STATISTICS' });
  const history = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });

  const statsContent = document.getElementById('statisticsContent');

  // Overall stats
  const totalCopies = stats.totalCopies || 0;
  const totalPastes = stats.totalPastes || 0;
  const totalCuts = stats.totalCuts || 0;
  const totalItems = history.length;
  const favoritesCount = history.filter(h => h.isFavorite).length;
  const taggedCount = history.filter(h => h.tags && h.tags.length > 0).length;

  // Most used sites
  const mostUsedSites = Object.entries(stats.mostUsedSites || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  statsContent.innerHTML = `
    <div class="stat-card">
      <h3>Overall Statistics</h3>
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">${totalCopies}</div>
          <div class="stat-label">Copies</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalPastes}</div>
          <div class="stat-label">Pastes</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalCuts}</div>
          <div class="stat-label">Cuts</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalItems}</div>
          <div class="stat-label">Total Items</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${favoritesCount}</div>
          <div class="stat-label">Favorites</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${taggedCount}</div>
          <div class="stat-label">Tagged</div>
        </div>
      </div>
    </div>
    
    ${mostUsedSites.length > 0 ? `
      <div class="stat-card">
        <h3>Most Used Sites</h3>
        <ul class="stat-list">
          ${mostUsedSites.map(([site, count]) => `
            <li class="stat-list-item">
              <span class="stat-site">${site}</span>
              <span class="stat-count">${count} items</span>
            </li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    <div class="stat-card">
      <h3>Quick Facts</h3>
      <ul class="stat-list">
        <li class="stat-list-item">
          <span class="stat-site">Average text length</span>
          <span class="stat-count">${Math.round(history.reduce((sum, h) => sum + h.text.length, 0) / (history.length || 1))} chars</span>
        </li>
        <li class="stat-list-item">
          <span class="stat-site">Longest text</span>
          <span class="stat-count">${Math.max(...history.map(h => h.text.length), 0)} chars</span>
        </li>
        <li class="stat-list-item">
          <span class="stat-site">Total characters copied</span>
          <span class="stat-count">${history.reduce((sum, h) => sum + h.text.length, 0).toLocaleString()}</span>
        </li>
      </ul>
    </div>
  `;
}

// Templates
async function loadTemplates() {
  allTemplates = await chrome.runtime.sendMessage({ type: 'GET_TEMPLATES' });
  renderTemplates();
}

function renderTemplates() {
  const templatesList = document.getElementById('templatesList');

  if (allTemplates.length === 0) {
    templatesList.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px;">
        <p style="color: var(--text-muted);">No templates saved yet</p>
      </div>
    `;
    return;
  }

  templatesList.innerHTML = allTemplates.map(template => `
    <div class="template-item">
      <div class="template-header">
        <div class="template-info">
          <h4>${escapeHtml(template.name)}</h4>
          <span class="template-category">${escapeHtml(template.category)}</span>
        </div>
        <div class="template-actions">
          <button class="action-btn primary" onclick="useTemplate('${template.id}')">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" stroke-width="2"/>
            </svg>
            Use
          </button>
          <button class="action-btn danger" onclick="deleteTemplateItem('${template.id}')">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="template-text">${escapeHtml(template.text)}</div>
    </div>
  `).join('');
}

async function saveNewTemplate() {
  const name = document.getElementById('templateName').value.trim();
  const text = document.getElementById('templateText').value.trim();
  const category = document.getElementById('templateCategory').value.trim() || 'General';

  if (!name || !text) {
    alert('Please enter both name and text');
    return;
  }

  await chrome.runtime.sendMessage({
    type: 'SAVE_TEMPLATE',
    template: { name, text, category }
  });

  document.getElementById('templateName').value = '';
  document.getElementById('templateText').value = '';
  document.getElementById('templateCategory').value = '';

  await loadTemplates();
}

async function useTemplate(id) {
  const template = allTemplates.find(t => t.id === id);
  if (template) {
    await navigator.clipboard.writeText(template.text);
    alert('Template copied to clipboard!');
    document.getElementById('templatesModal').classList.remove('active');
  }
}

async function deleteTemplateItem(id) {
  if (!confirm('Delete this template?')) return;

  await chrome.runtime.sendMessage({ type: 'DELETE_TEMPLATE', id });
  await loadTemplates();
}

// Override the original createHistoryItem to add new features
window.createHistoryItemEnhanced = function (item) {
  const div = document.createElement('div');
  div.className = `history-item type-${item.type} ${item.isFavorite ? 'favorite' : ''}`;
  div.dataset.id = item.id;

  const timeAgo = getTimeAgo(item.timestamp);
  const truncatedText = item.text.length > 200 ? item.text.substring(0, 200) + '...' : item.text;
  const tags = item.tags || [];

  div.innerHTML = `
    <div class="item-text" title="${escapeHtml(item.text)}">${escapeHtml(truncatedText)}</div>
    <div class="item-meta">
      <div class="item-time">
        ${timeAgo} • ${escapeHtml(item.title || 'Unknown')}
      </div>
      ${tags.length > 0 ? `
        <div class="item-tags">
          ${tags.map(tag => `
            <span class="tag">${escapeHtml(tag)}</span>
          `).join('')}
        </div>
      ` : ''}
    </div>
    <div class="item-actions">
      <button class="item-action-btn copy-btn" data-id="${item.id}" title="Copy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      </button>
      <button class="item-action-btn favorite-btn ${item.isFavorite ? 'active' : ''}" data-id="${item.id}" title="Favorite">
        <svg viewBox="0 0 24 24" fill="${item.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
      </button>
      <button class="item-action-btn delete-btn" data-id="${item.id}" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  `;

  // Add event listeners
  const copyBtn = div.querySelector('.copy-btn');
  const deleteBtn = div.querySelector('.delete-btn');
  const favoriteBtn = div.querySelector('.favorite-btn');

  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await copyToClipboard(item.text, copyBtn);
  });

  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteItem(item.id);
  });

  favoriteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await toggleFavorite(item.id, favoriteBtn);
  });

  if (bulkSelectMode) {
    div.classList.add('bulk-select-mode');
    addCheckboxToItem(div);
  }

  return div;
};

// Override filter function to include favorites
window.filterAndRenderHistoryEnhanced = function () {
  // Apply filter
  filteredHistory = allHistory.filter(item => {
    // Filter by type
    if (currentFilter === 'favorites') {
      if (!item.isFavorite) return false;
    } else if (currentFilter !== 'all' && item.type !== currentFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery && !item.text.toLowerCase().includes(searchQuery)) {
      return false;
    }

    return true;
  });

  renderHistory();
};

// Update counts to include favorites
window.updateCountsEnhanced = function () {
  const elements = ['countAll', 'countCopy', 'countPaste', 'countCut', 'countFavorites'];
  const counts = {
    countAll: allHistory.length,
    countCopy: allHistory.filter(item => item.type === 'copy').length,
    countPaste: allHistory.filter(item => item.type === 'paste').length,
    countCut: allHistory.filter(item => item.type === 'cut').length,
    countFavorites: allHistory.filter(item => item.isFavorite).length
  };

  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = counts[id];
  });
};

// Make functions globally accessible
window.addTagToItem = addTagToItem;
window.removeTagFromItem = removeTagFromItem;
window.useTemplate = useTemplate;
window.deleteTemplateItem = deleteTemplateItem;

// Override original functions if they exist
if (typeof window.createHistoryItem !== 'undefined') {
  window.createHistoryItem = window.createHistoryItemEnhanced;
}

if (typeof window.filterAndRenderHistory !== 'undefined') {
  window.filterAndRenderHistory = window.filterAndRenderHistoryEnhanced;
}

if (typeof window.updateCounts !== 'undefined') {
  window.updateCounts = window.updateCountsEnhanced;
}

console.log('ClipTrack v2.0 Enhanced Features Loaded');
