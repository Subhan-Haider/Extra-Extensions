/**

 * Source by Subhan Haider
 * All rights reserved.  */

/* jshint browser:true, devel:true */
/* globals chrome, get_crx_url, get_zip_name, can_viewsource_crx_url, openCRXasZip */
/* globals encodeQueryString */
/* globals getPlatformInfoAsync */
'use strict';
var cws_url;
var crx_url;
var filename;

// See bg-contextmenu for potential values, at MENU_ID_ACTION_MENU.
var gActionClickAction = 'popup';

initialize();

function initialize() {
    var storageIsReady = false;

    getPlatformInfoAsync(function () {
        // Hack: although not guaranteed by the API, the getPlatformInfoAsync
        // call resolves ealier than the later tabs.query call, in practice.
        console.assert(!crx_url, 'getPlatformInfoAsync() should run first');
    });

    // Get CWS URL. On failure, close the popup
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        cws_url = tabs[0].url;
        // Note: Assuming getPlatformInfoAsync() to have resolved first.
        crx_url = get_crx_url(cws_url);
        filename = get_zip_name(crx_url);
        if (!can_viewsource_crx_url(crx_url)) {
            chrome.action.disable(tabs[0].id);
            window.close();
            return;
        }
        ready();
        if (storageIsReady) {
            ready2();
        }
    });
    chrome.storage.sync.get({
        actionClickAction: gActionClickAction,
    }, function (items) {
        gActionClickAction = items && items.actionClickAction || gActionClickAction;
        storageIsReady = true;
        if (crx_url) {
            ready2();
        }
    });
}

function ready() {
    document.getElementById('download').onclick = doDownload;
    document.getElementById('view-source').onclick = doViewSource;
    document.getElementById('open-github').onclick = doOpenGitHub;
    displayHistory();
}

function ready2() {
    if (gActionClickAction == 'popup') {
        // Default action is keeping this popup open.
        // Nothing else left to do.
    } else if (gActionClickAction == 'download') {
        doDownload();
    } else if (gActionClickAction == 'view-source') {
        doViewSource();
    }
}
var hasDownloadedOnce = false;
function doDownload() {
    if (hasDownloadedOnce) {
        console.log('Download is pending.');
        return;
    }
    openCRXasZip(crx_url, function (blob, publicKey) {
        tryTriggerDownload(blob, filename);
    }, function (errorMessage) {
        hasDownloadedOnce = false;
        document.getElementById('download').classList.toggle('downloading', hasDownloadedOnce);
        console.error(errorMessage);
        alert('Error in CodeLens Explorer:\n\n' + errorMessage);
    }, onXHRprogress.bind(null, document.getElementById('download')));
    hasDownloadedOnce = true;
    document.getElementById('download').classList.toggle('downloading', hasDownloadedOnce);
}
function doViewSource() {
    chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
    }, function (tabs) {
        saveToHistory(filename, crx_url, false);
        chrome.tabs.create({
            url: chrome.runtime.getURL('explorer.html') +
                '?' + encodeQueryString({ crx: crx_url, zipname: filename }),
            active: true,
            index: tabs && tabs.length ? tabs[0].index + 1 : undefined,
        }, function () {
            window.close();
        });
    });
}
function onXHRprogress(progressContainer, xhrProgressEvent) {
    var progressBar = progressContainer.querySelector('progress');
    if (!progressBar) {
        progressBar = document.createElement('progress');
        progressContainer.appendChild(progressBar);
    }
    if (xhrProgressEvent.lengthComputable) {
        progressBar.max = xhrProgressEvent.total;
        progressBar.value = xhrProgressEvent.loaded;
    } else {
        progressBar.removeAttribute('value');
    }
}

function tryTriggerDownload(blob, filename) {
    chrome.downloads.download({
        url: URL.createObjectURL(blob),
        filename: filename
    });
}


function doOpenGitHub() {
    chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
    }, function (tabs) {
        saveToHistory(filename, crx_url, false);
        chrome.tabs.create({
            url: chrome.runtime.getURL('explorer.html') +
                '?' + encodeQueryString({ crx: crx_url, zipname: filename, github: 1 }),
            active: true,
            index: tabs && tabs.length ? tabs[0].index + 1 : undefined,
        }, function () {
            window.close();
        });
    });
}

function saveToHistory(name, url, isAudit) {
    chrome.storage.local.get({ inspectionHistory: [] }, function (data) {
        let history = data.inspectionHistory;
        // Remove duplicate if exists
        history = history.filter(item => item.url !== url);
        // Add to front
        history.unshift({ name, url, time: Date.now() });
        // Keep last 5
        history = history.slice(0, 5);
        chrome.storage.local.set({ inspectionHistory: history });
    });
}

function displayHistory() {
    chrome.storage.local.get({ inspectionHistory: [] }, function (data) {
        const history = data.inspectionHistory;
        const container = document.getElementById('history-container');
        const list = document.getElementById('history-list');

        if (history.length > 0) {
            container.style.display = 'block';
            list.innerHTML = '';
            history.forEach(item => {
                const link = document.createElement('a');
                link.className = 'history-item';
                link.href = '#';

                // Clean up the display name if it's an extension ID
                let displayName = item.name;
                if (/^[a-p]{32}$/.test(displayName)) {
                    // It's a raw extension ID, make it prettier
                    displayName = 'Extension ' + displayName.substring(0, 8) + '...';
                }

                link.textContent = displayName.length > 25 ? displayName.substring(0, 22) + '...' : displayName;
                link.onclick = (e) => {
                    e.preventDefault();
                    chrome.tabs.create({
                        url: chrome.runtime.getURL('explorer.html') + '?' + encodeQueryString({ crx: item.url, zipname: get_zip_name(item.url) })
                    });
                };
                list.appendChild(link);
            });
        }
    });
}


