// Content script to capture copy/paste/cut events and keyboard shortcuts
let lastCopiedText = '';
let lastProcessedTime = 0;
let isExtensionValid = true;
let debugMode = true; // Enable debug logging

// Check if extension context is still valid
function checkExtensionContext() {
  if (!chrome.runtime?.id) {
    isExtensionValid = false;
    console.log('ClipTrack: Extension context invalidated, stopping listeners');
    return false;
  }
  return true;
}

// Debug logger
function debug(...args) {
  if (debugMode) {
    console.log('ClipTrack:', ...args);
  }
}

// Safe message sender with error handling
async function safeSendMessage(message) {
  if (!checkExtensionContext()) {
    return;
  }

  try {
    debug('Sending message:', message.type);
    await chrome.runtime.sendMessage(message);
    debug('Message sent successfully:', message.type);
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      isExtensionValid = false;
      console.log('ClipTrack: Extension was reloaded, please refresh this page');
    } else {
      console.error('ClipTrack: Error sending message', error);
    }
  }
}

// Wait for DOM to be ready
function initializeWhenReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // Small delay to ensure page is fully ready
    setTimeout(initialize, 100);
  }
}

// Initialize all event listeners
function initialize() {
  if (!checkExtensionContext()) return;

  console.log('✅ ClipTrack: Content script loaded and monitoring clipboard operations');
  console.log('📋 ClipTrack: Try copying some text with Ctrl+C or right-click → Copy');

  // Listen for copy events (PRIMARY METHOD - most reliable)
  document.addEventListener('copy', async (e) => {
    if (!isExtensionValid) return;

    try {
      const selectedText = window.getSelection().toString().trim();
      debug('Copy event detected, text length:', selectedText.length);

      if (selectedText && selectedText !== lastCopiedText) {
        lastCopiedText = selectedText;
        console.log('📋 ClipTrack: Captured copy -', selectedText.substring(0, 50) + '...');
        await sendCopyEvent(selectedText);
      }
    } catch (error) {
      if (!error.message.includes('Extension context invalidated')) {
        console.error('ClipTrack: Error capturing copy event', error);
      }
    }
  }, true); // Use capture phase

  // Listen for cut events
  document.addEventListener('cut', async (e) => {
    if (!isExtensionValid) return;

    try {
      const selectedText = window.getSelection().toString().trim();
      debug('Cut event detected, text length:', selectedText.length);

      if (selectedText) {
        console.log('✂️ ClipTrack: Captured cut -', selectedText.substring(0, 50) + '...');
        await sendCutEvent(selectedText);
      }
    } catch (error) {
      if (!error.message.includes('Extension context invalidated')) {
        console.error('ClipTrack: Error capturing cut event', error);
      }
    }
  }, true);

  // Listen for paste events
  document.addEventListener('paste', async (e) => {
    if (!isExtensionValid) return;

    try {
      const pastedText = e.clipboardData?.getData('text')?.trim();
      debug('Paste event detected, text length:', pastedText?.length || 0);

      if (pastedText) {
        console.log('📌 ClipTrack: Captured paste -', pastedText.substring(0, 50) + '...');
        await sendPasteEvent(pastedText);
      }
    } catch (error) {
      if (!error.message.includes('Extension context invalidated')) {
        console.error('ClipTrack: Error capturing paste event', error);
      }
    }
  }, true);

  // Keyboard shortcuts as backup (Ctrl+C, Ctrl+V, Ctrl+X)
  document.addEventListener('keydown', async (e) => {
    if (!isExtensionValid) return;

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    try {
      // Ctrl+C or Cmd+C (Copy) - BACKUP METHOD
      if (isCtrlOrCmd && e.key.toLowerCase() === 'c' && !e.shiftKey && !e.altKey) {
        setTimeout(async () => {
          if (!isExtensionValid) return;

          try {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText && selectedText !== lastCopiedText) {
              lastCopiedText = selectedText;
              debug('Keyboard copy detected (Ctrl+C)');
              await sendCopyEvent(selectedText);
            }
          } catch (error) {
            console.error('ClipTrack: Error capturing Ctrl+C', error);
          }
        }, 50);
      }

      // Ctrl+V or Cmd+V (Paste) - BACKUP METHOD
      else if (isCtrlOrCmd && e.key.toLowerCase() === 'v' && !e.shiftKey && !e.altKey) {
        setTimeout(async () => {
          if (!isExtensionValid) return;

          try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText && clipboardText.trim()) {
              debug('Keyboard paste detected (Ctrl+V)');
              await sendPasteEvent(clipboardText.trim());
            }
          } catch (error) {
            // Clipboard read might fail due to permissions - this is normal
            debug('Clipboard read permission denied (normal for Ctrl+V)');
          }
        }, 50);
      }

      // Ctrl+X or Cmd+X (Cut) - BACKUP METHOD
      else if (isCtrlOrCmd && e.key.toLowerCase() === 'x' && !e.shiftKey && !e.altKey) {
        setTimeout(async () => {
          if (!isExtensionValid) return;

          try {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText) {
              debug('Keyboard cut detected (Ctrl+X)');
              await sendCutEvent(selectedText);
            }
          } catch (error) {
            console.error('ClipTrack: Error capturing Ctrl+X', error);
          }
        }, 50);
      }
    } catch (error) {
      if (!error.message.includes('Extension context invalidated')) {
        console.error('ClipTrack: Error in keyboard handler', error);
      }
    }
  }, true);

  // Monitor for context menu copy (right-click copy)
  let contextMenuTimeout;
  document.addEventListener('contextmenu', () => {
    if (!isExtensionValid) return;

    const selectedText = window.getSelection().toString().trim();

    // Clear any existing timeout
    if (contextMenuTimeout) {
      clearTimeout(contextMenuTimeout);
    }

    // Check after a delay if clipboard was updated
    contextMenuTimeout = setTimeout(async () => {
      if (!isExtensionValid) return;

      try {
        if (selectedText && selectedText !== lastCopiedText) {
          try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText === selectedText) {
              lastCopiedText = selectedText;
              console.log('📋 ClipTrack: Captured context menu copy');
              await sendCopyEvent(selectedText);
            }
          } catch (error) {
            // Clipboard read permission not available - this is normal
            debug('Clipboard read permission denied (normal for context menu)');
          }
        }
      } catch (error) {
        if (!error.message.includes('Extension context invalidated')) {
          console.error('ClipTrack: Error in context menu handler', error);
        }
      }
    }, 200);
  }, true);

  debug('All event listeners registered successfully');
}

// Helper function to send copy event
async function sendCopyEvent(text) {
  if (!isExtensionValid) return;

  const now = Date.now();

  // Prevent duplicate events within 500ms
  if (now - lastProcessedTime < 500) {
    debug('Skipping duplicate copy event');
    return;
  }

  lastProcessedTime = now;

  await safeSendMessage({
    type: 'COPY_EVENT',
    data: {
      text: text,
      url: window.location.href,
      title: document.title,
      timestamp: now
    }
  });
}

// Helper function to send paste event
async function sendPasteEvent(text) {
  if (!isExtensionValid) return;

  const now = Date.now();

  // Prevent duplicate events within 500ms
  if (now - lastProcessedTime < 500) {
    debug('Skipping duplicate paste event');
    return;
  }

  lastProcessedTime = now;

  await safeSendMessage({
    type: 'PASTE_EVENT',
    data: {
      text: text,
      url: window.location.href,
      title: document.title,
      timestamp: now
    }
  });
}

// Helper function to send cut event
async function sendCutEvent(text) {
  if (!isExtensionValid) return;

  const now = Date.now();

  // Prevent duplicate events within 500ms
  if (now - lastProcessedTime < 500) {
    debug('Skipping duplicate cut event');
    return;
  }

  lastProcessedTime = now;

  await safeSendMessage({
    type: 'CUT_EVENT',
    data: {
      text: text,
      url: window.location.href,
      title: document.title,
      timestamp: now
    }
  });
}

// Start initialization
initializeWhenReady();

// Log when script is first loaded
console.log('🚀 ClipTrack: Content script file loaded');
