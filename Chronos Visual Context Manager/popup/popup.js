// Chronos Ultima - Premium Logic Layer
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Registry
    const projectsGrid = document.getElementById('projectsGrid');
    const snippetsList = document.getElementById('snippetsList');
    const tabCountEl = document.getElementById('tabCount');
    const totalSnippetsEl = document.getElementById('totalSnippetsCount');
    const snapshotBtn = document.getElementById('snapshotBtn');
    const newProjectBtn = document.getElementById('newProjectBtn');
    const globalSearch = document.getElementById('globalSearch');
    const focusTimer = document.getElementById('focusTimer');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerToggle = document.getElementById('timerToggle');
    const themeToggle = document.getElementById('themeToggle');
    const backupBtn = document.getElementById('backupBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const showArchivedBtn = document.getElementById('showArchivedBtn');
    const greetingText = document.getElementById('greetingText');
    const currentDate = document.getElementById('currentDate');

    let currentSearchQuery = '';
    let timerInterval = null;
    let timeLeft = 25 * 60;
    let showArchived = false;

    // --- INITIALIZATION ---
    const initApp = () => {
        updateTabCount();
        updateDateTime();
        setGreeting();
        updateUI();
        loadTheme();
        checkActiveTimer();
    };

    const updateDateTime = () => {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        currentDate.textContent = new Date().toLocaleDateString('en-US', options);
    };

    const setGreeting = () => {
        const hour = new Date().getHours();
        let greet = "Welcome Back";
        if (hour < 12) greet = "Good Morning";
        else if (hour < 18) greet = "Good Afternoon";
        else greet = "Good Evening";
        greetingText.textContent = `${greet}, Researcher`;
    };

    const updateTabCount = () => {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            tabCountEl.textContent = tabs.length;
        });
    };

    // --- THEME ---
    const loadTheme = () => {
        chrome.storage.local.get(['lightMode'], (res) => {
            if (res.lightMode) document.documentElement.classList.add('light-mode');
            updateThemeIcon(res.lightMode);
        });
    };

    const updateThemeIcon = (isLight) => {
        const themeIcon = document.getElementById('themeIcon');
        if (isLight) {
            themeIcon.innerHTML = `<path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" />`;
        } else {
            themeIcon.innerHTML = `<path fill="currentColor" d="M12,18C15.31,18 18,15.31 18,12C18,8.69 15.31,6 12,6C8.69,6 6,8.69 6,12C6,15.31 8.69,18 12,18M12,20V22H14V20H12M12,2V4H14V2H12M20,11V13H22V11H20M2,11V13H4V11H2M17.66,16.24L19.07,17.66L20.48,16.24L19.07,14.83L17.66,16.24M5,16.24L6.41,17.66L7.83,16.24L6.41,14.83L5,16.24M17.66,6.34L19.07,4.93L20.48,6.34L19.07,7.76L17.66,6.34M5,6.34L6.41,4.93L7.83,6.34L6.41,7.76L5,6.34Z" />`;
        }
    };

    themeToggle.onclick = () => {
        const isLight = document.documentElement.classList.toggle('light-mode');
        chrome.storage.local.set({ lightMode: isLight });
        updateThemeIcon(isLight);
    };

    // --- TIMER ---
    const updateTimerDisplay = () => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        chrome.action.setBadgeText({ text: mins > 0 ? mins.toString() : "" });
    };

    const stopTimer = () => {
        clearInterval(timerInterval);
        timerInterval = null;
        focusTimer.classList.add('hidden');
        chrome.storage.local.set({ timerActive: false });
        chrome.action.setBadgeText({ text: "" });
        document.getElementById('timerIcon').innerHTML = `<path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />`;
    };

    const startTimer = (seconds) => {
        timeLeft = seconds;
        focusTimer.classList.remove('hidden');
        const endTime = Date.now() + (timeLeft * 1000);
        chrome.storage.local.set({ timerActive: true, timerEndTime: endTime });
        document.getElementById('timerIcon').innerHTML = `<path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" />`;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                stopTimer();
                new Notification("Context Focus Complete", { body: "Your focus session has ended. Time to shift context." });
            }
        }, 1000);
    };

    const checkActiveTimer = () => {
        chrome.storage.local.get(['timerActive', 'timerEndTime'], (res) => {
            if (res.timerActive && res.timerEndTime > Date.now()) {
                startTimer(Math.round((res.timerEndTime - Date.now()) / 1000));
            }
        });
    };

    timerToggle.onclick = () => {
        if (timerInterval) stopTimer();
        else startTimer(25 * 60);
    };

    // --- SEARCH ---
    globalSearch.oninput = (e) => {
        currentSearchQuery = e.target.value.toLowerCase();
        updateUI();
    };

    // --- CORE LOGIC ---
    function updateUI() {
        chrome.storage.local.get(['projects'], (res) => {
            const projects = res.projects || [];

            // Total snippets count
            const totalSnips = projects.reduce((acc, p) => acc + (p.snippets?.length || 0), 0);
            totalSnippetsEl.textContent = totalSnips;

            // Project filtering
            const filtered = projects.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(currentSearchQuery) ||
                    p.tabs.some(t => t.title.toLowerCase().includes(currentSearchQuery)) ||
                    p.tags?.some(tag => tag.toLowerCase().includes(currentSearchQuery));
                const matchesArchive = showArchived ? p.archived : !p.archived;
                return matchesSearch && matchesArchive;
            });

            renderProjects(filtered);
            renderSnippets(projects);
        });
    }

    function renderProjects(projects) {
        if (projects.length === 0) {
            projectsGrid.innerHTML = `
                <div class="empty">
                    <img src="../assets/empty_state.png" style="width: 80px; opacity: 0.5; margin-bottom: 1rem;">
                    <p>No projects found in this dimension.</p>
                </div>`;
            return;
        }

        projects.sort((a, b) => (b.pinned - a.pinned) || (b.timestamp - a.timestamp));
        projectsGrid.innerHTML = '';

        projects.forEach(p => {
            const card = document.createElement('div');
            card.className = `p-card ${p.pinned ? 'pinned' : ''}`;
            card.innerHTML = `
                <div class="quick-pin ${p.pinned ? 'active' : ''}">
                    <svg style="width:14px;height:14px" viewBox="0 0 24 24"><path fill="currentColor" d="M16,12V4H17V2H7V4H8V12L6,14V16H11V22H13V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" /></svg>
                </div>
                <h4>${p.name}</h4>
                <div class="p-meta">${p.tabs.length} Tabs • ${p.snippets?.length || 0} Snippets</div>
                <div class="tag-cloud">${(p.tags || []).map(t => `<span class="small-tag">${t}</span>`).join('')}</div>
            `;

            card.querySelector('.quick-pin').onclick = (e) => {
                e.stopPropagation();
                toggleProjectProp(p.id, 'pinned');
            };

            card.onclick = () => openProject(p);
            projectsGrid.appendChild(card);
        });
    }

    function renderSnippets(projects) {
        let all = projects.flatMap(p => (p.snippets || []).map(s => ({ ...s, pName: p.name })));
        if (currentSearchQuery) all = all.filter(s => s.content.toLowerCase().includes(currentSearchQuery) || s.pName.toLowerCase().includes(currentSearchQuery));
        all.sort((a, b) => b.timestamp - a.timestamp);

        if (all.length === 0) { snippetsList.innerHTML = '<div class="empty">Knowledge base clear.</div>'; return; }

        snippetsList.innerHTML = '';
        all.slice(0, 8).forEach(s => {
            const div = document.createElement('div');
            div.className = 'k-item';
            div.innerHTML = `
                <div style="flex:1">
                    <div class="k-proj">${s.pName}</div>
                    <div class="k-content">${s.type === 'text' ? s.content : `<img src="${s.content}" style="max-width:100%; border-radius:8px; margin-top:8px;">`}</div>
                </div>
            `;
            snippetsList.appendChild(div);
        });
    }

    const toggleProjectProp = (id, prop) => {
        chrome.storage.local.get(['projects'], (res) => {
            const projects = res.projects || [];
            const p = projects.find(item => item.id === id);
            if (p) { p[prop] = !p[prop]; chrome.storage.local.set({ projects }, updateUI); }
        });
    };

    // --- MODAL SYSTEM ---
    const openProject = (p) => {
        // Set as active for background script
        chrome.storage.local.set({ activeProjectId: p.id });

        const modal = document.getElementById('projectModal');
        const list = document.getElementById('projectItemsList');
        const name = document.getElementById('modalProjectName');
        const meta = document.getElementById('modalMeta');

        name.textContent = p.name;
        meta.textContent = `${p.tabs.length} items cataloged • ${new Date(p.timestamp).toLocaleDateString()}`;
        list.innerHTML = '';
        modal.classList.add('open');

        // Modal Button Registry
        const deleteBtn = document.getElementById('deleteProjectBtn');
        const groupBtn = document.getElementById('groupBtn');
        const archiveBtn = document.getElementById('archiveBtn');
        const exportBtn = document.getElementById('exportBtn');

        archiveBtn.classList.toggle('active', p.archived);
        archiveBtn.onclick = () => {
            toggleProjectProp(p.id, 'archived');
            modal.classList.remove('open');
        };

        groupBtn.onclick = async () => {
            const tabIds = [];
            for (const t of p.tabs) { const ct = await chrome.tabs.create({ url: t.url, active: false }); tabIds.push(ct.id); }
            if (tabIds.length) {
                const gid = await chrome.tabs.group({ tabIds });
                chrome.tabGroups.update(gid, { title: p.name, color: 'blue' });
            }
        };

        deleteBtn.onclick = () => {
            if (confirm("Permanently erase this intelligence context?")) {
                chrome.storage.local.get(['projects'], (res) => {
                    const projects = res.projects.filter(item => item.id !== p.id);
                    chrome.storage.local.set({ projects }, () => { modal.classList.remove('open'); updateUI(); });
                });
            }
        };

        exportBtn.onclick = () => {
            let md = `# intelligence_report: ${p.name}\n\n`;
            p.tabs.forEach(t => md += `- [${t.title}](${t.url})\n`);
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${p.name}_Index.md`;
            a.click();
        };

        // Render project items (tabs)
        p.tabs.forEach((t, i) => {
            const div = document.createElement('div');
            div.className = 'k-item';
            div.style.cursor = 'pointer';
            div.innerHTML = `
                <div class="tab-launcher" style="flex:1">
                    <div style="font-size:0.9rem; font-weight:600; margin-bottom:4px;">${t.title}</div>
                    <div style="color:var(--text-mid); font-size:0.75rem;">${new URL(t.url).hostname}</div>
                </div>
                <div class="rating-strip" style="display:flex; gap:2px;">
                    ${[1, 2, 3, 4, 5].map(s => `<span class="star-node" data-idx="${s}" style="color:${s <= (t.rating || 0) ? 'var(--primary-alt)' : 'var(--text-low)'}">★</span>`).join('')}
                </div>
            `;

            div.querySelector('.tab-launcher').onclick = () => chrome.tabs.create({ url: t.url });

            div.querySelectorAll('.star-node').forEach(star => {
                star.onclick = () => {
                    const rating = parseInt(star.dataset.idx);
                    chrome.storage.local.get(['projects'], (res) => {
                        const projects = res.projects || [];
                        const proj = projects.find(item => item.id === p.id);
                        if (proj && proj.tabs[i]) {
                            proj.tabs[i].rating = rating;
                            chrome.storage.local.set({ projects }, () => openProject(proj));
                        }
                    });
                };
            });
            list.appendChild(div);
        });
    };

    // --- ACTIONS ---
    snapshotBtn.onclick = () => {
        const defaultName = `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const name = prompt("Intelligence Session ID:", defaultName);
        if (name) {
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                const snap = tabs.map(t => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl }));
                saveProject(name, snap);
            });
        }
    };

    newProjectBtn.onclick = () => {
        const name = prompt("New Workspace Identity:");
        if (name) saveProject(name, []);
    };

    async function saveProject(name, tabs) {
        const tagS = prompt("Assign memory tags (comma separated):", "");
        const tags = tagS ? tagS.split(',').map(t => t.trim()).filter(t => t) : [];
        chrome.storage.local.get(['projects'], (res) => {
            const projects = res.projects || [];
            const newP = { id: Date.now().toString(), name, tabs, tags, archived: false, pinned: false, timestamp: Date.now(), snippets: [] };
            projects.unshift(newP);
            chrome.storage.local.set({ projects }, () => { updateUI(); updateTabCount(); });
        });
    }

    showArchivedBtn.onclick = () => {
        showArchived = !showArchived;
        showArchivedBtn.classList.toggle('active', showArchived);
        updateUI();
    };

    backupBtn.onclick = () => {
        chrome.storage.local.get(['projects'], (res) => {
            const data = JSON.stringify(res.projects || [], null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            a.download = `Chronos_Intelligence_Snapshot.json`;
            a.click();
        });
    };

    importBtn.onclick = () => importFile.click();
    importFile.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const projs = JSON.parse(ev.target.result);
                if (Array.isArray(projs)) chrome.storage.local.set({ projects: projs }, updateUI);
            } catch (err) { alert("Data corruption detected."); }
        };
        reader.readAsText(file);
    };

    document.getElementById('closeModal').onclick = () => document.getElementById('projectModal').classList.remove('open');
    document.querySelector('.modal-backdrop').onclick = () => document.getElementById('projectModal').classList.remove('open');

    // Run Initialization
    initApp();
});
