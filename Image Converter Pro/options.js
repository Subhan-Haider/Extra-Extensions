// Options page script for Image Converter Pro Extension

document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    loadSettings();
    
    // Save button
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Export/Import buttons
    document.getElementById('exportSettings').addEventListener('click', exportSettings);
    document.getElementById('importSettings').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    
    // Clear data button
    document.getElementById('clearData').addEventListener('click', clearAllData);
    
    // Create hidden file input for import
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.id = 'importFile';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.addEventListener('change', importSettings);
    document.body.appendChild(importInput);
});

async function loadSettings() {
    chrome.storage.local.get([
        'showNotifications',
        'showConversionComplete',
        'autoTheme',
        'defaultTheme',
        'askSaveLocation',
        'downloadFolder',
        'autoOptimize',
        'maxImageSize'
    ], (result) => {
        document.getElementById('showNotifications').checked = result.showNotifications !== false;
        document.getElementById('showConversionComplete').checked = result.showConversionComplete !== false;
        document.getElementById('autoTheme').checked = result.autoTheme !== false;
        document.getElementById('defaultTheme').value = result.defaultTheme || 'dark';
        document.getElementById('askSaveLocation').checked = result.askSaveLocation !== false;
        document.getElementById('downloadFolder').value = result.downloadFolder || '';
        document.getElementById('autoOptimize').checked = result.autoOptimize || false;
        document.getElementById('maxImageSize').value = result.maxImageSize || 50;
    });
}

async function saveSettings() {
    const settings = {
        showNotifications: document.getElementById('showNotifications').checked,
        showConversionComplete: document.getElementById('showConversionComplete').checked,
        autoTheme: document.getElementById('autoTheme').checked,
        defaultTheme: document.getElementById('defaultTheme').value,
        askSaveLocation: document.getElementById('askSaveLocation').checked,
        downloadFolder: document.getElementById('downloadFolder').value,
        autoOptimize: document.getElementById('autoOptimize').checked,
        maxImageSize: parseInt(document.getElementById('maxImageSize').value) || 50
    };
    
    await chrome.storage.local.set(settings);
    showStatus('Settings saved successfully!', 'success');
}

async function exportSettings() {
    const allData = await chrome.storage.local.get(null);
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-converter-pro-settings-${Date.now()}.json`;
    a.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showStatus('Settings exported!', 'success');
}

async function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            await chrome.storage.local.set(data);
            loadSettings();
            showStatus('Settings imported successfully!', 'success');
        } catch (error) {
            showStatus('Error importing settings: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

async function clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone!')) {
        return;
    }
    
    await chrome.storage.local.clear();
    loadSettings();
    showStatus('All data cleared!', 'success');
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    setTimeout(() => {
        status.className = 'status';
    }, 3000);
}

