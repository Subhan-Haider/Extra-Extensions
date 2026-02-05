/**

 * Source by Subhan Haider
 * All rights reserved.  */

/* jshint browser:true, devel:true */
/* globals chrome, URL,
           getParam, encodeQueryString, openCRXasZip, get_zip_name, get_webstore_url, is_webstore_url, is_not_crx_url,
           get_extensionID, getPlatformInfo, getPlatformInfoAsync,
           get_crx_url, is_crx_download_url,
           get_amo_domain, get_amo_slug,
           get_equivalent_download_url,
           zip,
           EfficientTextWriter,
           beautify,
           Prism,
           SearchEngineElement,
           Uint8ArrayWriter, ModernCrypto,
           parseCertificate, parseMozCOSE,
           CryptoJS
           */

'use strict';

// crx_url is globally set to the URL of the shown file for ease of debugging.
// If there is no URL (e.g. with  <input type=file>), then crx_url is the file name.

// Integrate zip.js
zip.workerScriptsPath = 'lib/zip.js/';

// --- Theme Management ---
(function () {
    const theme = localStorage.getItem('codelens-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    window.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const sunIcon = toggleBtn.querySelector('.sun-icon');
            const moonIcon = toggleBtn.querySelector('.moon-icon');

            const updateIcons = (t) => {
                sunIcon.style.display = t === 'light' ? 'none' : 'block';
                moonIcon.style.display = t === 'light' ? 'block' : 'none';
            };

            updateIcons(theme);

            toggleBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('codelens-theme', next);
                updateIcons(next);
            });
        }
    });
})();
// --- End Theme ---

// --- Branding Management ---
(function () {
    function applyBranding() {
        const customName = localStorage.getItem('cl-custom-name');
        const customLogo = localStorage.getItem('cl-custom-logo');

        if (customName) {
            document.querySelector('.logo-text').textContent = customName;
            document.title = customName + ' - Extension Source Explorer';
        } else {
            document.querySelector('.logo-text').textContent = 'CodeLens';
            document.title = 'CodeLens - Extension Source Explorer';
        }

        if (customLogo) {
            document.querySelector('.logo-container img').src = customLogo;
        } else {
            document.querySelector('.logo-container img').src = 'icons/icon-128.png';
        }
    }

    const isAutoBrand = () => localStorage.getItem('cl-auto-brand') !== 'false';

    window.updateExtensionBranding = function (manifest, entries) {
        if (!isAutoBrand()) return;

        const name = manifest.name;
        if (name) {
            // Basic translation fallback if name is a placeholder
            const displayName = name.startsWith('__MSG_') ? 'Extension Explorer' : name;
            document.querySelector('.logo-text').textContent = displayName;
            document.title = displayName + ' - Source Explorer';
        }

        const icons = manifest.icons || (manifest.action && manifest.action.default_icon) || (manifest.browser_action && manifest.browser_action.default_icon);
        if (icons) {
            let iconPath = '';
            if (typeof icons === 'string') iconPath = icons;
            else {
                const sizes = Object.keys(icons).sort((a, b) => b - a);
                if (sizes.length > 0) iconPath = icons[sizes[0]];
            }

            if (iconPath) {
                const entry = entries.find(e => e.filename.endsWith(iconPath.replace(/^\//, '')));
                if (entry) {
                    entry.getData(new zip.Data64URIWriter(), function (dataUrl) {
                        document.querySelector('.logo-container img').src = dataUrl;
                    });
                }
            }
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        applyBranding();

        const toggleSidebarBtn = document.getElementById('toggle-sidebar');

        if (toggleSidebarBtn) {
            toggleSidebarBtn.onclick = () => {
                document.body.classList.toggle('sidebar-collapsed');
            };

            window.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'b') {
                    e.preventDefault();
                    toggleSidebarBtn.click();
                }
            });
        }
    });
})();
// --- End Branding ---

// --- GitHub Integration ---
(function () {
    window.addEventListener('DOMContentLoaded', () => {
        const ghConnectBtn = document.getElementById('github-connect-btn');
        const ghModal = document.getElementById('github-modal');
        const closeGhModal = document.getElementById('close-github-modal');
        const ghTokenInput = document.getElementById('gh-token-input');
        const ghSaveToken = document.getElementById('gh-save-token');
        const ghAuthSection = document.getElementById('github-auth-section');
        const ghProfileSection = document.getElementById('github-profile-section');
        const ghUserAvatar = document.getElementById('gh-user-avatar');
        const ghUserName = document.getElementById('gh-user-name');
        const ghUserLogin = document.getElementById('gh-user-login');
        const ghLogout = document.getElementById('gh-logout');
        const ghRepoInput = document.getElementById('gh-repo-name');
        const ghBranchInput = document.getElementById('gh-repo-branch');
        const ghExistingReposSelect = document.getElementById('gh-existing-repos');
        const ghModeNew = document.getElementById('gh-mode-new');
        const ghModeExisting = document.getElementById('gh-mode-existing');
        const ghNewContainer = document.getElementById('gh-new-repo-container');
        const ghExistingContainer = document.getElementById('gh-existing-repo-container');

        const ghUploadBtn = document.getElementById('gh-upload-btn');
        const ghStatus = document.getElementById('gh-status');

        const GITHUB_CLIENT_ID = 'Ov23lixkR7I3TZgysb5u';
        const ghLoginOAuth = document.getElementById('gh-login-oauth');
        const ghDeviceFlow = document.getElementById('gh-device-flow');
        const ghDeviceUrl = document.getElementById('gh-device-url');
        const ghDeviceCode = document.getElementById('gh-device-code');

        // Auto-open GitHub modal if requested via URL params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('github') === '1') {
            // Wait slightly for UI init
            setTimeout(() => {
                if (ghConnectBtn) ghConnectBtn.click();
            }, 500);
        }

        let currentRepoMode = 'new'; // 'new' or 'existing'

        if (ghModeNew && ghModeExisting) {
            ghModeNew.onclick = () => {
                currentRepoMode = 'new';
                ghModeNew.style.background = '#e91e63';
                ghModeNew.style.color = '#fff';
                ghModeExisting.style.background = 'transparent';
                ghModeExisting.style.color = 'var(--text-main)';
                ghNewContainer.classList.remove('hidden');
                ghExistingContainer.classList.add('hidden');
                if (ghUploadBtn) ghUploadBtn.textContent = 'Create Repo';
            };
            ghModeExisting.onclick = () => {
                currentRepoMode = 'existing';
                ghModeExisting.style.background = '#e91e63';
                ghModeExisting.style.color = '#fff';
                ghModeNew.style.background = 'transparent';
                ghModeNew.style.color = 'var(--text-main)';
                ghExistingContainer.classList.remove('hidden');
                ghNewContainer.classList.add('hidden');
                if (ghUploadBtn) ghUploadBtn.textContent = 'Push to Repo';

                chrome.storage.local.get(['gh-token'], (result) => {
                    if (result['gh-token']) fetchExistingRepos(result['gh-token']);
                });
            };
        }

        if (ghLoginOAuth) {
            ghLoginOAuth.onclick = async () => {
                ghLoginOAuth.disabled = true;
                ghLoginOAuth.textContent = '🔄 Contacting GitHub...';

                try {
                    const res = await fetch('https://github.com/login/device/code', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            client_id: GITHUB_CLIENT_ID,
                            scope: 'repo user'
                        })
                    });

                    if (!res.ok) throw new Error('Device code request failed');
                    const data = await res.json();

                    ghDeviceUrl.href = data.verification_uri;
                    ghDeviceCode.textContent = data.user_code;
                    ghDeviceFlow.classList.remove('hidden');
                    ghLoginOAuth.classList.add('hidden');

                    // Automatically open the device login page
                    if (typeof chrome !== 'undefined' && chrome.tabs) {
                        chrome.tabs.create({ url: data.verification_uri });
                    } else {
                        window.open(data.verification_uri, '_blank');
                    }

                    pollForToken(data.device_code, data.interval);

                } catch (e) {
                    alert(`Error: ${e.message}`);
                    ghLoginOAuth.disabled = false;
                    ghLoginOAuth.textContent = 'Easy Login with GitHub';
                }
            };
        }

        async function pollForToken(deviceCode, initialInterval) {
            let interval = (initialInterval || 5) * 1000;

            const poll = async () => {
                try {
                    const res = await fetch('https://github.com/login/oauth/access_token', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            client_id: GITHUB_CLIENT_ID,
                            device_code: deviceCode,
                            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                        })
                    });

                    const data = await res.json();

                    if (data.access_token) {
                        chrome.storage.local.set({ 'gh-token': data.access_token }, () => {
                            ghDeviceFlow.classList.add('hidden');
                            ghLoginOAuth.classList.remove('hidden');
                            ghLoginOAuth.disabled = false;
                            ghLoginOAuth.textContent = 'Connect with GitHub';
                            updateGhUI();
                        });
                        return; // Stop polling
                    }

                    if (data.error === 'authorization_pending') {
                        setTimeout(poll, interval);
                    } else if (data.error === 'slow_down') {
                        interval += 5000; // GitHub requires increasing by 5 seconds
                        setTimeout(poll, interval);
                    } else if (data.error === 'expired_token') {
                        alert('Log in session expired. Please try again.');
                        resetAuthUI();
                    } else if (data.error === 'access_denied') {
                        alert('Access was denied by the user.');
                        resetAuthUI();
                    } else {
                        alert(`Auth failed: ${data.error_description || data.error}`);
                        resetAuthUI();
                    }
                } catch (e) {
                    console.error('Polling error', e);
                    setTimeout(poll, interval);
                }
            };

            function resetAuthUI() {
                ghDeviceFlow.classList.add('hidden');
                ghLoginOAuth.classList.remove('hidden');
                ghLoginOAuth.disabled = false;
                ghLoginOAuth.textContent = 'Connect with GitHub';
            }

            setTimeout(poll, interval);
        }

        async function updateGhUI() {
            chrome.storage.local.get(['gh-token'], (result) => {
                const token = result['gh-token'];
                if (token) {
                    ghAuthSection.classList.add('hidden');
                    ghProfileSection.classList.remove('hidden');
                    fetchGhUser(token);
                    fetchExistingRepos(token);

                    if (ghConnectBtn) {
                        ghConnectBtn.classList.add('connected');
                    }

                    const rootName = document.getElementById('root-folder-name');
                    if (rootName && !ghRepoInput.value) {
                        ghRepoInput.value = rootName.textContent.toLowerCase().replace(/\s+/g, '-');
                    }
                } else {
                    ghAuthSection.classList.remove('hidden');
                    ghProfileSection.classList.add('hidden');
                    if (ghConnectBtn) {
                        ghConnectBtn.classList.remove('connected');
                        ghConnectBtn.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12" />
                            </svg>
                            <span>GitHub</span>
                        `;
                    }
                }
            });
        }

        async function fetchGhUser(token) {
            try {
                const res = await fetch('https://api.github.com/user', {
                    headers: { 'Authorization': `token ${token}` }
                });
                if (res.ok) {
                    const user = await res.json();
                    if (ghUserAvatar) ghUserAvatar.src = user.avatar_url;
                    if (ghUserName) ghUserName.textContent = user.name || user.login;
                    if (ghUserLogin) ghUserLogin.textContent = `@${user.login}`;
                    if (ghConnectBtn) {
                        ghConnectBtn.querySelector('span').textContent = user.login;
                        if (user.avatar_url) {
                            ghConnectBtn.innerHTML = `
                                <img src="${user.avatar_url}" style="width:16px; height:16px; border-radius:50%; object-fit:cover;">
                                <span>${user.login}</span>
                            `;
                        }
                    }
                } else {
                    chrome.storage.local.remove(['gh-token'], () => {
                        updateGhUI();
                    });
                }
            } catch (e) {
                console.error('GH fetch error', e);
            }
        }

        async function fetchExistingRepos(token) {
            if (!ghExistingReposSelect) return;
            try {
                const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
                    headers: { 'Authorization': `token ${token}` }
                });
                if (res.ok) {
                    const repos = await res.json();
                    const currentValue = ghExistingReposSelect.value;
                    ghExistingReposSelect.innerHTML = '<option value="" disabled selected>Select a repository...</option>';
                    repos.forEach(repo => {
                        const opt = document.createElement('option');
                        opt.value = repo.name;
                        opt.textContent = repo.full_name;
                        ghExistingReposSelect.appendChild(opt);
                    });
                    if (currentValue) ghExistingReposSelect.value = currentValue;
                }
            } catch (e) {
                console.error('Error fetching repos', e);
            }
        }

        if (ghConnectBtn) ghConnectBtn.onclick = () => {
            ghModal.classList.remove('hidden');
            updateGhUI();
            ghDeviceFlow.classList.add('hidden');
            ghLoginOAuth.classList.remove('hidden');
            ghLoginOAuth.disabled = false;
            ghLoginOAuth.textContent = 'Easy Login with GitHub';
        };

        if (closeGhModal) closeGhModal.onclick = () => {
            ghModal.classList.add('hidden');
            updateGhUI();
        };

        if (ghLogout) {
            ghLogout.onclick = () => {
                chrome.storage.local.remove(['gh-token'], () => {
                    ghAuthSection.classList.remove('hidden');
                    ghProfileSection.classList.add('hidden');
                    ghStatus.textContent = '';
                    updateGhUI();
                });
            };
        }

        if (ghUploadBtn) {
            ghUploadBtn.onclick = async () => {
                chrome.storage.local.get(['gh-token'], async (result) => {
                    const token = result['gh-token'];
                    if (!token) {
                        alert('Your session has expired. Please log in again.');
                        updateGhUI();
                        return;
                    }

                    let repo = '';
                    if (currentRepoMode === 'new') {
                        repo = ghRepoInput.value.trim();
                        if (!repo) return alert('Enter a name for the new repository');
                    } else {
                        repo = ghExistingReposSelect.value;
                        if (!repo) return alert('Please select an existing repository');
                    }

                    const branch = (ghBranchInput ? ghBranchInput.value.trim() : 'main') || 'main';

                    ghUploadBtn.disabled = true;
                    const originalBtnText = ghUploadBtn.innerHTML;
                    ghUploadBtn.innerHTML = '📦 Preparing...';
                    ghStatus.style.color = 'var(--text-dim)';

                    try {
                        const userRes = await fetch('https://api.github.com/user', {
                            headers: { 'Authorization': `token ${token}` }
                        });
                        if (!userRes.ok) throw new Error('GitHub session invalidated');
                        const user = await userRes.json();
                        const owner = user.login;

                        ghStatus.textContent = `Syncing to: ${owner}/${repo} (${branch})`;
                        let repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                            headers: { 'Authorization': `token ${token}` }
                        });

                        if (repoRes.status === 404) {
                            ghStatus.textContent = 'Auto-creating repository...';
                            repoRes = await fetch('https://api.github.com/user/repos', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `token ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    name: repo,
                                    auto_init: true,
                                    description: 'Source code exported via CodeLens Extension Explorer'
                                })
                            });
                        }

                        if (!repoRes.ok) throw new Error('Could not access or create repository');

                        const entries = (window.lastZipEntries || []).filter(e => !e.directory);
                        if (!entries.length) throw new Error('Open an extension first to upload its source');

                        ghStatus.textContent = '🚀 Turbo Sync V2: Initializing...';
                        const total = entries.length;
                        let uploaded = 0;
                        const CONCURRENCY = 16; // Increased from 8 to 16 for aggressive syncing (Chrome usually allows ~6-10 per domain active, but queueing helps)
                        const isNewRepo = (repoRes.status === 201); // 201 Created

                        // Helper for parallel processing
                        const processFile = async (entry) => {
                            try {
                                const content = await new Promise((resolve) => {
                                    entry.getData(new Uint8ArrayWriter(), resolve);
                                });

                                let binary = "";
                                const chunk = 8192;
                                for (let i = 0; i < content.length; i += chunk) {
                                    binary += String.fromCharCode.apply(null, content.slice(i, i + chunk));
                                }
                                const b64 = btoa(binary);

                                let sha = '';
                                // CRITICAL PERFORMANCE FIX: 
                                // Only check for existing file SHA if the repo is NOT new and we didn't just create it.
                                // Reducing 1 extra API call per file speeds up syncing by ~50%.
                                if (!isNewRepo) {
                                    try {
                                        const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${entry.filename}`, {
                                            headers: { 'Authorization': `token ${token}` }
                                        });
                                        if (fileRes.ok) {
                                            const fileData = await fileRes.json();
                                            sha = fileData.sha;
                                        }
                                    } catch (ign) { }
                                }

                                const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${entry.filename}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': `token ${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        message: `Turbo Sync: ${entry.filename} updated`,
                                        content: b64,
                                        sha: sha ? sha : undefined
                                    })
                                });

                                if (!putRes.ok) {
                                    const err = await putRes.json();
                                    console.warn(`Failed ${entry.filename}: ${err.message}`);
                                }

                                uploaded++;
                                ghStatus.textContent = `⚡ Syncing: ${uploaded}/${total} files...`;
                            } catch (e) {
                                console.error(`Error in ${entry.filename}`, e);
                            }
                        };

                        // Run in parallel chunks
                        for (let i = 0; i < entries.length; i += CONCURRENCY) {
                            const chunkEntries = entries.slice(i, i + CONCURRENCY);
                            await Promise.all(chunkEntries.map(e => processFile(e)));
                        }

                        ghStatus.textContent = '🎉 Turbo Sync Complete! Source is live.';
                        ghStatus.style.color = 'var(--accent-green)';
                        ghUploadBtn.innerHTML = originalBtnText;
                        ghUploadBtn.disabled = false;

                    } catch (e) {
                        console.error(e);
                        ghStatus.textContent = `❌ Error: ${e.message}`;
                        ghStatus.style.color = 'var(--accent-red)';
                        ghUploadBtn.innerHTML = originalBtnText;
                        ghUploadBtn.disabled = false;
                        if (e.message.toLowerCase().includes('session')) {
                            chrome.storage.local.remove(['gh-token'], () => updateGhUI());
                        }
                    }
                });
            };
        }

        // Detect Esc to close
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !ghModal.classList.contains('hidden')) {
                ghModal.classList.add('hidden');
                updateGhUI();
            }
        });

        updateGhUI();
    });
})();

// --- Dashboard Logic ---
(function () {
    window.populateDashboard = function (manifest, entries) {
        document.getElementById('dash-file-count').textContent = entries.length;
        document.getElementById('dash-mv').textContent = 'V' + (manifest.manifest_version || '?');

        let totalBytes = entries.reduce((acc, e) => acc + (e.uncompressedSize || 0), 0);
        document.getElementById('dash-size').textContent = formatByteSizeSuffix(totalBytes);

        const permList = document.getElementById('dash-permissions-list');
        permList.innerHTML = '';
        const permissions = (manifest.permissions || []).concat(manifest.host_permissions || []);
        const highRisk = ['tabs', 'history', 'cookies', 'webRequest', 'webRequestBlocking', 'debugger', 'proxy'];

        permissions.forEach(p => {
            const chip = document.createElement('span');
            chip.className = 'p-chip' + (highRisk.includes(p) ? ' high-risk' : '');
            chip.textContent = typeof p === 'string' ? p : JSON.stringify(p);
            permList.appendChild(chip);
        });

        const entriesDiv = document.getElementById('dash-entry-points');
        entriesDiv.innerHTML = '';
        const entryFiles = [];
        if (manifest.background) {
            if (manifest.background.scripts) entryFiles.push(...manifest.background.scripts);
            if (manifest.background.service_worker) entryFiles.push(manifest.background.service_worker);
        }
        if (manifest.content_scripts) {
            manifest.content_scripts.forEach(cs => {
                if (cs.js) entryFiles.push(...cs.js);
            });
        }

        [...new Set(entryFiles)].slice(0, 5).forEach(file => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            item.innerHTML = `<span>⚙️</span> ${file}`;
            item.onclick = () => {
                const cleanName = file.replace(/^\//, '');
                const li = document.querySelector(`li[data-filename="${cleanName}"]`);
                if (li) li.click();
            };
            item.style.cursor = 'pointer';
            entriesDiv.appendChild(item);
        });

        // Security Audit
        const alertsDiv = document.getElementById('dash-security-alerts');
        if (alertsDiv) {
            alertsDiv.innerHTML = '';
            const alerts = [];

            if (manifest.manifest_version < 3) {
                alerts.push({ text: 'Legacy Manifest V2 detected', type: 'warning' });
            }
            if (permissions.includes('<all_urls>') || permissions.includes('*://*/*')) {
                alerts.push({ text: 'Broad host permissions (Full Web Access)', type: 'critical' });
            }
            if (permissions.includes('webRequest') && permissions.includes('webRequestBlocking')) {
                alerts.push({ text: 'Network interception capability (Blocking WebRequest)', type: 'warning' });
            }

            // Quick scan of manifest for suspicious keys
            const manifestStr = JSON.stringify(manifest).toLowerCase();
            if (manifestStr.includes('externally_connectable')) alerts.push({ text: 'Externally connectable (Other sites can message this extension)', type: 'warning' });

            if (alerts.length === 0) {
                alertsDiv.innerHTML = '<div class="alert-item">✅ No critical manifest risks found.</div>';
            } else {
                alerts.forEach(a => {
                    const div = document.createElement('div');
                    div.className = 'alert-item' + (a.type === 'critical' ? ' critical' : '');
                    div.innerHTML = `<span>${a.type === 'critical' ? '🔴' : '⚠️'}</span> ${a.text}`;
                    alertsDiv.appendChild(div);
                });
            }
        }

        const welcomeAppName = document.getElementById('welcome-app-name');
        if (welcomeAppName) {
            welcomeAppName.textContent = document.querySelector('.logo-text').textContent;
        }

        document.getElementById('initial-status').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
    };
})();
// --- End Dashboard ---

function formatByteSize(fileSize) {
    // Assume parameter fileSize to be a number
    fileSize = (fileSize + '').replace(/\d(?=(\d{3})+(?!\d))/g, '$&,');
    return fileSize;
}
function formatByteSizeSuffix(fileSize) {
    if (fileSize < 1e4)
        return fileSize + ' B';
    if (fileSize < 1e6)
        return Math.round(fileSize / 1e3) + ' KB';
    if (fileSize < 1e9)
        return Math.round(fileSize / 1e6) + ' MB';
    // Which fool stores over 1 GB of data in a Chrome extension???
    return Math.round(fileSize / 1e9) + ' GB';
}
function handleZipEntries(entries) {
    window.lastZipEntries = entries;
    const fileList = document.getElementById('file-list');
    fileList.textContent = '';
    const genericTypeCounts = {};

    // Build the folder tree structure
    const tree = { name: 'root', type: 'folder', children: {}, path: '' };

    entries.forEach(entry => {
        if (entry.directory) return;
        const parts = entry.filename.split('/');
        let current = tree;

        parts.forEach((part, i) => {
            const isLast = i === parts.length - 1;
            const path = parts.slice(0, i + 1).join('/');

            if (isLast) {
                current.children[part] = { name: part, type: 'file', entry: entry, path: path };
                const gtype = getGenericType(entry.filename);
                if (gtype) genericTypeCounts[gtype] = (genericTypeCounts[gtype] || 0) + 1;
            } else {
                if (!current.children[part]) {
                    current.children[part] = { name: part, type: 'folder', children: {}, path: path };
                }
                current = current.children[part];
            }
        });
    });

    const CHEVRON_SVG = `<div class="chevron"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></div>`;
    const FOLDER_SVG = `<div class="file-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></div>`;

    function renderTree(node, container, depth = 0) {
        const sortedKeys = Object.keys(node.children).sort((a, b) => {
            const nodeA = node.children[a];
            const nodeB = node.children[b];
            if (nodeA.type !== nodeB.type) return nodeA.type === 'folder' ? -1 : 1;
            return nodeA.name.localeCompare(nodeB.name);
        });

        sortedKeys.forEach(key => {
            const item = node.children[key];
            const li = document.createElement('li');
            li.className = `tree-item ${item.type}-item`;
            li.style.paddingLeft = `${depth * 12 + 8}px`;
            li.dataset.filename = item.path;
            if (item.type === 'file') {
                li.zipEntry = item.entry;
            }

            if (item.type === 'folder') {
                li.innerHTML = `${CHEVRON_SVG}${FOLDER_SVG}<span class="file-name">${item.name}</span>`;
                const childContainer = document.createElement('ul');
                childContainer.className = 'folder-children hidden';

                li.onclick = (e) => {
                    e.stopPropagation();
                    const isCollapsed = childContainer.classList.toggle('hidden');
                    li.classList.toggle('folder-open', !isCollapsed);
                };

                container.appendChild(li);
                container.appendChild(childContainer);
                renderTree(item, childContainer, depth + 1);
            } else {
                li.innerHTML = `
                    <div class="chevron"></div>
                    <div class="file-icon">${getFileIcon(item.name)}</div>
                    <span class="file-name">${item.name}</span>
                    <span class="file-size">${formatByteSizeSuffix(item.entry.uncompressedSize)}</span>
                `;
                li.onclick = (e) => {
                    e.stopPropagation();
                    const prevSelection = document.querySelector('.file-selected');
                    if (prevSelection) prevSelection.classList.remove('file-selected');
                    li.classList.add('file-selected');
                    viewFileInfo(item.entry);
                };

                const gtype = getGenericType(item.entry.filename);
                if (gtype) li.classList.add('gtype-' + gtype);
                container.appendChild(li);
            }
        });
    }

    renderTree(tree, fileList);

    // Sidebar Actions
    const collapseBtn = document.getElementById('collapse-all');
    if (collapseBtn) collapseBtn.onclick = () => {
        fileList.querySelectorAll('.folder-open').forEach(f => f.click());
    };
    const refreshBtn = document.getElementById('refresh-tree');
    if (refreshBtn) refreshBtn.onclick = () => location.reload();

    // Automatic Source Attribution for Zip Downloads
    const dlLink = document.getElementById('download-link');
    if (dlLink) {
        dlLink.onclick = function (e) {
            e.preventDefault();
            const originalText = dlLink.textContent;
            dlLink.textContent = '🔒 Adding Attribution...';
            dlLink.style.pointerEvents = 'none';
            dlLink.style.opacity = '0.7';

            zip.createWriter(new zip.BlobWriter('application/zip'), function (writer) {
                var index = 0;
                function addNext() {
                    if (index >= entries.length) {
                        writer.close(function (newBlob) {
                            var url = URL.createObjectURL(newBlob);
                            var a = document.createElement('a');
                            a.href = url;
                            a.download = dlLink.download || 'extension_source.zip';
                            a.click();
                            dlLink.textContent = originalText;
                            dlLink.style.pointerEvents = 'auto';
                            dlLink.style.opacity = '1';
                        });
                        return;
                    }
                    var entry = entries[index++];
                    if (entry.directory) {
                        writer.add(entry.filename, null, addNext, null, { directory: true });
                    } else {
                        var mimeType = getMimeTypeForFilename(entry.filename);
                        var isText = /^(text\/|application\/(javascript|json|xml|x-httpd-php))/.test(mimeType) ||
                            /\.(js|css|html|json|md|txt)$/i.test(entry.filename);
                        if (isText) {
                            entry.getData(new EfficientTextWriter(), function (text) {
                                var attribution = "/**\n * Source by Subhan Haider\n * All rights reserved.\n */\n\n";
                                if (/\.html?$/i.test(entry.filename)) {
                                    attribution = "<!--\n Source by Subhan Haider\n All rights reserved.\n -->\n\n";
                                } else if (/\.(css|json|md|txt)$/i.test(entry.filename)) {
                                    attribution = "/*\n * Source by Subhan Haider\n * All rights reserved.\n */\n\n";
                                }
                                writer.add(entry.filename, new zip.TextReader(attribution + text), addNext);
                            });
                        } else {
                            entry.getData(new zip.BlobWriter(mimeType), function (blob) {
                                writer.add(entry.filename, new zip.BlobReader(blob), addNext);
                            });
                        }
                    }
                }
                addNext();
            }, function (err) {
                console.error("Zip attribution failed", err);
                dlLink.textContent = originalText;
                dlLink.style.pointerEvents = 'auto';
                dlLink.style.opacity = '1';
                const fallbackUrl = dlLink.getAttribute('data-original-href');
                if (fallbackUrl) {
                    const a = document.createElement('a');
                    a.href = fallbackUrl;
                    a.download = dlLink.download;
                    a.click();
                }
            });
        };
    }

    // Auto-expand root level for a better first impression
    const rootItems = fileList.querySelectorAll(':scope > .folder-item');
    rootItems.forEach(item => item.click());

    checkAndApplyFilter();

    // Automatic Extension Branding
    const manifestEntry = entries.find(e => e.filename.toLowerCase() === 'manifest.json');
    if (manifestEntry) {
        manifestEntry.getData(new EfficientTextWriter(), function (text) {
            try {
                const manifest = parseManifest(text);
                const name = manifest.name || 'Extension';
                const rootName = document.getElementById('root-folder-name');
                if (rootName) rootName.textContent = name.startsWith('__MSG_') ? 'Extension' : name;

                if (window.updateExtensionBranding) {
                    window.updateExtensionBranding(manifest, entries);
                }
                if (window.populateDashboard) {
                    window.populateDashboard(manifest, entries);
                }
                if (window.indexFilesForCommandPalette) {
                    window.indexFilesForCommandPalette(entries);
                }
                if (window.updateRecentHistory) {
                    window.updateRecentHistory(manifest, entries);
                }
            } catch (e) { console.warn("Auto-branding failed", e); }
        });
    }

    // Render number of files of the following generic types:
    Object.keys(genericTypeCounts).forEach(function (genericType) {
        var checkbox = document.querySelector('input[data-filter-type="' + genericType + '"]');
        if (checkbox) {
            var label = checkbox.parentNode;
            var counter = label.querySelector('.gcount');
            counter.textContent = genericTypeCounts[genericType];
        }
    });

    renderInitialViewFromUrlParams();
}
function getGenericType(filename) {
    // Chromium / generic / WebExtensions
    if (filename === 'manifest.json') {
        // No generic type = Don't offer any checkbox to hide it.
        return '';
    }
    var extension = filename.split('.').pop().toLowerCase();
    if (/^(jsx?|tsx?|wat|coffee)$/.test(extension)) {
        return 'code';
    }
    if (/^(bmp|cur|gif|ico|jpe?g|png|psd|svg|tiff?|xcf|webp)$/.test(extension)) {
        return 'images';
    }
    if (/^(css|sass|less|html?|xhtml|xml)$/.test(extension)) {
        return 'markup';
    }
    if (filename.lastIndexOf('_locales/', 0) === 0) {
        return 'locales';
    }

    // Firefox add-on specific.
    // Note: package.json is not just used for Jetpack but also npm and such.
    if (filename === 'chrome.manifest' || filename === 'install.rdf' || filename === 'package.json') {
        return '';
    }
    if (/^jsm$/.test(extension)) {
        return 'code';
    }
    if (/^(xbl|xul)$/.test(extension)) {
        return 'markup';
    }
    if (/locale\/.*\.(dtd|properties)$/i.test(filename)) {
        return 'locales';
    }

    return 'misc';
}

function getFileIcon(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    var color = 'var(--text-dim)';
    var path = 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z'; // default doc

    if (/^(jsx?|jsm)$/.test(ext)) {
        color = '#f7df1e'; // JS Yellow
        return `<svg width="14" height="14" viewBox="0 0 32 32" style="flex-shrink:0"><path d="M0 0h32v32H0V0z" fill="#f7df1e"/><path d="M18.7 18.6h2.8c.1 1.6 1.4 2.8 3.1 2.8 1.7 0 2.9-1.2 2.9-2.8 0-1.2-.8-2.3-2-2.7l-.9-.3c-2.4-.7-3.9-2.1-3.9-4.8 0-3 2.1-5.1 5.3-5.1 3.2 0 5.4 2.1 5.4 5.3h-2.9c-.1-1.6-1.3-2.6-2.5-2.6-1.5 0-2.5 1-2.5 2.5 0 1.2.8 2.1 2 2.5l.9.3c2.4.7 3.9 2.1 3.9 4.8 0 3.2-2.3 5.4-5.6 5.4-3.5-.1-5.7-2.1-5.8-5.7zM7.2 27.2v-3.2h3.2v3.2H7.2zM7.1 24.3V7.7h3.3v16.6H7.1z" fill="#000"/></svg>`;
    }
    if (/^(tsx?)$/.test(ext)) {
        color = '#3178c6'; // TS Blue
        return `<svg width="14" height="14" viewBox="0 0 32 32" style="flex-shrink:0"><path d="M0 0h32v32H0V0z" fill="#3178c6"/><path d="M21 18.5V24h3v-5.5H29v-3h-5V10h-3v5.5h-5v3h5zM5 10v3h5v11h3V13h5v-3H5z" fill="#fff"/></svg>`;
    }
    if (/^(html?|xhtml|xml)$/.test(ext)) {
        color = '#e34f26';
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e34f26" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
    }
    if (/^(css|sass|less)$/.test(ext)) {
        color = '#264de4';
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#264de4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M6 9l6 0M6 15l6 0M18 9l-6 0M18 15l-6 0M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"></path></svg>`;
    }
    if (/^(json)$/.test(ext)) {
        color = '#cbcb41';
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbcb41" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"></path><path d="M9 12h.01M15 12h.01M12 12h.01"></path></svg>`;
    }
    if (/^(bmp|cur|gif|ico|jpe?g|png|webp|svg)$/.test(ext)) {
        color = '#a074c4';
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a074c4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    }
    if (/^(md|txt)$/.test(ext)) {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>`;
    }

    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
}

function getMimeTypeForFilename(filename) {
    if (/^META-INF\/.*\.[ms]f$/.test(filename)) {
        // .sf and .mf are part of the signature in Firefox addons.
        // They are viewable as plain text.
        return 'text/plain';
    }
    if (/(^|\/)(AUTHORS|CHANGELOG|COPYING|INSTALL|LICENSE|NEWS|README|THANKS)$/i.test(filename)) {
        return 'text/plain';
    }
    var extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'crx':
        case 'nex':
        case 'xpi':
            // Just map them to zip files because we treat it as a zip file, internally.
            return 'application/zip';
        case 'md':
            return 'text/plain';
    }
    return zip.getMimeType(filename);
}

var viewFileInfo = (function () {
    var _currentEntry = null;
    var handlers = {};
    var wantRawSourceGlobalDefault = false;

    // To increase performance, intermediate results are cached
    // _cachedResult = extracted content
    // _cachedCallback = If existent, a function which renders the (cached) result.
    // Additional members:
    // _initialViewParams = If set, will be used the first time that the entry is rendered.
    function viewFileInfo(entry) {
        function onReturnEarly() {
            // Clear parameters when the user switches elsewhere,
            // or when the parameters are used.
            delete entry._initialViewParams;
        }
        if (_currentEntry === entry) {
            onReturnEarly();
            return;
        }
        if (_currentEntry) {
            document.getElementById('source-code').dispatchEvent(new CustomEvent('sourceviewhide'));
        }
        _currentEntry = entry;
        var sourceToolbarElem = document.getElementById('source-toolbar');
        sourceToolbarElem.textContent = '';

        var pathIndicator = document.createElement('span');
        pathIndicator.id = 'current-file-path';
        pathIndicator.textContent = entry.filename;
        sourceToolbarElem.appendChild(pathIndicator);

        var spacer = document.createElement('div');
        spacer.style.flex = '1';
        sourceToolbarElem.appendChild(spacer);

        var sourceCodeElem = document.getElementById('source-code');
        if (entry._cachedResult) {
            saveScroll();
            // willSwitchSourceView() would clear the toolbar we just set up,
            // so we manually do the rest of what it does.
            sourceCodeElem.dispatchEvent(new CustomEvent('sourceviewhide'));
            sourceCodeElem.textContent = '';

            if (entry._cachedCallback && entry._cachedCallback() !== false) {
                restoreScroll(entry.filename);
                return onReturnEarly();
            }
        }

        var mimeType = getMimeTypeForFilename(entry.filename);
        var mt = mimeType.split('/');

        var handler = handlers[mimeType] || handlers[mt[0]];
        if (!handler) {
            switch (getGenericType(entry.filename)) {
                case 'code':
                case 'markup':
                case 'locales':
                    handler = handlers.text;
                    break;
                case 'images':
                    handler = handlers.image;
                    break;
            }
        }

        if (!handler) {
            if (!confirm('No handler for ' + mimeType + ' :(\nWant to open as plain text?'))
                return onReturnEarly();
            mimeType = 'text/plain';
            handler = handlers.text;
        }
        var callback = handler.callback;

        if (entry._cachedResult) {
            saveScroll();
            willSwitchSourceView();
            callback(entry, entry._cachedResult);
            restoreScroll(entry.filename);
            return onReturnEarly();
        }

        var Writer = handler.Writer;
        var writer;
        if (Writer === zip.Data64URIWriter ||
            Writer === zip.BlobWriter) {
            writer = new Writer(mimeType);
        } else {
            writer = new Writer();
        }

        entry.getData(writer, function (result) {
            entry._cachedResult = result;
            if (_currentEntry !== entry) {
                console.log('Finished reading file, but another file was opened!');
                return onReturnEarly();
            }
            saveScroll();
            willSwitchSourceView();
            callback(entry, result, function finalCallback(callbackResult) {
                if (callbackResult && typeof callbackResult !== 'function') {
                    throw new Error('callbackResult exists and is not a function!');
                }
                entry._cachedCallback = function () {
                    saveScroll();
                    if (callbackResult) {
                        willSwitchSourceView();
                        onReturnEarly();
                        callbackResult();
                    }
                    restoreScroll(entry.filename);
                    return typeof callbackResult == 'function';
                };
                // Final callback = thing has been rendered for the first time,
                // or something like that.
                restoreScroll(entry.filename);
            });
        }, function (current, total) {
            // Progress, todo
        });
    }
    handlers['application/vnd.mozilla.xul+xml'] =
        handlers['application/javascript'] =
        handlers['application/json'] =
        handlers['application/rdf+xml'] =
        handlers['application/xhtml+xml'] =
        handlers['application/xml-dtd'] =
        handlers.text = {
            Writer: EfficientTextWriter,
            callback: function (entry, text, finalCallback) {
                var sourceToolbarElem = document.getElementById('source-toolbar');
                var sourceCodeElem = document.getElementById('source-code');

                // Path Breadcrumbs
                var breadcrumbs = document.createElement('div');
                breadcrumbs.className = 'path-breadcrumbs';
                var pathParts = entry.filename.split('/');
                pathParts.forEach((part, i) => {
                    var span = document.createElement('span');
                    span.className = 'breadcrumb-part';
                    span.textContent = part;
                    breadcrumbs.appendChild(span);
                    if (i < pathParts.length - 1) {
                        var sep = document.createElement('span');
                        sep.className = 'breadcrumb-sep';
                        sep.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
                        breadcrumbs.appendChild(sep);
                    }
                });
                sourceToolbarElem.innerHTML = '';
                sourceToolbarElem.appendChild(breadcrumbs);

                var preRaw = document.createElement('pre');
                var preBeauty = document.createElement('pre');
                var preCurrent; // The currently selected <pre>.

                var heading = document.createElement('div');
                heading.className = 'file-specific-toolbar';

                heading.appendChild(createDownloadLink(entry));
                heading.appendChild(createContentVerifier(entry));

                var copyPathButton = document.createElement('button');
                copyPathButton.className = 'btn-action btn-secondary';
                copyPathButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy Path';
                copyPathButton.onclick = function () {
                    navigator.clipboard.writeText(entry.filename).then(function () {
                        var originalText = copyPathButton.innerHTML;
                        copyPathButton.innerHTML = 'Path Copied!';
                        setTimeout(function () {
                            copyPathButton.innerHTML = originalText;
                        }, 2000);
                    });
                };
                heading.appendChild(copyPathButton);

                var goToLineButton = document.createElement('button');
                goToLineButton.className = 'btn-action btn-secondary';
                goToLineButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>Go to line';
                goToLineButton.onclick = function () {
                    showGoToLine(sourceCodeElem, preCurrent);
                };
                heading.appendChild(goToLineButton);

                var copyButton = document.createElement('button');
                copyButton.className = 'btn-action btn-secondary';
                copyButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>Copy Code';
                copyButton.onclick = function () {
                    navigator.clipboard.writeText(text).then(function () {
                        var originalText = copyButton.innerHTML;
                        copyButton.innerHTML = 'Copied!';
                        copyButton.classList.add('copy-success');
                        setTimeout(function () {
                            copyButton.innerHTML = originalText;
                            copyButton.classList.remove('copy-success');
                        }, 2000);
                    });
                };
                heading.appendChild(copyButton);

                var toggleBeautify = document.createElement('button');
                toggleBeautify.className = 'btn-action btn-info';
                var selectPre = function (pre) {
                    preCurrent = pre;
                    if (pre === preRaw) {
                        toggleBeautify.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>Beautify Code';
                        toggleBeautify.classList.remove('was-beautify-enabled');
                    } else {
                        toggleBeautify.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"></path></svg>Show Raw';
                        toggleBeautify.classList.add('was-beautify-enabled');
                    }
                    if (pre._didInitializeSourceViewer) return;
                    pre._didInitializeSourceViewer = true;
                    if (pre === preRaw) {
                        viewTextSource(text, entry.filename, preRaw, onPreRendered);
                        return;
                    }
                    beautify({
                        text: text,
                        type: beautify.getType(entry.filename),
                        wrap: 0
                    }, function (text) {
                        textBeauty = text;
                        viewTextSource(text, entry.filename, preBeauty, onPreRendered);
                    });
                };
                heading.appendChild(toggleBeautify);

                heading.insertAdjacentHTML('beforeend',
                    '<button class="btn-action btn-secondary find-prev" title="Find previous (Up)">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>' +
                    '</button>' +
                    '<button class="btn-action btn-secondary find-next" title="Find next (Down)">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
                    '</button>' +
                    '<button class="btn-action btn-secondary find-all" title="Highlight all occurrences">' +
                    '<span class="find-all-indicator">H</span>' +
                    '</button>' +
                    '<span class="find-status"></span>'
                );

                var textBeauty;
                var searchEngine;
                var shouldHighlightAll = false;
                heading.querySelector('.find-prev').onclick = function () {
                    searchEngine.setQuery(textSearchEngine.getCurrentSearchTerm());
                    searchEngine.findPrev();
                    showFindStatus(true);
                };
                heading.querySelector('.find-next').onclick = function () {
                    searchEngine.setQuery(textSearchEngine.getCurrentSearchTerm());
                    searchEngine.findNext();
                    showFindStatus(true);
                };
                heading.querySelector('.find-all').onclick = function () {
                    shouldHighlightAll = !shouldHighlightAll;
                    this.firstChild.classList.toggle('find-all-enabled', shouldHighlightAll);
                    if (shouldHighlightAll) {
                        searchEngine.setQuery(textSearchEngine.getCurrentSearchTerm());
                        searchEngine.highlightAll();
                        showFindStatus(true);
                    } else {
                        searchEngine.unhighlightAll();
                        searchEngine.hideCurrentResult();
                        hideFindStatus();
                    }
                };
                function hideFindStatus() {
                    var statusElem = heading.querySelector('.find-status');
                    statusElem.style.cursor = '';
                    statusElem.textContent = statusElem.title = '';
                }
                function showFindStatus(isUserGesture) {
                    var statusElem = heading.querySelector('.find-status');
                    var status = searchEngine.getQueryStatus();
                    if (!status.hasQuery) {
                        if (!isUserGesture && !statusElem.textContent.startsWith('???')) {
                            hideFindStatus();
                            return;
                        }
                        // If the user keeps clicking, switch between the two.
                        // Hopefully this draws enough attention so they haver over
                        // the text and see the detailed tips.
                        statusElem.textContent =
                            statusElem.textContent === '???' ? '???!' : '???';
                        statusElem.style.cursor = 'help';
                        statusElem.title =
                            'Go to the search box in the upper-left corner ' +
                            'and start a search by typing:\n' +
                            ' !(search term here)\n' +
                            'Then search results will be highlighted if the H option was selected,\n' +
                            'and the triangle buttons can be used to jump to the next/previous result.';
                        return;
                    }
                    statusElem.style.cursor = '';
                    if (!status.resultTotal) {
                        statusElem.textContent = '0';
                        statusElem.title = 'No results found';
                        return;
                    }
                    // If there are many results, then not the total count is
                    // returned. In that case, we know that the total number is
                    // the minimum number of results, so add a visual indicator.
                    var totalShortStr =
                        status.resultTotal + (status.isTotalDefinite ? '' : '+');
                    var totalLongStr =
                        (status.isTotalDefinite ? '' : 'at least ') +
                        status.resultTotal + ' occurrence' +
                        (status.resultTotal === 1 ? '' : 's');
                    if (status.resultIndex === -1) {
                        statusElem.textContent = totalShortStr;
                        statusElem.title = 'Found ' + totalLongStr;
                        return;
                    }
                    var resultIndexOneBased = status.resultIndex + 1;
                    statusElem.textContent = resultIndexOneBased + '/' + totalShortStr;
                    statusElem.title = 'Showing result ' + resultIndexOneBased + ' of ' + totalLongStr;
                }
                function enableFind(enabled) {
                    heading.querySelector('.find-next').disabled =
                        heading.querySelector('.find-prev').disabled =
                        heading.querySelector('.find-all').disabled =
                        !enabled;
                }
                // Disable find by default because 1) there is initially no content
                // (<ol>). and 2) the search engine is unavailable in old browsers.
                enableFind(false);

                var onPreRendered = function (pre) {
                    if (sourceToolbarElem.firstChild !== heading || pre !== preCurrent) {
                        // While asynchronously generating the content for the pre
                        // element, the user switched to another element, or the
                        // user toggled the beautify option..
                        // Do nothing for now. When the user switches back,
                        // onPreRendered will be called again via a call to
                        // doRenderSourceCodeViewer.
                        return;
                    }
                    var list = pre.querySelector('ol');
                    console.assert(list, '<pre> should contain <ol>');
                    if (!searchEngine) {
                        if (typeof SearchEngineElement === 'undefined') {
                            console.warn('search-tools.js failed to load. In-file search not available.');
                            delete entry._initialViewParams; // = "onReturnEarly".
                            return;
                        }
                        if (pre === preRaw) {
                            searchEngine = new SearchEngineElement(text);
                        } else { // pre === preBeauty
                            searchEngine = new SearchEngineElement(textBeauty);
                        }
                        entry._searchEngineForPermalink = searchEngine;
                        enableFind(true);
                    }
                    searchEngine.disconnect();
                    searchEngine.setElement({
                        element: list,
                        scrollableElement: sourceCodeElem,
                    });
                    searchEngine.connect();
                    searchEngine.setQuery(textSearchEngine.getCurrentSearchTerm());
                    if (shouldHighlightAll) {
                        searchEngine.highlightAll();
                    }
                    showFindStatus(false);
                    textSearchEngine.setQueryChangeCallback(function () {
                        searchEngine.setQuery(textSearchEngine.getCurrentSearchTerm());
                        searchEngine.showVisibleHighlights();
                        showFindStatus(false);
                    });
                    var initialViewParams = entry._initialViewParams;
                    if (initialViewParams) {
                        delete entry._initialViewParams; // = "onReturnEarly".
                        if (initialViewParams.qh) {
                            heading.querySelector('.find-all > .find-all-indicator').classList.add('find-all-enabled');
                            shouldHighlightAll = true;
                            searchEngine.highlightAll();
                            showFindStatus(false);
                        }
                        if (initialViewParams.qi) {
                            // Skip (qi - 1) results.
                            for (var i = initialViewParams.qi; i > 1; --i) {
                                searchEngine.logic.findNext();
                            }
                            // Now perform the qi-th search and update the UI.
                            searchEngine.findNext();
                            showFindStatus(false);
                        }
                    }
                };
                if (beautify.getType(entry.filename)) {
                    toggleBeautify.className = 'toggle-beautifier';
                    toggleBeautify.title = 'Click on this button to toggle between beautified code and non-beautified (original) code.';
                    toggleBeautify.onclick = function () {
                        // Note: Toggling the state is based on the local preCurrent
                        // variable instead of `!wantRawSourceGlobalDefault` because
                        // the two may differ when the user switches to a different
                        // file and modifies toggles the beautifier in that file.
                        wantRawSourceGlobalDefault = preCurrent !== preRaw;
                        if (searchEngine) {
                            searchEngine.destroy();
                            searchEngine = null;
                            entry._searchEngineForPermalink = null;
                            enableFind(false);
                        }
                        selectPre(wantRawSourceGlobalDefault ? preRaw : preBeauty);
                        doRenderSourceCodeViewer();
                    };

                    if (entry._initialViewParams) {
                        wantRawSourceGlobalDefault = !entry._initialViewParams.qb;
                    }

                    // Use the last selected option for new views.
                    // Note: This state only changes when the user clicks on the
                    // `toggleBeautify` button, not when they change the file view.
                    selectPre(wantRawSourceGlobalDefault ? preRaw : preBeauty);
                } else {
                    toggleBeautify.title = 'Beautify not available for this file type';
                    toggleBeautify.disabled = true;
                    selectPre(preRaw);
                }

                function doRenderSourceCodeViewer() {
                    var lastPre = sourceCodeElem.lastChild;
                    if (lastPre !== preCurrent) {
                        if (lastPre == preRaw || lastPre == preBeauty) {
                            // Last element is a <pre>, but not matching
                            // the desired <pre>. So remove the existing
                            // pre before appending the desired pre,
                            lastPre.remove();
                        }
                        sourceCodeElem.appendChild(preCurrent);
                        if (preCurrent.firstChild) {
                            onPreRendered(preCurrent);
                        }
                    }
                }

                function onSourceViewShow() {
                    sourceCodeElem.addEventListener('sourceviewhide', onSourceViewHide);
                    sourceToolbarElem.appendChild(heading);
                    // This will connect searchEngine if needed.
                    doRenderSourceCodeViewer();
                }

                function onSourceViewHide() {
                    sourceCodeElem.removeEventListener('sourceviewhide', onSourceViewHide);
                    if (searchEngine) {
                        searchEngine.disconnect();
                    }
                    textSearchEngine.setQueryChangeCallback(null);
                }

                onSourceViewShow();
                finalCallback(onSourceViewShow);
            }
        };
    handlers['image/svg+xml'] = {
        Writer: zip.Data64URIWriter,
        callback: function (entry, data_url) {
            var sourceToolbarElem = document.getElementById('source-toolbar');
            sourceToolbarElem.appendChild(createDownloadLink(entry, data_url));
            sourceToolbarElem.appendChild(createContentVerifier(entry));

            var viewSourceBtn = document.createElement('button');
            viewSourceBtn.className = 'btn-action btn-secondary';
            viewSourceBtn.textContent = 'View SVG Source';
            viewSourceBtn.onclick = function () {
                delete entry._cachedResult;
                delete entry._cachedCallback;
                handlers.text.callback(entry, atob(data_url.split(',')[1]));
            };
            sourceToolbarElem.appendChild(viewSourceBtn);

            var sourceCodeElem = document.getElementById('source-code');
            sourceCodeElem.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:var(--bg-main);padding:40px;"><img style="max-width:100%;max-height:100%;filter:drop-shadow(0 0 20px rgba(0,0,0,0.2))"></div>';
            var img = sourceCodeElem.querySelector('img');
            img.src = data_url;
        }
    };
    handlers.image = {
        Writer: zip.Data64URIWriter,
        callback: function (entry, data_url) {
            var sourceToolbarElem = document.getElementById('source-toolbar');
            sourceToolbarElem.appendChild(createDownloadLink(entry, data_url));
            sourceToolbarElem.appendChild(createContentVerifier(entry));

            var sourceCodeElem = document.getElementById('source-code');
            sourceCodeElem.innerHTML = '<img>';
            var img = sourceCodeElem.firstChild;
            img.onload = function () {
                renderImageInfo('Width: ' + this.naturalWidth + ' Height: ' + this.naturalHeight);
            };
            img.onerror = function () {
                renderImageInfo('Failed to load image');
            };
            img.src = data_url;

            function renderImageInfo(text) {
                if (sourceCodeElem.firstChild === img) {
                    // The image is still being displayed.
                    sourceToolbarElem.appendChild(document.createTextNode(' ' + text));
                }
            }
        }
    };
    handlers['application/java-archive'] =
        handlers['application/zip'] = {
            Writer: zip.BlobWriter,
            callback: function (entry, blob) {
                var viewerUrl = 'explorer.html';
                var blob_url = URL.createObjectURL(blob);
                if (getParam('crx') === window.crx_url && window.crx_url) {
                    // The URL parameters are probably reliable (=describing the zip), so use it.
                    var inside = getParam('inside[]');
                    inside.push(entry.filename);
                    viewerUrl += '?' + encodeQueryString({
                        // Pass these parameters in case the blob URL disappears.
                        crx: window.crx_url,
                        inside: inside,
                        // Allow the viewer to re-use our cached blob.
                        blob: blob_url,
                    });
                } else {
                    viewerUrl += '?' + encodeQueryString({
                        blob: blob_url,
                        zipname: entry.filename,
                    });
                }

                var sourceToolbarElem = document.getElementById('source-toolbar');
                sourceToolbarElem.appendChild(createDownloadLink(entry, blob_url));
                sourceToolbarElem.appendChild(createContentVerifier(entry));

                var sourceCodeElem = document.getElementById('source-code');
                sourceCodeElem.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%;"><button class="btn-action">View the content of this file in CodeLens Explorer</button></div>';
                sourceCodeElem.firstChild.onclick = function () {
                    window.open(viewerUrl);
                };
            }
        };

    // Called right before the source viewer switches to another view.
    function willSwitchSourceView() {
        var sourceToolbarElem = document.getElementById('source-toolbar');
        sourceToolbarElem.textContent = '';

        var sourceCodeElem = document.getElementById('source-code');
        sourceCodeElem.dispatchEvent(new CustomEvent('sourceviewhide'));
        sourceCodeElem.textContent = '';
    }

    // Render `text` in the given pre tag. The pre element should be blank,
    // i.e. the caller should create it and not add any attributes or content.
    // onPreRendered is called when the content (`<ol>`) has been rendered.
    function viewTextSource(text, filename, pre, onPreRendered) {
        pre.className = 'linenums auto-wordwrap';
        var lineCount = text.match(/\n/g);
        lineCount = lineCount ? lineCount.length + 1 : 1;
        // Calculate max width of counters:
        var lineCountExp = Math.floor(Math.log(lineCount) / Math.log(10)) + 1;
        pre.className += ' linenumsltE' + lineCountExp;

        // Auto-highlight for <30kb source
        if (text.length < 3e4) {
            pre.innerHTML = Prism.rob.highlightSource(text, filename);
            onPreRendered(pre);
        } else {
            var startTag = '<li>';
            var endTag = '</li>';
            pre.innerHTML =
                '<ol>' +
                startTag +
                escapeHTML(text).replace(/\n/g, endTag + startTag) +
                endTag +
                '</ol>';
            Prism.rob.highlightSourceAsync(text, filename, function (html) {
                pre.innerHTML = html;
                onPreRendered(pre);
            });
            onPreRendered(pre);
        }
    }
    var scrollingOffsets = {};
    // identifier = filename, for example
    function saveScroll(identifier) {
        var sourceCodeElem = document.getElementById('source-code');
        if (!identifier) identifier = sourceCodeElem.dataset.filename;
        else sourceCodeElem.dataset.filename = identifier;
        if (!identifier) return;
        scrollingOffsets[identifier] = sourceCodeElem.scrollTop;
    }
    function restoreScroll(identifier) {
        var sourceCodeElem = document.getElementById('source-code');
        var currentFilename = sourceCodeElem.dataset.filename;
        if (!identifier) identifier = currentFilename;
        else sourceCodeElem.dataset.filename = identifier;
        var scrollTop = scrollingOffsets[identifier];
        if (scrollTop === undefined && !currentFilename) {
            // This is the first run, don't restore the scroll offset.
            return;
        }
        // Switched view, reset to previous offset (or default to 0).
        sourceCodeElem.scrollTop = scrollTop || 0;
    }
    function createDownloadLink(entry, url) {
        var mimeType = getMimeTypeForFilename(entry.filename);
        var filename = entry.filename.split('/').pop();

        var a = document.createElement('a');
        a.className = 'btn-action btn-secondary file-specific-download-link';
        a.textContent = 'Show download';
        a.title = 'Download ' + entry.filename + ' (' + formatByteSize(entry.uncompressedSize) + ' bytes, type ' + mimeType + ')';
        a.onclick = function () {
            a.onclick = null;
            a.textContent = 'Creating link';

            var isText = /^(text\/|application\/(javascript|json|xml|x-httpd-php))/.test(mimeType) ||
                /\.(js|css|html|json|md|txt)$/i.test(entry.filename);

            if (isText) {
                entry.getData(new EfficientTextWriter(), function (text) {
                    var attribution = "/**\n * Source by Subhan Haider\n * All rights reserved.\n */\n\n";
                    if (/\.html?$/i.test(entry.filename)) {
                        attribution = "<!--\n Source by Subhan Haider\n All rights reserved.\n -->\n\n";
                    } else if (/\.(css|json|md|txt)$/i.test(entry.filename)) {
                        attribution = "/*\n * Source by Subhan Haider\n * All rights reserved.\n */\n\n";
                    }
                    var blob = new Blob([attribution + text], { type: mimeType });
                    a.download = filename;
                    a.textContent = 'Download file';
                    a.href = URL.createObjectURL(blob);
                });
            } else {
                entry.getData(new zip.BlobWriter(mimeType), function (blob) {
                    a.download = filename;
                    a.textContent = 'Download file';
                    a.href = URL.createObjectURL(blob);
                });
            }
        };
        if (url) {
            a.onclick = null;
            a.download = filename;
            a.textContent = 'Download file';
            a.href = url;
        }
        return a;
    }
    function createContentVerifier(entry) {
        var wrapper = document.createElement('div');
        wrapper.className = 'content-verifier-wrapper';
        var output = document.createElement('div');
        output.className = 'content-verifier-output';
        var button = document.createElement('button');
        button.className = 'btn-action btn-secondary';
        button.textContent = 'Show analysis';
        var displayedHashes = [
            'md5',
            'sha1',
            'sha256',
            'sha384',
            'sha512',
        ];
        button.onclick = function () {
            button.onclick = toggleOutputVisibility;

            var infoTable = createInfoTable();

            infoTable.addRow('File name', entry.filename);
            // The zip file could report an incorrect value, so we will update this later.
            infoTable.addRow('File size', formatByteSize(entry.uncompressedSize) + ' bytes');

            displayedHashes.forEach(function (algo, i) {
                infoTable.addRow(algo, '');
            });

            entry.getData(new Uint8ArrayWriter(), function (uint8array) {
                infoTable.updateRow('File size', formatByteSize(uint8array.length) + ' bytes');
                displayedHashes.forEach(function (algo, i) {
                    // ModernCrypto.md5, ModernCrypto.sha1, etc.
                    ModernCrypto[algo](uint8array, function (hash) {
                        infoTable.updateRow(algo, hash);
                    });
                });

                // --- Intelligence Feature ---
                var text = new TextDecoder().decode(uint8array);
                var issues = [];
                if (/\beval\s*\(/.test(text)) issues.push('eval()');
                if (/setTimeout\s*\(\s*['"`]/.test(text)) issues.push('setTimeout(string)');
                if (/\.innerHTML\s*=/.test(text)) issues.push('innerHTML');
                if (/document\.write\s*\(/.test(text)) issues.push('document.write()');

                if (issues.length > 0) {
                    var cell = infoTable.addRow('Security Intel', issues.join(', '));
                    cell.style.color = '#e11d48';
                    cell.style.fontWeight = '700';
                }

                if (entry.filename === 'manifest.json') {
                    try {
                        var manifest = JSON.parse(text);
                        var permissions = (manifest.permissions || []).concat(manifest.host_permissions || []);
                        if (permissions.length > 0) {
                            var pWrapper = document.createElement('div');
                            pWrapper.style.fontSize = '11px';
                            pWrapper.style.marginTop = '4px';
                            pWrapper.style.color = 'var(--text-secondary)';

                            var pHeader = document.createElement('div');
                            pHeader.style.fontWeight = 'bold';
                            pHeader.style.marginBottom = '4px';
                            pHeader.textContent = 'Permissions Insight:';
                            pWrapper.appendChild(pHeader);

                            var pMap = {
                                "tabs": "Access tab info",
                                "storage": "Local data storage",
                                "contextMenus": "Right-click items",
                                "downloads": "Manage downloads",
                                "activeTab": "Current page access",
                                "cookies": "Access browser cookies",
                                "history": "View browsing history",
                                "webRequest": "Monitor network",
                                "identity": "User login/ID"
                            };

                            permissions.forEach(function (p) {
                                var desc = pMap[p] || (p.includes('://') ? 'External site access' : 'System access');
                                var pItem = document.createElement('div');
                                pItem.innerHTML = '<span style="color:var(--primary);font-weight:600">' + p + '</span>: ' + desc;
                                pWrapper.appendChild(pItem);
                            });
                            infoTable.appendChild(pWrapper);
                        }

                        if (manifest.manifest_version) {
                            var mvCell = infoTable.addRow('Manifest Version', 'V' + manifest.manifest_version);
                            if (manifest.manifest_version < 3) {
                                mvCell.innerHTML += ' <span style="color:#f59e0b;font-size:10px">(Legacy MV2)</span>';
                            } else {
                                mvCell.innerHTML += ' <span style="color:var(--accent);font-size:10px">(Modern MV3)</span>';
                            }
                        }
                    } catch (e) { }
                }
                // --- End Intelligence ---
            });

            if (entry.filename === 'manifest.json') {
                infoTable.addRow('Extension ID', '(unknown)');
                calculateExtensionID().then(function (result) {
                    infoTable.updateRow('Extension ID', result);
                });
            }

            output.appendChild(infoTable);
            toggleOutputVisibility();
        };
        function toggleOutputVisibility() {
            output.hidden = !output.hidden;
            if (output.hidden) {
                button.textContent = 'Show analysis';
                button.title = 'View more information about this file.';
            } else {
                button.textContent = 'Hide analysis';
                button.title = '';
                var permalinkAnchor = output.querySelector('tr[data-description="Link"] a');
                if (permalinkAnchor && permalinkAnchor.updatePermalink) {
                    permalinkAnchor.hidden = !permalinkAnchor.updatePermalink();
                }
            }
        }
        // Hide the output and update the button label.
        toggleOutputVisibility();
        wrapper.appendChild(button);
        wrapper.appendChild(output);

        if (entry._initialViewParams && entry._initialViewParams.audit) {
            button.click();
        }

        return wrapper;
    }

    function createInfoTable() {
        var infoTable = document.createElement('div');
        infoTable.className = 'info-card-container';

        function addRow(description, initialValue) {
            var row = document.createElement('div');
            row.className = 'info-card-row';
            row.dataset.description = description.replace(/"/g, '');

            var label = document.createElement('div');
            label.className = 'info-card-label';
            label.textContent = description;

            var value = document.createElement('div');
            value.className = 'info-card-value';
            value.textContent = initialValue || '';

            row.appendChild(label);
            row.appendChild(value);
            infoTable.appendChild(row);
            return value;
        }
        function updateRow(description, value) {
            var row = infoTable.querySelector('.info-card-row[data-description="' + description.replace(/"/g, '') + '"]');
            if (row) {
                row.querySelector('.info-card-value').textContent = value;
            }
        }
        infoTable.addRow = addRow;
        infoTable.updateRow = updateRow;
        return infoTable;
    }



    function showGoToLine(sourceCodeElem, preCurrent) {
        var ol = preCurrent.querySelector('ol');
        if (!ol) {
            // When the source is beautified asynchronously,
            // initially the <ol> does not exist yet.
            alert('Not ready yet, wait until the source is shown');
            return;
        }
        var lineCount = ol.childElementCount;
        var lineInput = prompt('Enter a line to jump to (max ' + lineCount + ')', '');
        // Converting to Number first to avoid '123bogus' -> 123.
        var line = parseInt(Number(lineInput));
        if (isNaN(line) || line <= 0) {
            if (lineInput !== null) {
                alert('Line number must be an integer between 1 and ' + lineCount + ', but got "' + lineInput + '"!');
            }
            return;
        }
        // While the dialog was shown, the asynchronous highlighter might
        // have overwritten the displayed list, so fetch the new list.
        ol = preCurrent.querySelector('ol');
        lineCount = ol.childElementCount;
        if (line > lineCount) {
            var msg = 'Line ' + line + ' not found.\n' +
                'This file has ' + lineCount + ' lines.\n' +
                'Want to go to the last line?';
            if (confirm(msg)) {
                sourceCodeElem.scrollTop = sourceCodeElem.scrollHeight;
            }
            return;
        }
        var li = ol.children[line - 1];
        scrollElementIntoViewIfNeeded(sourceCodeElem, li);
        li.style.outline = '2px solid red';
        setTimeout(function () {
            li.style.outline = '';
        }, 1000);
    }
    return viewFileInfo;
})();

// Set while loading an extension in handleBlob.
var crx_public_key;

function parseExtensionIdFromManifest(manifest) {
    var id;
    if (manifest.browser_specific_settings &&
        manifest.browser_specific_settings.gecko &&
        (id = manifest.browser_specific_settings.gecko.id)) {
        return id;
    }

    if (manifest.applications && manifest.applications.gecko &&
        (id = manifest.applications.gecko.id)) {
        return id;
    }

    var crxKey = manifest.key || crx_public_key;
    if (typeof crxKey === "string") {
        return publicKeyToExtensionId(crxKey);
    }

    return '';
}

// Parse a manifest.json file into an object. These can contain '//' comments.
function parseManifest(str) {
    var parsed;
    try {
        parsed = JSON.parse(str);
    } catch (e) {
        // JSON.minify from src/lib/beautify/minify.json.js
        // Add a LF at the end of the file to ensure that comments at the end of
        // the file end with a LF are properly stripped.
        parsed = JSON.parse(JSON.minify(str + '\n'));
    }
    return parsed;
}

// Extract the extension ID from the currently loaded extension. The ID will be
// determined from the COSE signature, the PKCS#7 signature, or manifest.json,
// whatever comes first. Resolves to the extension ID (and the signature type
// between parentheses if available), or rejects on parser errors.
function calculateExtensionID() {
    var fileList = document.getElementById('file-list');
    var readEntry = function (filename, Writer) {
        var li = fileList.querySelector('li[data-filename="' + filename + '"]');
        if (!li) {
            return null;
        }
        return new Promise(function (resolve) {
            li.zipEntry.getData(new Writer(), function (data) {
                resolve(data);
            });
        });
    };
    // [Reference]
    var extensionID_pattern =
        /^(\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}|[a-z0-9-._]*@[a-z0-9-._]+)$/i;
    var formatSubject = function (id, subject) {
        if (extensionID_pattern.test(subject.CN)) {
            id = subject.CN;
        }
        var mapping = {
            'Mozilla Components': 'system',
            'Mozilla Extensions': 'privileged',
        };
        var type = mapping[subject.OU] || 'signed';
        return id + ' (' + type + ')';
    };

    return Promise.all([
        readEntry('manifest.json', EfficientTextWriter),
        readEntry('META-INF/cose.sig', Uint8ArrayWriter),
        readEntry('META-INF/mozilla.rsa', Uint8ArrayWriter),
    ]).then(function (entries) {
        var manifest_json = entries[0];
        var cose_sig = entries[1];
        var pkcs7_sig = entries[2];
        var id;

        // manifest.json contains the certification source (e.g. Production), so
        // check it in addition to the other sources.
        if (manifest_json) {
            id = parseExtensionIdFromManifest(parseManifest(manifest_json));
        }

        if (cose_sig) {
            return formatSubject(id, parseCertificate(parseMozCOSE(cose_sig)));
        }

        if (pkcs7_sig) {
            return formatSubject(id, parseCertificate(pkcs7_sig));
        }

        if (id) {
            // Unsigned extension, return it as-is.
            return id;
        }

        throw new Error('Invalid extension file');
    });
}

var textSearchEngine;  // Initialized as soon as we have a zip file.
var TextSearchEngine = (function () {
    // A text search engine. It is guaranteed to report a result for every entry in the zip file.
    // When a new search is started before the previous search completes, no old search results will
    // appear again.
    function TextSearchEngine(zipBlob) {
        // Lazily initialize the worker.
        Object.defineProperty(this, 'worker', {
            configurable: true,
            enumerable: true,
            get: function () {
                var worker = initializeWorker(this);
                worker.postMessage({
                    zipBlob: zipBlob,
                });
                delete this.worker;
                this.worker = worker;
                return worker;
            },
        });
        /**
         * Called twice for every new search. First with null, and then again with true or false.
         *
         * @callback resultCallback
         * @param {string|null} filename The filename of the result. null for all files.
         * @param {boolean|null} found true if found, false if not found, null if unknown.
         */
        this.resultCallback = null;
        this.queryChangeCallback = null;
        this._currentSearchTerm = '';
        this._currentSearchStart = 0;
        this._recentSearchResults = {
            // This is often identical to this._currentSearchTerm, except the latter may become an
            // empty string, whereas this is not. This allows known-good search results to be
            // supplied much faster.
            searchTerm: '',
            found: [],
            notfound: [],
        };
    }

    /**
     * Validates the search term and returns a regular expression if the query
     * is a regular expression. This is the case when |searchTerm| starts with
     * "regexp:" or "iregexp:" (the latter is a case-insensitive search).
     *
     * @param {string} searchTerm
     * @returns {null|RegExp} null iff it is not a regular expression query.
     * @throws {Error} If the query is a regular expression, but the pattern is invalid.
     */
    TextSearchEngine.parsePatternAsRegExp = function (searchTerm) {
        // Keep this search term parsing logic in sync with search-worker.js.
        var parsed = /^(i?)regexp:(.*)$/.exec(searchTerm);
        if (!parsed) {
            return null;
        }
        var pattern = parsed[2];
        var flags = parsed[1]; // 'i' or ''.
        try {
            return new RegExp(pattern, flags);
        } catch (e) {
            // Chrome includes the regexp in the error message, omit this.
            throw new Error((e.message + '').replace(': /' + pattern + '/' + flags));
        }
    };

    TextSearchEngine.prototype.setResultCallback = function (resultCallback) {
        this.resultCallback = resultCallback;
    };

    TextSearchEngine.prototype.setQueryChangeCallback = function (queryChangeCallback) {
        // This is to support the in-file search. For now I only expect one callback
        // at any time. If more listeners are needed, switch to an event emitter.
        this.queryChangeCallback = queryChangeCallback;
    };

    /**
     * @returns {RegExp|null} The current search term, as a RegExp.
     *     null if there there is no search query.
     */
    TextSearchEngine.prototype.getCurrentSearchTerm = function () {
        // Keep this search term parsing logic in sync with search-worker.js.
        var searchTerm = this._currentSearchTerm;
        // Assuming that the query is a valid regexp, if it is a regexp.
        var regexpTerm = TextSearchEngine.parsePatternAsRegExp(searchTerm);
        if (regexpTerm) {
            searchTerm = regexpTerm;
        } else if (searchTerm) {
            searchTerm = searchTerm.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
            if (searchTerm.lastIndexOf('case:', 0) === 0) {
                searchTerm = new RegExp(searchTerm.slice(5), '');
            } else {
                searchTerm = new RegExp(searchTerm, 'i');
            }
        } else {
            searchTerm = null;
        }
        return searchTerm;
    };

    /**
     * @param {string} searchTerm A case-insensitive search query.
     * @param {Array<string>} lowPrioFilenames List of files that the caller is not really
     *     interested in, e.g. because the files are hidden anyway.
     */
    TextSearchEngine.prototype.doPlaintextSearch = function (searchTerm, lowPrioFilenames) {
        if (!this.resultCallback) {
            console.warn('Ignored search request because the result handler was not set.');
            return;
        }

        if (!searchTerm) {
            if (this._currentSearchTerm === searchTerm) {
                return; // No change in result, do not lazily initialize the worker.
            }
            this._currentSearchTerm = '';
            this.worker.postMessage({
                searchTerm: '',
            });
            // No search term = every file matches.
            this.resultCallback(null, true);
            if (this.queryChangeCallback) {
                this.queryChangeCallback();
            }
            return;
        }
        this.resultCallback(null, null); // Should not call doPlaintextSearch again.

        // Re-use the last search results if possible.
        if (this._recentSearchResults.searchTerm === searchTerm) {
            lowPrioFilenames = mergeUnique(lowPrioFilenames, this._recentSearchResults.found);
            lowPrioFilenames = mergeUnique(lowPrioFilenames, this._recentSearchResults.notfound);
            this.resultCallback(this._recentSearchResults.found, true);
            this.resultCallback(this._recentSearchResults.notfound, false);
        } else if (this._recentSearchResults.searchTerm.indexOf(searchTerm) !== -1) {
            // E.g. "test" -> "tes". If the result contained "test" then it also includes "tes".
            lowPrioFilenames = mergeUnique(lowPrioFilenames, this._recentSearchResults.found);
            this.resultCallback(this._recentSearchResults.found, true);
            this._recentSearchResults.notfound.length = 0;
        } else if (searchTerm.indexOf(this._recentSearchResults.searchTerm) !== -1) {
            // E.g. "tes" -> "test". If the result did not contain "tes" then it will not contain
            // "test" either.
            lowPrioFilenames = mergeUnique(lowPrioFilenames, this._recentSearchResults.notfound);
            this.resultCallback(this._recentSearchResults.notfound, false);
            this._recentSearchResults.found.length = 0;
        } else {
            this._recentSearchResults.found.length = 0;
            this._recentSearchResults.notfound.length = 0;
        }
        this._recentSearchResults.searchTerm = searchTerm;
        this._currentSearchTerm = searchTerm;
        this._currentSearchStart = Date.now();
        this.worker.postMessage({
            searchTerm: searchTerm,
            lowPrioFilenames: lowPrioFilenames,
        });
        if (this.queryChangeCallback) {
            this.queryChangeCallback();
        }
    };

    // Stably merge two arrays, ignoring duplicate entries from the second array.
    function mergeUnique(a, b) {
        var merged = a.slice();
        // a is probably not large, in the worst case thousands, so this algorithm should be fine.
        for (var i = 0; i < b.length; ++i) {
            if (a.indexOf(b[i]) === -1) {
                merged.push(b[i]);
            }
        }
        return merged;
    }

    function initializeWorker(textSearchEngine) {
        var worker = new Worker('search-worker.js');
        worker.addEventListener('message', function (event) {
            if (beautify.maybeInterceptMessageEvent(event)) {
                return;
            }
            var message = event.data;
            if (message.searchTerm !== textSearchEngine._currentSearchTerm) {
                return;
            }
            if (message.found.length) {
                textSearchEngine._recentSearchResults.found =
                    mergeUnique(textSearchEngine._recentSearchResults.found, message.found);
                textSearchEngine.resultCallback(message.found, true);
            }
            if (message.notfound.length) {
                textSearchEngine._recentSearchResults.notfound =
                    mergeUnique(textSearchEngine._recentSearchResults.notfound, message.notfound);
                textSearchEngine.resultCallback(message.notfound, false);
            }
            if (message.remaining === 0) {
                // This is the time spent on waiting until the zip file is extracted (first time
                // only) and busy main thread (e.g. updating the UI).
                var totalTime = Date.now() - textSearchEngine._currentSearchStart;
                console.log('Query finished in ' + message.querytime + 'ms' +
                    (totalTime > 10 ? ' (' + totalTime + 'ms total)' : '') +
                    ' for ' + message.searchTerm);
            }
        });
        return worker;
    }

    return TextSearchEngine;
})();

function renderInitialViewFromUrlParams() {
    // Filename!pattern
    var q = getParam('q') || '';
    // Whether to beautify (anything but &qb=0).
    var qb = getParam('qb') !== '0';
    // The file to select.
    var qf = getParam('qf') || '';
    // Highlight all (&qh=1).
    var qh = getParam('qh') === '1';
    // The nth search result to select (0 = none, 1 = first, etc.).
    var qi = parseInt(getParam('qi')) || 0;
    // Audit mode?
    var audit = getParam('audit') === '1';

    if (audit && !qf) {
        qf = 'manifest.json';
    }

    if (!q && !qf) return;
    var fileFilterElem = document.getElementById('file-filter');
    if (fileFilterElem.value && fileFilterElem.value !== q) {
        // Page restored from cache (refresh?), query parameter does not match
        // input, so do not change the view.
        console.warn('File filter input is not empty. Ignoring query from URL.');
        return;
    }

    fileFilterElem.value = q;

    // Hide all files in the UI that do not match the query.
    checkAndApplyFilter();
    if (fileFilterElem.classList.contains('invalid')) {
        // The query is invalid. Don't bother with searching.
        return;
    }

    var selectedItem;
    var fileList = document.getElementById('file-list');
    // checkAndApplyFilter above ensures that all unfiltered items match the file pattern.
    var unfilteredItems = fileList.querySelectorAll('li:not(.file-filtered)');
    if (qf) {
        var listItems = fileList.querySelectorAll('li');
        for (var i = 0; i < listItems.length; ++i) {
            if (listItems[i].dataset.filename === qf) {
                selectedItem = listItems[i];
                break;
            }
        }
        if (!selectedItem) {
            console.warn('No entry found with name ' + qf);
            return;
        }
        if ([].indexOf.call(unfilteredItems, selectedItem) === -1) {
            console.warn('The selected item is invisible because it did not match the search filter.');
        }
    } else if (unfilteredItems.length === 1) {
        selectedItem = unfilteredItems[0];
    } else if (unfilteredItems.length > 1) {
        // More than one item matches. Select the shortest matching filename,
        // because we assume that the "permalink" includes the file name,
        // so that we don't actually have to search through all files.
        // TODO: Wait for the first positive search result?
        var smallestNameLength = Infinity;
        [].forEach.call(unfilteredItems, function (listItem) {
            var len = listItem.dataset.filename.length;
            if (smallestNameLength > len) {
                smallestNameLength = len;
                selectedItem = listItem;
            }
        });
    }
    if (!selectedItem) {
        console.warn('Ignoring query from URL because there is no matching file.');
        return;
    }
    selectedItem.classList.add('file-selected');
    scrollElementIntoViewIfNeeded(fileList.parentNode, selectedItem);
    selectedItem.zipEntry._initialViewParams = {
        qb: qb,
        qh: qh,
        qi: qi,
        audit: audit,
    };
    viewFileInfo(selectedItem.zipEntry);
}

function scrollElementIntoViewIfNeeded(scrollableElement, element) {
    var scrollableRect = scrollableElement.getBoundingClientRect();
    var elementRect = element.getBoundingClientRect();
    if (elementRect.height >= scrollableRect.height) {
        // Show start of line if it does not fit.
        scrollableElement.scrollTop += elementRect.top - scrollableRect.top;
    } else if (elementRect.top < scrollableRect.top || elementRect.bottom > scrollableRect.bottom) {
        // Vertically center otherwise.
        scrollableElement.scrollTop +=
            elementRect.top - scrollableRect.top +
            elementRect.height / 2 - scrollableRect.height / 2;
    }
}

function escapeHTML(string, useAsAttribute) {
    string = string
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    if (useAsAttribute)
        string = string
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    return string;
}


function renderPanelResizer() {
    var leftPanel = document.getElementById('left-panel');
    var rightPanel = document.getElementById('right-panel');
    var resizer = document.createElement('div');
    var rightPanelPadding = parseFloat(getComputedStyle(rightPanel).paddingLeft);
    rightPanelPadding = (rightPanelPadding - leftPanel.offsetWidth) || 0;
    var oldX;
    var width;
    var TOGGLED_CLASS = 'toggled';

    var toggler = document.createElement('div');
    toggler.className = 'toggler';
    toggler.addEventListener('click', function (e) {
        e.stopPropagation();
        leftPanel.classList.toggle(TOGGLED_CLASS);
        dispatchPanelSizeChange();
    });
    rightPanel.classList.add('toggleable');

    resizer.className = 'resizer';
    resizer.addEventListener('mousedown', function (e) {
        if (leftPanel.classList.contains(TOGGLED_CLASS)) return;
        e.preventDefault();
        oldX = e.clientX;
        width = leftPanel.offsetWidth;
        window.addEventListener('mousemove', resizeHandler);
        window.addEventListener('mouseup', function (e) {
            window.removeEventListener('mousemove', resizeHandler);
        });
    });
    resizer.appendChild(toggler);
    leftPanel.appendChild(resizer);

    function resizeHandler(e) {
        var newWidth = width + (e.clientX - oldX);
        if (newWidth < 0) {
            if (width > 0)
                newWidth = 0;
            else
                return;
        }
        var newWidthPx = newWidth + 'px';
        if (leftPanel.style.width === newWidthPx) return;
        leftPanel.style.width = newWidthPx;
        rightPanel.style.paddingLeft = (newWidth + rightPanelPadding) + 'px';
        dispatchPanelSizeChange();
    }
    function dispatchPanelSizeChange() {
        // Generate an artificial resize event so that the resize handler in
        // search-tools.js will be triggered and fix the rendering of search
        // results if needed.
        window.dispatchEvent(new CustomEvent('resize'));
    }
}

var checkAndApplyFilter = (function () {
    var filteredFilenames = [];
    // Filter for file names
    function applyFilter(/*regex*/pattern) {
        var CLASS_FILTERED = 'file-filtered';
        var CLASS_HIDDEN = 'hidden';
        var fileList = document.getElementById('file-list');
        var treeFiles = fileList.querySelectorAll('.tree-item.file-item');
        filteredFilenames.length = 0;

        // First, handle all files
        treeFiles.forEach(function (listItem) {
            var filename = listItem.dataset.filename;
            if (pattern.test(filename)) {
                listItem.classList.remove(CLASS_FILTERED);
                listItem.classList.remove(CLASS_HIDDEN);
            } else {
                listItem.classList.add(CLASS_FILTERED);
                listItem.classList.add(CLASS_HIDDEN);
                filteredFilenames.push(filename);
            }
        });

        // Now, show/hide folders based on visible children
        const folders = Array.from(fileList.querySelectorAll('.folder-item')).reverse();
        folders.forEach(folder => {
            const children = folder.nextElementSibling;
            const hasVisibleChild = children.querySelector('.tree-item.file-item:not(.hidden)') ||
                children.querySelector('.folder-item:not(.hidden)');

            if (hasVisibleChild) {
                folder.classList.remove(CLASS_HIDDEN);
            } else {
                folder.classList.add(CLASS_HIDDEN);
            }
        });

        renderTotalFileSize();
    }
    // Filter on files containing |searchTerm|. See search-worker.js for the algorithm.
    function grepSearch(searchTerm) {
        if (!textSearchEngine) {
            return;
        }
        textSearchEngine.setResultCallback(function (filenames, found) {
            var listItems = document.querySelectorAll('#file-list li');
            for (var i = 0; i < listItems.length; ++i) {
                var listItem = listItems[i];
                if (filenames !== null && filenames.indexOf(listItem.dataset.filename) === -1) {
                    continue;
                }
                listItem.classList.toggle('grep-unknown', found === null);
                listItem.classList.toggle('grep-no-match', found === false);
            }
            renderTotalFileSize();
        });
        textSearchEngine.doPlaintextSearch(searchTerm, filteredFilenames);
    }
    function renderTotalFileSize() {
        var listItems = document.querySelectorAll('#file-list li:not(.file-filtered):not(.grep-no-match)');
        var totalUncompressedSize = 0;
        for (var i = 0; i < listItems.length; ++i) {
            var listItem = listItems[i];
            if (listItem.gtypefiltered) continue;
            if (listItem.zipEntry && typeof listItem.zipEntry.uncompressedSize === 'number') {
                totalUncompressedSize += listItem.zipEntry.uncompressedSize;
            }
        }
        var totalSizeElem = document.getElementById('total-size');
        // parentNode = .total-size-wrapper
        totalSizeElem.parentNode.hidden = totalUncompressedSize === 0;
        totalSizeElem.title = 'Total size: ' + formatByteSize(totalUncompressedSize) + ' bytes';
        totalSizeElem.textContent = formatByteSizeSuffix(totalUncompressedSize);
    }
    var debounceGrep;
    function checkAndApplyFilter(shouldDebounce) {
        var fileFilterElem = document.getElementById('file-filter');
        var feedback = document.getElementById('file-filter-feedback');
        var pattern = fileFilterElem.value;
        var grepTerm = '';

        // Allow ! to be escaped if a user really wants to look for a ! in the filename.
        var i = -1;
        exclamation_search_loop: while ((i = pattern.indexOf('!', i + 1)) != -1) {
            // (?! is a negative look-ahead, don't treat it as a search either.
            if (pattern.substring(i - 2, i) != '(?') {
                // Allow '!' to be escaped. Note that in a RegExp, '\!' is identical to '!', so we
                // don't have to worry about changing semantics by requiring ! to be escaped to
                // disable search.
                for (var j = i; j > 0 && pattern.charAt(j - 1) === '\\'; --j);
                if ((j - i) % 2 === 0) {
                    // An unescaped !. Let's treat this as the delimiter for grep.
                    grepTerm = pattern.slice(i + 1);
                    pattern = pattern.slice(0, i);
                    break exclamation_search_loop;
                }
            }
        }

        try {
            pattern = new RegExp(pattern, 'i');
            if (feedback) feedback.textContent = '';
            fileFilterElem.classList.remove('invalid');
        } catch (e) {
            fileFilterElem.classList.add('invalid');
            // Strip Regexp, the user can see it themselves..
            // Invalid regular expression: /..pattern.../ : blablabla
            if (feedback) {
                feedback.textContent = (e.message + '').replace(': /' + pattern + '/', '');
            }
            return;
        }

        // Validate the grep pattern here to make sure that we don't apply the filter if the
        // pattern is invalid.
        try {
            TextSearchEngine.parsePatternAsRegExp(grepTerm);
            if (feedback) feedback.textContent = '';
            fileFilterElem.classList.remove('invalid');
        } catch (e) {
            fileFilterElem.classList.add('invalid');
            if (feedback) feedback.textContent = 'Search: ' + e.message;
            return;
        }
        applyFilter(pattern);

        clearTimeout(debounceGrep);
        if (shouldDebounce && !debounceGrep) {
            debounceGrep = setTimeout(function () {
                debounceGrep = null;
                grepSearch(grepTerm);
            }, 300);
        } else {
            debounceGrep = null;
            grepSearch(grepTerm);
        }
    }
    (function () {
        // Bind to checkbox filter
        var storageArea = chrome.storage.sync;

        var FILTER_STORAGE_PREFIX = 'filter-';
        var fileList = document.getElementById('file-list');
        var checkboxes = document.querySelectorAll('input[data-filter-type]');

        [].forEach.call(checkboxes, function (checkbox) {
            var storageKey = FILTER_STORAGE_PREFIX + checkbox.dataset.filterType;
            checkbox.checked = localStorage.getItem(storageKey) !== '0';
            checkbox.onchange = function () {
                var items = {};
                items[storageKey] = checkbox.checked;
                storageArea.set(items);
                updateFileListView();
            };
            storageArea.get(storageKey, function (items) {
                checkbox.checked = items[storageKey] !== false;
                updateFileListView();
            });
            function updateFileListView() {
                const gtype = checkbox.dataset.filterType;
                const isChecked = checkbox.checked;
                fileList.classList.toggle('gfilter-' + gtype, !isChecked);

                // Sync with premium UI
                if (checkbox.parentNode && checkbox.parentNode.classList.contains('filter-tag')) {
                    checkbox.parentNode.classList.toggle('active', isChecked);
                }

                // Update items
                const matchingItems = fileList.querySelectorAll('.tree-item.file-item.gtype-' + gtype);
                matchingItems.forEach(li => {
                    li.gtypefiltered = !isChecked;
                    li.classList.toggle('hidden-by-gtype', !isChecked);
                });

                // Refresh overall folder visibility
                refreshFolderVisibility();
                renderTotalFileSize();
            }
        });

        function refreshFolderVisibility() {
            const folders = Array.from(fileList.querySelectorAll('.folder-item')).reverse();
            folders.forEach(folder => {
                const children = folder.nextElementSibling;
                const hasVisibleChild = children.querySelector('.tree-item.file-item:not(.hidden):not(.hidden-by-gtype)') ||
                    children.querySelector('.folder-item:not(.hidden)');
                folder.classList.toggle('hidden-by-filter', !hasVisibleChild);
            });
        }
    })();
    // Bind event
    var fileFilterElem = document.getElementById('file-filter');
    fileFilterElem.addEventListener('input', function () {
        checkAndApplyFilter(true);
    });
    fileFilterElem.form.onsubmit = function (e) {
        e.preventDefault();
        checkAndApplyFilter();
    };

    var logoHome = document.getElementById('logo-home');
    if (logoHome) {
        logoHome.addEventListener('click', function () {
            var advOpen = document.getElementById('advanced-open');
            if (advOpen) advOpen.classList.toggle('visible');
        });
    }

    return checkAndApplyFilter;
})();
// Go load the stuff
initialize();
function initialize() {
    // initialize2 calls getPlatformInfo via get_crx_url or showAdvancedOpener.
    // When getPlatformInfoAsync is called first, more accurate information may
    // be returned by getPlatformInfo(), so do that now.
    getPlatformInfoAsync(initialize2);
    // TODO: Remove sometime in the future. This removes obsolete data that
    // was stored by an older version of the chrome-platform-info.js file.
    localStorage.removeItem('platformInfo');
}
function initialize2() {
    if (getParam('noview')) {
        showAdvancedOpener();
        return;
    }
    var crx_url = getParam('crx');
    var blob_url = getParam('blob');
    if (!crx_url && !blob_url) {
        showAdvancedOpener();
        return;
    }
    var webstore_url = crx_url && get_webstore_url(crx_url);
    // Only consider rewriting the URL if it is not a known webstore download, because
    // the get_crx_url method only takes the extension ID and generates the other
    // parameters based on the current platform.
    if (!is_crx_download_url(crx_url)) {
        if (is_webstore_url(crx_url)) {
            // Prefer given URL because its slug contains an extra human-readable short name.
            webstore_url = crx_url;
        }
        // This is a no-op if the URL is not recognized.
        crx_url = get_crx_url(webstore_url || crx_url);
    }
    if (webstore_url) {
        // Webstore link removed as requested.
    }
    var inside = getParam('inside[]');
    var zipname = getParam('zipname');

    // blob:-URL without inside parameter = looking inside an (embedded) zip file for which we don't
    // have a URL, e.g. a file selected via <input type=file>
    if (!inside.length && blob_url) {
        loadCachedUrlInViewer(blob_url, crx_url || zipname || blob_url, function (blob) {
            openCRXinViewer(crx_url, zipname, blob);
        }, function () {
            if (crx_url) {
                openCRXinViewer(crx_url, zipname);
            } else {
                var progressDiv = document.getElementById('initial-status');
                progressDiv.textContent = 'Cannot open ' + (zipname || blob_url);
                appendFileChooser();
            }
        });
        return;
    }
    if (crx_url && inside.length) {
        openEmbeddedZipFile(crx_url, inside, blob_url);
        return;
    }

    // Plain and simple: Open the CRX at the given URL.
    openCRXinViewer(crx_url, zipname);
}

function showAdvancedOpener() {
    var advancedOpenView = document.getElementById('advanced-open');
    var openForm = document.getElementById('advanced-open-form');
    var cwsOptions = document.getElementById('advanced-open-cws-extension');
    var amoOptions = document.getElementById('advanced-open-amo-extension');
    var urlInput = openForm.querySelector('input[type=url]');
    var fileInput = openForm.querySelector('input[type=file]');
    function getCwsOption(name) {
        var input = cwsOptions.querySelector('input[name="' + name + '"], select[name="' + name + '"]');
        if (!input) return '';
        if (input.tagName === 'SELECT' || input.type === 'text') {
            return input.value;
        }
        input = cwsOptions.querySelector('input[name="' + name + '"]:checked');
        return input ? input.value : '';
    }
    function setCwsOption(name, value) {
        var input = cwsOptions.querySelector('input[name="' + name + '"], select[name="' + name + '"]');
        if (!input) {
            console.warn('No element found for option ' + name + ', ignored.');
            return;
        }
        if (input.tagName === 'SELECT' || input.type === 'text') {
            input.value = value;
            return;
        }
        // Otherwise a radio element.
        var choice = cwsOptions.querySelector('input[name="' + name + '"][value="' + value + '"]');
        if (choice) {
            choice.checked = true;
        } else {
            console.warn('No element found for option ' + name + ' and value ' + value + ', fall back to first option');
            if (input) input.checked = true;
        }
    }
    function toCwsUrl() {  // Assuming that all inputs are valid.
        // See cws_pattern.js for an explanation of this URL.
        var url = 'https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3';
        url += '&os=' + getCwsOption('os');
        url += '&arch=' + getCwsOption('arch');
        url += '&os_arch=' + getCwsOption('arch');
        url += '&nacl_arch=' + getCwsOption('nacl_arch');
        url += '&prod=chromiumcrx';
        url += '&prodchannel=unknown';
        url += '&prodversion=' + getCwsOption('prodversion');
        url += '&acceptformat=crx2,crx3';
        url += '&x=id%3D' + getCwsOption('xid');
        url += '%26uc';
        return url;
    }
    function reorderForms(firefoxFirst) {
        var order = firefoxFirst ? [amoOptions, cwsOptions] : [cwsOptions, amoOptions];
        if (order[0].previousElementSibling === order[1]) {
            order[0].parentNode.insertBefore(order[0], order[1]);
        }
    }
    function maybeToggleWebStore() {
        var val = urlInput.value.trim();
        var extensionId = get_extensionID(val);
        if (!extensionId && /^[a-p]{32}$/.test(val)) {
            extensionId = val;
        }

        var amoslug = get_amo_slug(val);
        // Heuristic: if it looks like a GUID {..} or slug (no spaces, no dots, some length)
        if (!amoslug && val && !val.includes('/') && !val.includes(' ') && val.length > 3) {
            amoslug = val;
        }

        if (!val) {
            cwsOptions.classList.remove('disabled-site');
            amoOptions.classList.remove('disabled-site');
            return;
        }

        if (!extensionId) {
            cwsOptions.classList.add('disabled-site');
            if (amoslug) {
                amoOptions.querySelector('input[name="amoslugorid"]').value = amoslug;
                amoOptions.classList.remove('disabled-site');
            } else {
                amoOptions.classList.add('disabled-site');
            }
            reorderForms(!!amoslug);
            return;
        }
        function setOptionFromUrl(key) {
            var prev = getCwsOption(key);
            var next = getParam(key, val);
            if (next && prev !== next) {
                setCwsOption(key, next);
            }
        }
        cwsOptions.classList.remove('disabled-site');
        amoOptions.classList.add('disabled-site');
        reorderForms(false);
        setCwsOption('xid', extensionId);
        setOptionFromUrl('os');
        setOptionFromUrl('arch');
        setOptionFromUrl('nacl_arch');
        maybeSaveBack();
    }
    function maybeSaveBack() {
        var isExtensionId = /^[a-p]{32}$/.test(getCwsOption('xid'));
        cwsOptions.querySelector('.submit-if-valid').hidden = !isExtensionId;
        if (!isExtensionId) {
            return;
        }

        // Only synchronize if there is no information to be lost, e.g. if it is not a URL or
        // already a Chrome Web Store item.
        var crx_url = toCwsUrl();
        if (!/^https:?/.test(urlInput.value) || get_extensionID(urlInput.value)) {
            urlInput.value = crx_url;
        }
        cwsOptions.querySelector('.submit-if-valid a').href = get_webstore_url(crx_url);
    }
    function toggleForm(form, enable) {
        if (enable) {
            form.classList.add('focused-form');
        } else {
            form.classList.remove('focused-form');
        }
    }
    function closeViewAndOpenCrxUrl(crxUrl) {
        var url = location.pathname + '?' + encodeQueryString({
            crx: crxUrl,
        });
        advancedOpenView.classList.remove('visible');
        // This open dialog only appears at the start of the page, and there is
        // no data to lose, so we just replace the current URL.
        history.replaceState(history.state, null, url);
        initialize();
    }

    openForm.onsubmit = function (e) {
        e.preventDefault();
        if (!urlInput.value) {
            if (fileInput.files[0]) {
                // Navigate back in history or just reloaded page.
                fileInput.onchange();
            }
            return;
        }
        closeViewAndOpenCrxUrl(urlInput.value);
    };
    cwsOptions.onsubmit = function (e) {
        e.preventDefault();
        // Note: let's assume that the extension ID is valid, otherwise form validation would have
        // kicked in. This is not necessarily true in old browsers, but whatever.
        urlInput.value = toCwsUrl();
        openForm.onsubmit(e);
    };
    amoOptions.onsubmit = function (e) {
        e.preventDefault();
        // Derive the AMO domain from the URL input if non-empty, otherwise try the crx URL param.
        var amodomain = get_amo_domain(urlInput.value || getParam('crx'));
        var amodescription = amoOptions.querySelector('.amodescription');
        var slugorid = amoOptions.querySelector('input[name="amoslugorid"]').value;
        amodescription.textContent = 'Searching for add-ons with slug or ID: ' + slugorid;
        var amoxpilist = amoOptions.querySelector('.amoxpilist');
        getXpis(amodomain, slugorid, 0, function (description, results, nextPage) {
            amodescription.textContent = description;
            if (results.length) {
                var a = document.createElement('a');
                a.href = 'https://' + amodomain + '/addon/' + slugorid;
                a.textContent = 'add-on listing';
                amodescription.appendChild(document.createTextNode(' ('));
                amodescription.appendChild(a);
                amodescription.appendChild(document.createTextNode(')'));
            }
            amoxpilist.textContent = '';
            appendResults(results);
            if (nextPage) {
                showMoreResultsPager(nextPage);
            }
        });

        function appendResults(results) {
            var fragment = document.createDocumentFragment();
            results.forEach(function (result) {
                var a = document.createElement('a');
                a.textContent = 'Version ' + result.version + ' (' + result.platform + '), ' + result.createdDate.toLocaleString();
                a.href = location.pathname + '?' + encodeQueryString({
                    crx: result.url,
                });
                a.title = 'View source of ' + result.url;
                a.onclick = function (event) {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    closeViewAndOpenCrxUrl(result.url);
                };
                var li = document.createElement('li');
                li.appendChild(a);
                fragment.appendChild(li);
            });
            amoxpilist.appendChild(fragment);
        }
        function showMoreResultsPager(page) {
            var li = document.createElement('li');
            var button = document.createElement('button');
            button.textContent = 'Show more versions from page ' + page;
            button.onclick = function (e) {
                e.preventDefault();
                button.disabled = true;
                getXpis(amodomain, slugorid, page, function (description, results, nextPage) {
                    if (!results.length) {
                        // Odd. The button should only be shown if there are more items.
                        // There might be an intermittent (network) error,
                        // so allow the user to retry the same action.
                        button.disabled = false;
                        return;
                    }
                    appendResults(results);
                    if (nextPage) {
                        // Replace button with page separator.
                        li.textContent = 'Results from page ' + page + ':';
                        showMoreResultsPager(nextPage);
                    } else {
                        li.remove();
                    }
                });
            };
            li.appendChild(button);
            amoxpilist.appendChild(li);
        }
    };
    fileInput.onchange = function () {
        var file = fileInput.files[0];
        if (file) {
            advancedOpenView.classList.remove('visible');
            openCRXinViewer('', file.name, file);
        }
    };

    // --- Drag and Drop Logic ---
    var dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.style.borderColor = 'var(--primary)';
                dropZone.style.background = 'var(--primary-glow)';
                dropZone.style.color = 'var(--primary-bright)';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.style.borderColor = 'var(--border)';
                dropZone.style.background = 'transparent';
                dropZone.style.color = 'var(--text-muted)';
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            var dt = e.dataTransfer;
            var files = dt.files;
            if (files && files.length > 0) {
                advancedOpenView.classList.remove('visible');
                openCRXinViewer('', files[0].name, files[0]);
            }
        }, false);
    }

    // Global Drop Handler on Window
    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);

    window.addEventListener('drop', (e) => {
        if (e.target.closest('#advanced-open')) {
            // Let the specialized drop zone handle it if dropped inside the modal
            return;
        }
        var dt = e.dataTransfer;
        var files = dt.files;
        if (files && files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            advancedOpenView.classList.remove('visible');
            openCRXinViewer('', files[0].name, files[0]);
        }
    }, false);

    [].forEach.call(cwsOptions.querySelectorAll('input, select'), function (input) {
        // Sync back changes when radio / text / select input changes
        input.addEventListener('input', maybeSaveBack);
        input.addEventListener('change', maybeSaveBack);
        input.addEventListener('focus', toggleForm.bind(null, cwsOptions, true));
        input.addEventListener('blur', toggleForm.bind(null, cwsOptions, false));
    });
    [].forEach.call(amoOptions.querySelectorAll('input'), function (input) {
        input.addEventListener('focus', toggleForm.bind(null, amoOptions, true));
        input.addEventListener('blur', toggleForm.bind(null, amoOptions, false));
    });
    urlInput.addEventListener('input', maybeToggleWebStore);
    urlInput.value = getParam('crx') || '';

    // Render default webstore options.
    var platformInfo = getPlatformInfo();
    setCwsOption('os', platformInfo.os);
    setCwsOption('arch', platformInfo.arch);
    setCwsOption('nacl_arch', platformInfo.nacl_arch);
    var prodversion = /Chrome\/(\d+\.\d+\.\d+\.\d+)/.exec(navigator.userAgent);
    prodversion = prodversion ? prodversion[1] : '52.0.2743.116';
    setCwsOption('prodversion', prodversion);

    maybeToggleWebStore();

    advancedOpenView.classList.add('visible');
    // Autofocus the main input
    urlInput.focus();
}

// Calls callback(description, Array<{url:String, version:String, platform:String}>)
// If there are more results: The callback will include a third parameter with a non-zero page number to use.
// If called repeatedly: Will only call the callback of the last call.
function getXpis(amodomain, slugorid, page, callback) {
    var apiUrl = 'https://' + amodomain + '/api/v4/addons/addon/' + slugorid + '/versions/';
    // Have smaller response bodies by only including one language.
    apiUrl += '?lang=en-US';
    if (page) {
        apiUrl += '&page=' + page;
    } else {
        // When the page parameter is omitted, it defaults to 1.
        page = 1;
    }
    var x = new XMLHttpRequest();
    x.open('GET', apiUrl);
    x.onloadend = function () {
        if (getXpis._pendingXhr === x) {
            getXpis._pendingXhr = null;
        }

        if (x.status === 401 || x.status === 403) {
            callback('The results are not publicly available for: ' + slugorid, []);
            return;
        }
        if (x.status !== 200) {
            callback('No results found for: ' + slugorid, []);
            return;
        }
        var nextPage = 0;
        var totalVersions = 0;
        var results = [];
        try {
            var response = JSON.parse(x.responseText);
            response.results.forEach(function (res) {
                res.files.forEach(function (file) {
                    results.push({
                        url: file.url.replace(/\.xpi\?.*$/, '.xpi'),
                        version: res.version,
                        platform: file.platform,
                        createdDate: new Date(file.created),
                    });
                });
            });
            if (response.next) {
                nextPage = page + 1;
            }
            totalVersions = response.count;
        } catch (e) {
            console.error('Failed to parse response', e);
            callback('Unexpected response from add-ons server (' + e + ').', results);
            return;
        }
        if (nextPage) {
            callback('Found ' + totalVersions + ' results', results, nextPage);
            return;
        }
        callback('Found ' + results.length + ' recent results.', results);
    };
    if (getXpis._pendingXhr) {
        getXpis._pendingXhr.abort();
    }
    x.send();
    getXpis._pendingXhr = x;
}

function updateLoadingUI(msg, loaded, total) {
    const container = document.getElementById('loading-container');
    const msgElem = document.getElementById('loading-msg');
    const barElem = document.getElementById('loading-bar');
    const statsElem = document.getElementById('loading-stats');
    const heroActions = document.getElementById('hero-actions');

    if (!container) return;
    container.classList.remove('hidden');
    if (heroActions) heroActions.classList.add('hidden');

    if (msg) msgElem.textContent = msg;
    if (loaded !== undefined && total !== undefined && total > 0) {
        const percent = (loaded / total) * 100;
        barElem.style.width = percent + '%';
        statsElem.textContent = formatByteSize(loaded) + ' / ' + formatByteSize(total);
    } else if (loaded !== undefined) {
        barElem.style.width = '100.1%'; // Indeterminate look? Or just full
        statsElem.textContent = 'Loaded: ' + formatByteSize(loaded);
    }
}

function getFriendlyNameFromUrl(url) {
    if (!url) return '';
    if (url.length > 5 && url.indexOf('blob:') === 0) return 'Local File';

    // Check for Chrome Web Store Update URL
    if (url.includes('clients2.google.com') || url.includes('service/update2/crx')) {
        try {
            const decoded = decodeURIComponent(url);
            const idMatch = /x=id%3D([a-z0-p]{32})/i.exec(decoded) || /x=id=([a-z0-p]{32})/i.exec(decoded);
            if (idMatch) {
                return 'Extension ID: ' + idMatch[1];
            }
        } catch (e) { }
        return 'Chrome Web Store Package';
    }

    // Plain Extension ID check (32 chars a-p)
    if (/^[a-p]{32}$/.test(url)) return 'ID: ' + url;

    // Fallback: Filename from URL
    try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/');
        let lastPart = parts.pop();
        while (!lastPart && parts.length > 0) lastPart = parts.pop();
        if (lastPart) {
            // Remove common extensions from display if desired, or keep them
            if (lastPart.length > 40) return lastPart.substring(0, 37) + '...';
            return lastPart;
        }
    } catch (e) { }

    // Ultimate fallback
    if (url.length > 50) return url.substring(0, 47) + '...';
    return url;
}

function openEmbeddedZipFile(crx_url, inside, blob_url) {
    var progressDiv = document.getElementById('initial-status');
    progressDiv.hidden = false;

    var zipname = inside[inside.length - 1];

    loadCachedUrlInViewer(blob_url, zipname, function (blob) {
        openCRXinViewer(crx_url, zipname, blob);
    }, function () {
        updateLoadingUI('Loading ' + zipname);
        loadUrlInViewer(crx_url, function (blob) {
            peekIntoZipUntilEnd(0, blob);
        });
    });

    function peekIntoZipUntilEnd(index, blob) {
        var human_readable_name = inside.slice(0, index + 1).reverse().join(' in ') + ' from ' + crx_url;
        var zipname = inside[index];

        zip.createReader(new zip.BlobReader(blob), function (zipReader) {
            zipReader.getEntries(function (entries) {
                var entry = entries.filter(function (entry) {
                    return entry.filename === zipname;
                })[0];
                if (!entry) {
                    updateLoadingUI('Cannot open (did not find) ' + human_readable_name);
                    zipReader.close();
                    return;
                }
                entry.getData(new zip.BlobWriter(), function (blob) {
                    zipReader.close();
                    if (++index < inside.length) {
                        peekIntoZipUntilEnd(index, blob);
                    } else {
                        openCRXinViewer(crx_url, zipname, blob);
                    }
                }, function () {
                    updateLoadingUI('Cannot read ' + human_readable_name);
                    zipReader.close();
                });
            });
        }, function (error) {
            updateLoadingUI('Cannot open ' + human_readable_name + ' as a zip file: ' + error);
        });
    }
}

function appendFileChooser() {
    var progressDiv = document.getElementById('initial-status');
    progressDiv.hidden = false;
    progressDiv.insertAdjacentHTML('beforeend',
        '<br><br>' +
        'Visit the Chrome Web Store, Opera\'s or Firefox\'s add-on gallery<br>' +
        'and click on the CRX button to view its source.' +
        '<br><br>Or select a .crx/.nex/.xpi/.zip file:' +
        '<br><br>');
    var fileChooser = document.createElement('input');
    fileChooser.type = 'file';
    fileChooser.onchange = function () {
        var file = fileChooser.files[0];
        if (file) openCRXinViewer('', file.name, file);
    };
    progressDiv.appendChild(fileChooser);

    progressDiv.insertAdjacentHTML('beforeend',
        '<br><br>' +
        'Or <a class="open-different-url">click here to find and open</a> a different URL.'
    );
    var openDifferentAnchor = progressDiv.querySelector('.open-different-url');
    openDifferentAnchor.href = 'explorer.html';
    var crx_url = window.crx_url || getParam('crx');
    if (crx_url) {
        openDifferentAnchor.search = '?' + encodeQueryString({
            noview: 'on',
            crx: crx_url,
        });
    }
    openDifferentAnchor.onclick = function (event) {
        if (event.button !== 0) return;
        event.preventDefault();
        showAdvancedOpener();
    };
}

// crx_url: full URL to CRX file, may be an empty string.
// zipname: Preferred file name.
// crx_blob: Blob of the zip file.
// One (or both) of crx_url or crx_blob must be set.
function openCRXinViewer(crx_url, zipname, crx_blob) {
    // Now we have fixed the crx_url, update the global var.
    window.crx_url = crx_url;
    zipname = get_zip_name(crx_url, zipname);

    // We are switching from the initial view (selecting an extenzion/zip)
    // to the next view (showing the contents of the extension/zip file).
    // Show a link to open CodeLens Explorer, prepopulated with the current
    // settings to allow the user to modify one bit of the download.
    setCrxViewerLink(crx_url);

    if (crx_blob) {
        if (crx_url && is_not_crx_url(crx_url)) {
            handleBlob(zipname, crx_blob, null, null);
            return;
        }
        loadBlobInViewer(crx_blob, crx_url || zipname, function (blob, publicKey, raw_crx_data) {
            handleBlob(zipname, blob, publicKey, raw_crx_data);
        });
        return;
    }
    loadUrlInViewer(crx_url, function (blob, publicKey, raw_crx_data) {
        handleBlob(zipname, blob, publicKey, raw_crx_data);
    });
}

function loadCachedUrlInViewer(blob_url, human_readable_name, onHasBlob, onHasNoBlob) {
    if (!/^blob:/.test(blob_url)) {
        onHasNoBlob();
        return;
    }
    loadNonCrxUrlInViewer(blob_url, human_readable_name, onHasBlob, onHasNoBlob);
}

function loadNonCrxUrlInViewer(url, human_readable_name, onHasBlob, onHasNoBlob) {
    updateLoadingUI('Loading ' + getFriendlyNameFromUrl(human_readable_name));

    var requestUrl = get_equivalent_download_url(url);
    try {
        var x = new XMLHttpRequest();
        x.open('GET', requestUrl);
        x.responseType = 'blob';
        x.onerror = function () {
            onHasNoBlob('Network error for ' + url);
        };
        x.onload = function () {
            if (x.status >= 400) {
                onHasNoBlob('Failed to load ' + url + '. Server responded with ' + x.status + ' ' + x.statusText);
            } else if (x.response && x.response.size) {
                onHasBlob(x.response);
            } else {
                onHasNoBlob('No response received for ' + url);
            }
        };
        x.send();
    } catch (e) {
        onHasNoBlob('The browser refused to load ' + url + ', ' + e);
    }
}

function loadBlobInViewer(crx_blob, human_readable_name, onHasBlob) {
    var progressDiv = document.getElementById('initial-status');
    updateLoadingUI('Loading ' + getFriendlyNameFromUrl(human_readable_name));

    openCRXasZip(crx_blob, onHasBlob, function (error_message) {
        progressDiv.textContent = error_message;
        appendFileChooser();
    });
}

function loadUrlInViewer(crx_url, onHasBlob) {
    var progressDiv = document.getElementById('initial-status');
    updateLoadingUI('Loading ' + getFriendlyNameFromUrl(crx_url));

    if (is_not_crx_url(crx_url)) {
        // If it is certainly not expected to be a CRX, don't try to load as a CRX.
        // Otherwise the user may be confused if they see CRX-specific errors.
        loadNonCrxUrlInViewer(crx_url, crx_url, onHasBlob, function (err) {
            progressDiv.textContent = err;
            appendFileChooser();
            maybeShowPermissionRequest();
        });
        return;
    }

    openCRXasZip(crx_url, onHasBlob, function (error_message) {
        progressDiv.textContent = error_message;
        appendFileChooser();
        maybeShowPermissionRequest();
    }, progressEventHandler);

    function maybeShowPermissionRequest() {
        var permission = {
            origins: ['*://*/*']
        };
        chrome.permissions.contains(permission, function (hasAccess) {
            if (hasAccess) return;
            var grantAccess = document.createElement('button');
            var checkAccessOnClick = function () {
                chrome.permissions.request(permission, function (hasAccess) {
                    if (!hasAccess) return;
                    if (grantAccess.parentNode) {
                        grantAccess.parentNode.removeChild(grantAccess);
                    }
                    loadUrlInViewer(crx_url, onHasBlob);
                });
            };
            grantAccess.onclick = checkAccessOnClick;
            progressDiv.insertAdjacentHTML('beforeend', '<br><br>' +
                'To view this extension\'s source, an extra permission is needed.<br>' +
                'This permission can be revoked at any time at the ' +
                '<a href="/options.html" target="_blank">options page</a>.<br><br>'
            );
            grantAccess.textContent = 'Add permission';
            progressDiv.appendChild(grantAccess);
        });
    }
    function progressEventHandler(xhrProgressEvent) {
        if (xhrProgressEvent.lengthComputable) {
            updateLoadingUI('Loading ' + getFriendlyNameFromUrl(crx_url), xhrProgressEvent.loaded, xhrProgressEvent.total);
        } else {
            updateLoadingUI('Loading ' + getFriendlyNameFromUrl(crx_url), xhrProgressEvent.loaded);
        }
    }
}

function handleBlob(zipname, blob, publicKey, raw_crx_data) {
    var progressDiv = document.getElementById('initial-status');
    progressDiv.hidden = true;

    setBlobAsDownload(zipname, blob);
    setRawPackageAsDownload(zipname, raw_crx_data);
    if (publicKey || raw_crx_data) {
        setPublicKey(publicKey);
        crx_public_key = publicKey;
    } else {
        crx_public_key = null;
    }
    textSearchEngine = new TextSearchEngine(blob);

    zip.createReader(new zip.BlobReader(blob), function (zipReader) {
        renderPanelResizer();
        zipReader.getEntries(handleZipEntries);
    }, function (error) {
        progressDiv.textContent = 'Cannot open ' + (zipname || ' this file') + ' as a zip file: ' + error;
        appendFileChooser();
    });
}

if (typeof URL === 'undefined') window.URL = window.webkitURL;
function setCrxViewerLink(crx_url) {
    var viewerUrl = 'explorer.html';

    if (crx_url) {
        viewerUrl += '?' + encodeQueryString({
            noview: 'on',
            crx: crx_url,
        });
    }

    var link = document.getElementById('open-explorer');
    if (!link) return;
    link.href = viewerUrl;
    link.title = 'Open a new analysis task';
    link.onclick = function (e) {
        if (e.ctrlKey || e.metaKey || e.button !== 0) return;
        e.preventDefault();
        document.getElementById('advanced-open').classList.add('visible');
    };

}
function setBlobAsDownload(zipname, blob) {
    var dl_link = document.getElementById('download-link');
    if (!dl_link) return;
    var url = URL.createObjectURL(blob);
    dl_link.href = url;
    dl_link.setAttribute('data-original-href', url);
    dl_link.download = zipname;
    dl_link.title = 'Download zip file as ' + zipname + ' (' + formatByteSize(blob.size) + ' bytes)';
}
function setRawPackageAsDownload(zipname, arraybuffer) {
    var dl_link = document.getElementById('download-link-package');
    if (!dl_link) return;

    if (!arraybuffer) {
        // Not a CRX/XPI file.
        dl_link.hidden = true;
        return;
    }

    // Always ensure it's visible if we have data
    dl_link.hidden = false;

    // Use application/octet-stream to prevent Chromium from trying to install the extension.
    var blob = new Blob([arraybuffer], { type: 'application/octet-stream' });
    dl_link.href = URL.createObjectURL(blob);

    var isXpi = is_not_crx_url(window.crx_url);
    var packagename = zipname.replace(/\.zip$/i, isXpi ? '.xpi' : '.crx');
    dl_link.download = packagename;
    dl_link.title = 'Download original package as ' + packagename;
    dl_link.textContent = 'Download ' + (isXpi ? 'XPI' : 'CRX');
}
function setPublicKey(publicKey) {
    if (!publicKey) {
        console.warn('Public key not found, cannot generate "key" or extension ID.');
        return;
    }
    console.log('Public key (paste into manifest.json to preserve extension ID)');
    console.log('"key": "' + publicKey + '",');

    var extensionId = publicKeyToExtensionId(publicKey);
    console.log('Calculated extension ID: ' + extensionId);
}
function publicKeyToExtensionId(base64encodedKey) {
    var key = atob(base64encodedKey);
    var sha256sum = CryptoJS.SHA256(CryptoJS.enc.Latin1.parse(key)).toString();
    var extensionId = '';
    var ord_a = 'a'.charCodeAt(0);
    for (var i = 0; i < 32; ++i) {
        extensionId += String.fromCharCode(parseInt(sha256sum[i], 16) + ord_a);
    }
    return extensionId;
}

// --- Command Palette Logic ---
(function () {
    let allFiles = [];
    let selectedIndex = -1;
    const modal = document.getElementById('command-palette');
    const input = document.getElementById('command-input');
    const results = document.getElementById('command-results');
    const totalFilesLabel = document.getElementById('command-total-files');
    const hint = document.getElementById('top-bar-search-hint');

    window.indexFilesForCommandPalette = function (entries) {
        allFiles = entries.map(e => ({
            name: e.filename.split('/').pop(),
            path: e.filename,
            entry: e
        }));
        if (totalFilesLabel) totalFilesLabel.textContent = allFiles.length + ' files indexed';
    };

    function showPalette() {
        if (!modal) return;
        modal.classList.remove('hidden');
        input.value = '';
        input.focus();
        renderResults('');
    }

    function hidePalette() {
        if (!modal) return;
        modal.classList.add('hidden');
    }

    function renderResults(query) {
        results.innerHTML = '';
        const filtered = allFiles.filter(f =>
            f.path.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 15);

        filtered.forEach((f, i) => {
            const div = document.createElement('div');
            div.className = 'command-result' + (i === 0 ? ' selected' : '');
            div.innerHTML = `
                <div class="command-result-icon">📄</div>
                <div>
                    <div class="file-name">${f.name}</div>
                    <div class="file-path">${f.path}</div>
                </div>
            `;
            div.onclick = () => openFile(f);
            results.appendChild(div);
        });
        selectedIndex = filtered.length > 0 ? 0 : -1;
    }

    function openFile(file) {
        const li = document.querySelector(`li[data-filename="${file.path}"]`);
        if (li) li.click();
        hidePalette();
    }

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            showPalette();
        }
        if (e.key === 'Escape') hidePalette();

        if (!modal.classList.contains('hidden')) {
            const resItems = results.querySelectorAll('.command-result');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % resItems.length;
                updateSelection(resItems);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + resItems.length) % resItems.length;
                updateSelection(resItems);
            } else if (e.key === 'Enter' && selectedIndex !== -1) {
                e.preventDefault();
                const selectedPath = resItems[selectedIndex].querySelector('.file-path').textContent;
                const file = allFiles.find(f => f.path === selectedPath);
                if (file) openFile(file);
            }
        }
    });

    function updateSelection(items) {
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === selectedIndex);
            if (i === selectedIndex) item.scrollIntoView({ block: 'nearest' });
        });
    }

    if (input) {
        input.oninput = () => renderResults(input.value);
    }

    const closePaletteBtn = document.getElementById('close-command-palette');
    if (closePaletteBtn) {
        closePaletteBtn.onclick = hidePalette;
    }

    if (hint) {
        hint.onclick = showPalette;
    }

    window.onclick = (e) => { if (e.target === modal) hidePalette(); };
})();
// --- End Command Palette ---

// --- Global UI Logic ---
(function () {
    window.addEventListener('DOMContentLoaded', () => {
        const closeAnalysisBtn = document.getElementById('close-analysis-btn');
        if (closeAnalysisBtn) {
            closeAnalysisBtn.onclick = () => {
                const url = new URL(location.href);
                url.search = '';
                history.replaceState(null, '', url.pathname);
                location.reload(); // Simplest way to clear all state and return to welcome
            };
        }
    });

    const originalPopulate = window.populateDashboard;
    window.populateDashboard = function (manifest, entries) {
        const btn = document.getElementById('close-analysis-btn');
        if (btn) btn.classList.remove('hidden');
        if (originalPopulate) originalPopulate(manifest, entries);

        // Dispatch event for history saving
        window.dispatchEvent(new CustomEvent('save-history', { detail: { manifest, entries } }));
    };
})();
// --- End Global UI ---
// --- Recently Inspected Logic ---
(function () {
    const STORAGE_KEY = 'codelens-recent-history';
    const MAX_ITEMS = 6;

    function saveToHistory(manifest, entries) {
        const url = window.crx_url;
        if (!url) return;

        let name = manifest.name || manifest.short_name;
        if (!name || name.startsWith('__MSG_')) {
            // Fallback strategy for localized names without locale loader
            if (manifest.short_name && !manifest.short_name.startsWith('__MSG_')) {
                name = manifest.short_name;
            } else {
                // Use filename/ID if absolutely nothing else
                name = getFriendlyNameFromUrl(url).replace('Extension ID: ', '') || 'Unknown Extension';
            }
        }

        let iconData = 'icons/icon-128.png';
        const icons = manifest.icons || (manifest.action && manifest.action.default_icon) || (manifest.browser_action && manifest.browser_action.default_icon);
        if (icons) {
            let iconPath = '';
            if (typeof icons === 'string') iconPath = icons;
            else {
                const sizes = Object.keys(icons).sort((a, b) => b - a);
                if (sizes.length > 0) iconPath = icons[sizes[0]];
            }

            if (iconPath) {
                const entry = entries.find(e => e.filename.endsWith(iconPath.replace(/^\//, '')));
                if (entry) {
                    entry.getData(new zip.Data64URIWriter(), function (dataUrl) {
                        finalizeSave(url, name, dataUrl);
                    });
                    return;
                }
            }
        }
        finalizeSave(url, name, iconData);
    }

    function finalizeSave(url, name, icon) {
        let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        history = history.filter(item => item.url !== url);
        history.unshift({ url, name, icon, date: Date.now() });
        history = history.slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function renderHistory() {
        const container = document.getElementById('recent-inspected-container');
        const list = document.getElementById('recent-list');
        if (!list || !container) return;

        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (history.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        list.innerHTML = '';
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'recent-item';
            div.innerHTML = `
                <div class="recent-item-icon"><img src="${item.icon}"></div>
                <div class="recent-item-info">
                    <span class="recent-item-name" title="${getFriendlyNameFromUrl(item.url)}">${item.name}</span>
                </div>
            `;
            div.onclick = () => {
                const newUrl = location.pathname + '?' + encodeQueryString({ crx: item.url });
                location.href = newUrl;
            };
            list.appendChild(div);
        });
    }

    window.updateRecentHistory = saveToHistory;

    window.addEventListener('DOMContentLoaded', () => {
        renderHistory();
        const clearBtn = document.getElementById('clear-recent');
        if (clearBtn) {
            clearBtn.onclick = () => {
                localStorage.removeItem(STORAGE_KEY);
                renderHistory();
            };
        }
    });

    window.addEventListener('save-history', (e) => {
        if (e.detail && e.detail.manifest) {
            saveToHistory(e.detail.manifest, e.detail.entries);
            renderHistory();
        }
    });
})();
// --- End Recently Inspected ---
