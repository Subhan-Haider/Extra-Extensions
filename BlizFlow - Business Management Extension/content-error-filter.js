// Content Script Error Filter
// Suppresses harmless CSP errors from external websites

(function() {
  'use strict';

  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;

  // Filter out wsimg.com CSP errors (these are from external websites, not the extension)
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Filter out wsimg.com CSP violations (harmless external website errors)
    if (message.includes('wsimg.com') && 
        (message.includes('violates') || message.includes('CSP') || message.includes('Content Security Policy'))) {
      // Silently ignore - these are from external websites, not the extension
      return;
    }
    
    // Filter out extension context invalidated errors that we handle gracefully
    if (message.includes('Extension context invalidated') && 
        message.includes('content.js')) {
      // Silently ignore - we handle this gracefully in the code
      return;
    }
    
    // Call original error for everything else
    originalError.apply(console, args);
  };

  // Filter warnings too
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Filter out wsimg.com warnings
    if (message.includes('wsimg.com') && 
        (message.includes('violates') || message.includes('CSP'))) {
      return;
    }
    
    // Call original warn for everything else
    originalWarn.apply(console, args);
  };

  // Also catch uncaught errors
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    
    // Filter out wsimg.com CSP errors
    if (message.includes('wsimg.com') && 
        (message.includes('violates') || message.includes('CSP'))) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // Filter out extension context errors we handle
    if (message.includes('Extension context invalidated')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
})();

