// Validation script to check if all required elements exist
const requiredElements = [
    // From popup.js setupEventListeners
    'searchInput',
    'clearSearchBtn',
    'clearAllBtn',
    'settingsBtn',
    'saveSettingsBtn',
    'settingsModal',

    // From popup.js renderHistory
    'historyList',
    'emptyState',
    'noResults',

    // From popup.js updateCounts
    'countAll',
    'countCopy',
    'countPaste',
    'countCut',
    'countFavorites',

    // From popup.js updateTotalItems
    'totalItems',

    // From popup.js loadSettings
    'trackCopyToggle',
    'trackPasteToggle',
    'maxItemsInput',

    // From popup-enhanced.js
    'exportBtn',
    'exportModal',
    'statsBtn',
    'statsModal',
    'templatesBtn',
    'templatesModal',
    'bulkSelectBtn',
    'bulkActionsBar',
    'bulkTagBtn',
    'bulkDeleteBtn',
    'cancelBulkBtn',
    'saveTemplateBtn',
    'selectedCount',
    'statisticsContent',
    'templatesList',
    'templateName',
    'templateText',
    'templateCategory'
];

console.log('=== ClipTrack Element Validation ===\n');

let missingElements = [];
let foundElements = [];

requiredElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        foundElements.push(id);
    } else {
        missingElements.push(id);
        console.error(`❌ MISSING: #${id}`);
    }
});

console.log(`\n✅ Found: ${foundElements.length}/${requiredElements.length} elements`);
console.log(`❌ Missing: ${missingElements.length} elements`);

if (missingElements.length > 0) {
    console.error('\nMissing elements:', missingElements);
} else {
    console.log('\n✅ All required elements found!');
}

// Check for close-modal buttons
const closeModalButtons = document.querySelectorAll('.close-modal');
console.log(`\n.close-modal buttons found: ${closeModalButtons.length}`);

// Check for modal elements
const modals = document.querySelectorAll('.modal');
console.log(`Modal elements found: ${modals.length}`);
