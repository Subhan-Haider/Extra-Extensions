// Content Script for Image Converter Pro Extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractAllImages") {
        extractAllImages();
        sendResponse({ success: true });
    } else if (request.action === "countImages") {
        const count = document.querySelectorAll('img').length;
        sendResponse({ count: count });
    }
    return true;
});

// Extract all images from the current page
function extractAllImages() {
    const images = Array.from(document.querySelectorAll('img'));
    const imageUrls = images
        .map(img => img.src || img.dataset.src)
        .filter(url => url && (url.startsWith('http') || url.startsWith('data:')))
        .filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates

    if (imageUrls.length === 0) {
        alert('No images found on this page');
        return;
    }

    // Open converter with all image URLs
    const urlsParam = imageUrls.map(url => encodeURIComponent(url)).join(',');
    chrome.runtime.sendMessage({
        action: "openConverter",
        urls: imageUrls
    }, () => {
        window.open(chrome.runtime.getURL(`index.html?images=${urlsParam}`), '_blank');
    });
}

// Add download button to images (optional feature)
function addDownloadButtons() {
    document.querySelectorAll('img').forEach(img => {
        if (img.dataset.converterButtonAdded) return;
        
        img.dataset.converterButtonAdded = 'true';
        img.style.position = 'relative';
        
        const button = document.createElement('button');
        button.textContent = '🖼️ Convert';
        button.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: #6366f1;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            z-index: 10000;
            display: none;
        `;
        
        button.onclick = (e) => {
            e.stopPropagation();
            window.open(chrome.runtime.getURL(`index.html?imageUrl=${encodeURIComponent(img.src)}`), '_blank');
        };
        
        img.parentElement.style.position = 'relative';
        img.parentElement.appendChild(button);
        
        img.addEventListener('mouseenter', () => {
            button.style.display = 'block';
        });
        
        img.addEventListener('mouseleave', () => {
            button.style.display = 'none';
        });
    });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Optionally add download buttons (can be toggled in settings)
        // addDownloadButtons();
    });
} else {
    // addDownloadButtons();
}

