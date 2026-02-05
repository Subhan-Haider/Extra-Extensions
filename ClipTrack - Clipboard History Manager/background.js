// Background service worker - Enhanced Version 2.0
const MAX_HISTORY_ITEMS = 500;

// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        clipboardHistory: [],
        favorites: [],
        tags: [],
        templates: [],
        statistics: {
            totalCopies: 0,
            totalPastes: 0,
            totalCuts: 0,
            mostUsedSites: {},
            dailyStats: {}
        },
        settings: {
            maxItems: MAX_HISTORY_ITEMS,
            enableNotifications: false,
            trackPaste: true,
            trackCopy: true,
            autoSaveTemplates: false,
            showStatistics: true
        },
        theme: 'light'
    });

    // Set uninstall URL for user feedback
    chrome.runtime.setUninstallURL('https://blizflow.online/cliptrack-uninstall-survey');
});

// Listen for keyboard commands
chrome.commands.onCommand.addListener((command) => {
    if (command === 'quick-paste-last') {
        quickPasteLast();
    } else if (command === 'toggle-favorite') {
        toggleLastFavorite();
    }
});

async function quickPasteLast() {
    const result = await chrome.storage.local.get(['clipboardHistory']);
    const history = result.clipboardHistory || [];
    if (history.length > 0) {
        await navigator.clipboard.writeText(history[0].text);
    }
}

async function toggleLastFavorite() {
    const result = await chrome.storage.local.get(['clipboardHistory', 'favorites']);
    const history = result.clipboardHistory || [];
    const favorites = result.favorites || [];

    if (history.length > 0) {
        const lastItem = history[0];
        const index = favorites.findIndex(f => f.id === lastItem.id);

        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(lastItem);
        }

        await chrome.storage.local.set({ favorites });
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'COPY_EVENT') {
        handleCopyEvent(message.data);
    } else if (message.type === 'PASTE_EVENT') {
        handlePasteEvent(message.data);
    } else if (message.type === 'CUT_EVENT') {
        handleCutEvent(message.data);
    } else if (message.type === 'GET_HISTORY') {
        getHistory().then(sendResponse);
        return true;
    } else if (message.type === 'CLEAR_HISTORY') {
        clearHistory().then(sendResponse);
        return true;
    } else if (message.type === 'DELETE_ITEM') {
        deleteItem(message.id).then(sendResponse);
        return true;
    } else if (message.type === 'COPY_TO_CLIPBOARD') {
        copyToClipboard(message.text).then(sendResponse);
        return true;
    } else if (message.type === 'TOGGLE_FAVORITE') {
        toggleFavorite(message.id).then(sendResponse);
        return true;
    } else if (message.type === 'GET_FAVORITES') {
        getFavorites().then(sendResponse);
        return true;
    } else if (message.type === 'ADD_TAG') {
        addTag(message.id, message.tag).then(sendResponse);
        return true;
    } else if (message.type === 'REMOVE_TAG') {
        removeTag(message.id, message.tag).then(sendResponse);
        return true;
    } else if (message.type === 'GET_STATISTICS') {
        getStatistics().then(sendResponse);
        return true;
    } else if (message.type === 'SAVE_TEMPLATE') {
        saveTemplate(message.template).then(sendResponse);
        return true;
    } else if (message.type === 'GET_TEMPLATES') {
        getTemplates().then(sendResponse);
        return true;
    } else if (message.type === 'DELETE_TEMPLATE') {
        deleteTemplate(message.id).then(sendResponse);
        return true;
    } else if (message.type === 'BULK_DELETE') {
        bulkDelete(message.ids).then(sendResponse);
        return true;
    } else if (message.type === 'BULK_TAG') {
        bulkTag(message.ids, message.tag).then(sendResponse);
        return true;
    }
});

async function handleCopyEvent(data) {
    try {
        const result = await chrome.storage.local.get(['clipboardHistory', 'settings', 'statistics']);
        const history = result.clipboardHistory || [];
        const settings = result.settings || {};
        const statistics = result.statistics || {};

        if (!settings.trackCopy) return;

        // Create history item
        const item = {
            id: generateId(),
            type: 'copy',
            text: data.text,
            url: data.url,
            title: data.title,
            timestamp: data.timestamp,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(data.url).hostname}`,
            tags: [],
            isFavorite: false,
            useCount: 0
        };

        // Check if duplicate (same text AND same type)
        const isDuplicate = history.some(h =>
            h.text === item.text &&
            h.type === item.type &&
            Math.abs(h.timestamp - item.timestamp) < 5000
        );

        if (!isDuplicate) {
            history.unshift(item);

            if (history.length > (settings.maxItems || MAX_HISTORY_ITEMS)) {
                history.pop();
            }

            // Update statistics
            statistics.totalCopies = (statistics.totalCopies || 0) + 1;
            updateSiteStats(statistics, data.url);
            updateDailyStats(statistics, 'copy');

            await chrome.storage.local.set({ clipboardHistory: history, statistics });
        }
    } catch (error) {
        console.error('Error handling copy event:', error);
    }
}

async function handlePasteEvent(data) {
    try {
        const result = await chrome.storage.local.get(['clipboardHistory', 'settings', 'statistics']);
        const history = result.clipboardHistory || [];
        const settings = result.settings || {};
        const statistics = result.statistics || {};

        if (!settings.trackPaste) return;

        const item = {
            id: generateId(),
            type: 'paste',
            text: data.text,
            url: data.url,
            title: data.title,
            timestamp: data.timestamp,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(data.url).hostname}`,
            tags: [],
            isFavorite: false,
            useCount: 0
        };

        // Check if duplicate (same text AND same type, within 5 seconds)
        const isDuplicate = history.some(h =>
            h.text === item.text &&
            h.type === item.type &&
            Math.abs(h.timestamp - item.timestamp) < 5000
        );

        if (!isDuplicate) {
            history.unshift(item);

            if (history.length > (settings.maxItems || MAX_HISTORY_ITEMS)) {
                history.pop();
            }

            // Update statistics
            statistics.totalPastes = (statistics.totalPastes || 0) + 1;
            updateSiteStats(statistics, data.url);
            updateDailyStats(statistics, 'paste');

            await chrome.storage.local.set({ clipboardHistory: history, statistics });
        }
    } catch (error) {
        console.error('Error handling paste event:', error);
    }
}

async function handleCutEvent(data) {
    try {
        const result = await chrome.storage.local.get(['clipboardHistory', 'settings', 'statistics']);
        const history = result.clipboardHistory || [];
        const settings = result.settings || {};
        const statistics = result.statistics || {};

        if (!settings.trackCopy) return;

        const item = {
            id: generateId(),
            type: 'cut',
            text: data.text,
            url: data.url,
            title: data.title,
            timestamp: data.timestamp,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(data.url).hostname}`,
            tags: [],
            isFavorite: false,
            useCount: 0
        };

        const isDuplicate = history.some(h =>
            h.text === item.text &&
            h.type === item.type &&
            Math.abs(h.timestamp - item.timestamp) < 5000
        );

        if (!isDuplicate) {
            history.unshift(item);

            if (history.length > (settings.maxItems || MAX_HISTORY_ITEMS)) {
                history.pop();
            }

            // Update statistics
            statistics.totalCuts = (statistics.totalCuts || 0) + 1;
            updateSiteStats(statistics, data.url);
            updateDailyStats(statistics, 'cut');

            await chrome.storage.local.set({ clipboardHistory: history, statistics });
        }
    } catch (error) {
        console.error('Error handling cut event:', error);
    }
}

function updateSiteStats(statistics, url) {
    try {
        const hostname = new URL(url).hostname;
        statistics.mostUsedSites = statistics.mostUsedSites || {};
        statistics.mostUsedSites[hostname] = (statistics.mostUsedSites[hostname] || 0) + 1;
    } catch (error) {
        console.error('Error updating site stats:', error);
    }
}

function updateDailyStats(statistics, type) {
    const today = new Date().toISOString().split('T')[0];
    statistics.dailyStats = statistics.dailyStats || {};
    statistics.dailyStats[today] = statistics.dailyStats[today] || { copy: 0, paste: 0, cut: 0 };
    statistics.dailyStats[today][type] = (statistics.dailyStats[today][type] || 0) + 1;
}

async function getHistory() {
    const result = await chrome.storage.local.get(['clipboardHistory']);
    return result.clipboardHistory || [];
}

async function clearHistory() {
    await chrome.storage.local.set({ clipboardHistory: [] });
    return { success: true };
}

async function deleteItem(id) {
    const result = await chrome.storage.local.get(['clipboardHistory']);
    const history = result.clipboardHistory || [];
    const filtered = history.filter(item => item.id !== id);
    await chrome.storage.local.set({ clipboardHistory: filtered });
    return { success: true };
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return { success: true };
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        return { success: false, error: error.message };
    }
}

async function toggleFavorite(id) {
    const result = await chrome.storage.local.get(['clipboardHistory', 'favorites']);
    const history = result.clipboardHistory || [];
    const favorites = result.favorites || [];

    const item = history.find(h => h.id === id);
    if (!item) return { success: false };

    const favIndex = favorites.findIndex(f => f.id === id);

    if (favIndex > -1) {
        favorites.splice(favIndex, 1);
        item.isFavorite = false;
    } else {
        favorites.push(item);
        item.isFavorite = true;
    }

    await chrome.storage.local.set({ favorites, clipboardHistory: history });
    return { success: true, isFavorite: item.isFavorite };
}

async function getFavorites() {
    const result = await chrome.storage.local.get(['favorites']);
    return result.favorites || [];
}

async function addTag(id, tag) {
    const result = await chrome.storage.local.get(['clipboardHistory', 'tags']);
    const history = result.clipboardHistory || [];
    const allTags = result.tags || [];

    const item = history.find(h => h.id === id);
    if (!item) return { success: false };

    item.tags = item.tags || [];
    if (!item.tags.includes(tag)) {
        item.tags.push(tag);
    }

    if (!allTags.includes(tag)) {
        allTags.push(tag);
    }

    await chrome.storage.local.set({ clipboardHistory: history, tags: allTags });
    return { success: true };
}

async function removeTag(id, tag) {
    const result = await chrome.storage.local.get(['clipboardHistory']);
    const history = result.clipboardHistory || [];

    const item = history.find(h => h.id === id);
    if (!item) return { success: false };

    item.tags = item.tags || [];
    item.tags = item.tags.filter(t => t !== tag);

    await chrome.storage.local.set({ clipboardHistory: history });
    return { success: true };
}

async function getStatistics() {
    const result = await chrome.storage.local.get(['statistics']);
    return result.statistics || {};
}

async function saveTemplate(template) {
    const result = await chrome.storage.local.get(['templates']);
    const templates = result.templates || [];

    const newTemplate = {
        id: generateId(),
        name: template.name,
        text: template.text,
        category: template.category || 'General',
        timestamp: Date.now()
    };

    templates.push(newTemplate);
    await chrome.storage.local.set({ templates });
    return { success: true, template: newTemplate };
}

async function getTemplates() {
    const result = await chrome.storage.local.get(['templates']);
    return result.templates || [];
}

async function deleteTemplate(id) {
    const result = await chrome.storage.local.get(['templates']);
    const templates = result.templates || [];
    const filtered = templates.filter(t => t.id !== id);
    await chrome.storage.local.set({ templates: filtered });
    return { success: true };
}

async function bulkDelete(ids) {
    const result = await chrome.storage.local.get(['clipboardHistory']);
    const history = result.clipboardHistory || [];
    const filtered = history.filter(item => !ids.includes(item.id));
    await chrome.storage.local.set({ clipboardHistory: filtered });
    return { success: true };
}

async function bulkTag(ids, tag) {
    const result = await chrome.storage.local.get(['clipboardHistory', 'tags']);
    const history = result.clipboardHistory || [];
    const allTags = result.tags || [];

    ids.forEach(id => {
        const item = history.find(h => h.id === id);
        if (item) {
            item.tags = item.tags || [];
            if (!item.tags.includes(tag)) {
                item.tags.push(tag);
            }
        }
    });

    if (!allTags.includes(tag)) {
        allTags.push(tag);
    }

    await chrome.storage.local.set({ clipboardHistory: history, tags: allTags });
    return { success: true };
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
