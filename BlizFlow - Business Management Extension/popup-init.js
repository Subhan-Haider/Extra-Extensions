// Immediate initialization script for popup
// This runs before the main popup.js module

(function() {
  function showContent() {
    const loadingState = document.getElementById('loadingState');
    const mainContent = document.getElementById('mainContent');
    if (loadingState && mainContent) {
      loadingState.style.display = 'none';
      mainContent.style.display = 'block';
    }
  }
  
  // Try immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showContent);
  } else {
    showContent();
  }
  
  // Fallback after 500ms
  setTimeout(showContent, 500);
})();

