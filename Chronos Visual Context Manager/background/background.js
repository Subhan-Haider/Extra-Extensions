// Chronos Ultima - Background Nexus with Secure Injection
const DEFAULT_SETTINGS = {
  darkMode: true,
  autoArchive: false,
  soundEffects: true
};

// --- INITIALIZATION ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['projects', 'settings'], (result) => {
    if (!result.projects) chrome.storage.local.set({ projects: [] });
    if (!result.settings) chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  });

  chrome.contextMenus.create({
    id: "chronos-save",
    title: "Capture to Chronos Memory",
    contexts: ["selection", "image", "page"]
  });
});

// --- SHORTCUTS & COMMANDS ---
chrome.commands.onCommand.addListener((command) => {
  if (command === "quick-save-page") {
    captureCurrentPage();
  }
});

function captureCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;
    saveSnippet('text', tab.title + ' - ' + tab.url, tab.url, 'Page Bookmark');
  });
}

// --- CONTEXT MENU HANDLER ---
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "chronos-save") {
    const type = info.selectionText ? 'text' : (info.mediaType === 'image' ? 'image' : 'page');
    const content = info.selectionText || info.srcUrl || tab.title;
    const projectHint = type === 'page' ? 'Bookmarks' : null;

    saveSnippet(type, content, tab.url, projectHint);
  }
});

// --- CORE SAVING LOGIC ---
function saveSnippet(type, content, sourceUrl, forceProjectName = null) {
  chrome.storage.local.get(['activeProjectId', 'projects'], (result) => {
    let projects = result.projects || [];
    let targetProject = null;

    // 1. Try Active Project
    if (result.activeProjectId) {
      targetProject = projects.find(p => p.id === result.activeProjectId);
    }

    // 2. Fallback to most recent unarchived project
    if (!targetProject) {
      targetProject = projects.find(p => !p.archived);
    }

    // 3. Fallback to ANY project
    if (!targetProject && projects.length > 0) {
      targetProject = projects[0];
    }

    // 4. Create "Inbox" if absolutely nothing exists
    if (!targetProject) {
      targetProject = {
        id: Date.now().toString(),
        name: "Inbox",
        tabs: [],
        tags: ["auto-generated"],
        archived: false,
        pinned: false,
        timestamp: Date.now(),
        snippets: []
      };
      projects.unshift(targetProject);
    }

    // Add Snippet
    const snippet = {
      id: Date.now().toString(),
      type: type,
      content: content,
      sourceUrl: sourceUrl,
      timestamp: Date.now()
    };

    // Ensure snippets array exists
    if (!targetProject.snippets) targetProject.snippets = [];
    targetProject.snippets.unshift(snippet);

    // Update timestamp to bubble project to top
    targetProject.timestamp = Date.now();

    // Save and Notify
    chrome.storage.local.set({ projects }, () => {
      // Securely inject notification instead of relying on content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          const typeCap = type.charAt(0).toUpperCase() + type.slice(1);
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: showNotification,
            args: [targetProject.name, typeCap]
          }).catch(err => console.warn("Cannot inject on this page:", err));
        }
      });
    });
  });
}

// --- INJECTABLE TOAST FUNCTION ---
// This function runs INSIDE the webpage
function showNotification(projectName, type) {
  // Prevent duplicate toasts
  const existing = document.getElementById('chronos-toast-container');
  if (existing) existing.remove();

  // Create container
  const container = document.createElement('div');
  container.id = 'chronos-toast-container';

  // Shadow DOM for isolation
  const shadow = container.attachShadow({ mode: 'open' });

  // Inject styles (Ultima Theme)
  const style = document.createElement('style');
  style.textContent = `
        :host {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            pointer-events: none;
        }
        
        .toast {
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-left: 3px solid #6366f1;
            padding: 16px 20px;
            border-radius: 16px;
            color: #f8fafc;
            display: flex;
            align-items: center;
            gap: 14px;
            box-shadow: 
                0 20px 25px -5px rgba(0, 0, 0, 0.4), 
                0 0 0 1px rgba(99, 102, 241, 0.3);
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            min-width: 280px;
        }

        .toast.visible {
            transform: translateY(0);
            opacity: 1;
        }

        .icon-box {
            background: linear-gradient(135deg, #6366f1, #06b6d4);
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
        }

        .content {
            flex: 1;
        }

        .title {
            font-size: 13px;
            font-weight: 700;
            color: #818cf8;
            margin-bottom: 2px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        .message {
            font-size: 14px;
            color: #e2e8f0;
            line-height: 1.4;
            font-weight: 500;
        }
    `;
  shadow.appendChild(style);

  // Toast Structure
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
        <div class="icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
        <div class="content">
            <div class="title">Chronos Memory</div>
            <div class="message">Captured to <strong>${projectName}</strong></div>
        </div>
    `;

  shadow.appendChild(toast);
  document.body.appendChild(container);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  // Remove
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => container.remove(), 400);
  }, 3500);
}

// --- SNAPSHOT SERVICE ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TAKE_SNAPSHOT') {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs || !tabs[0]) return;
      sendResponse({ snapshot: tabs.map(t => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl })) });
    });
    return true;
  }
});
