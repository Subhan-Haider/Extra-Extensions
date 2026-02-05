// Popup script for Image Converter Pro Extension

document.addEventListener('DOMContentLoaded', async () => {
    const openConverterBtn = document.getElementById('openConverter');
    const convertPageImagesBtn = document.getElementById('convertPageImages');
    const quickConvertBtn = document.getElementById('quickConvert');
    const statusDiv = document.getElementById('status');
    const quickStats = document.getElementById('quickStats');
    const imageCount = document.getElementById('imageCount');

    // Count images on current page
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, {
            action: 'countImages'
        }, (response) => {
            if (!chrome.runtime.lastError && response && response.count > 0) {
                imageCount.textContent = response.count;
                quickStats.style.display = 'block';
            }
        });
    } catch (error) {
        console.log('Could not count images:', error);
    }

    // Open full converter
    openConverterBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('index.html')
        });
        window.close();
    });

    // Convert all images on current page
    convertPageImagesBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            statusDiv.textContent = 'Extracting images...';
            statusDiv.style.color = '#6366f1';
            
            // Send message to content script
            chrome.tabs.sendMessage(tab.id, {
                action: 'extractAllImages'
            }, (response) => {
                if (chrome.runtime.lastError) {
                    statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
                    statusDiv.style.color = '#ef4444';
                } else {
                    statusDiv.textContent = 'Opening converter...';
                    statusDiv.style.color = '#10b981';
                    setTimeout(() => window.close(), 1000);
                }
            });
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.style.color = '#ef4444';
        }
    });

    // Quick convert (convert last right-clicked image)
    quickConvertBtn.addEventListener('click', async () => {
        try {
            // Get last converted image URL from storage
            chrome.storage.local.get(['lastImageUrl'], (result) => {
                if (result.lastImageUrl) {
                    chrome.tabs.create({
                        url: chrome.runtime.getURL(`index.html?imageUrl=${encodeURIComponent(result.lastImageUrl)}`)
                    });
                    window.close();
                } else {
                    statusDiv.textContent = 'No recent image. Right-click an image first!';
                    statusDiv.style.color = '#f59e0b';
                }
            });
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.style.color = '#ef4444';
        }
    });

    // Show extension status
    statusDiv.textContent = 'Ready to convert images';
});

