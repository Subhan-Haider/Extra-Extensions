// Image Converter Pro - Main Application Logic

class ImageConverter {
    constructor() {
        this.images = [];
        this.convertedImages = [];
        this.currentPreset = 'none';
        this.presetSizes = this.initializePresets();
        this.userPresets = {}; // Will be loaded asynchronously
        this.conversionHistory = []; // Will be loaded asynchronously
        this.customSizesList = []; // User-defined custom sizes
        this.editingSizeIndex = null; // Index of size being edited
        this.isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
        this.initializeElements();
        this.setupEventListeners();
        this.checkFormatSupport();
        this.setupKeyboardShortcuts();
        this.setupAutoTheme();
        // Load async data
        this.initializeAsync();
    }
    
    async initializeAsync() {
        // Load presets and history asynchronously
        this.userPresets = await this.loadUserPresets();
        this.conversionHistory = await this.loadHistory();
        this.updateUserPresetsUI();
        // Handle URL parameters after initialization
        await this.handleURLParameters();
    }

    initializePresets() {
        return {
            'none': [],
            'custom-list': [], // Custom size list - user builds this
            'logo': [
                { width: 512, height: 512, name: '512x512' },
                { width: 256, height: 256, name: '256x256' },
                { width: 128, height: 128, name: '128x128' },
                { width: 64, height: 64, name: '64x64' },
                { width: 32, height: 32, name: '32x32' }
            ],
            'favicon': [
                { width: 16, height: 16, name: '16x16' },
                { width: 32, height: 32, name: '32x32' },
                { width: 48, height: 48, name: '48x48' },
                { width: 64, height: 64, name: '64x64' }
            ],
            'android': [
                { width: 48, height: 48, name: 'mdpi_48x48' },
                { width: 72, height: 72, name: 'hdpi_72x72' },
                { width: 96, height: 96, name: 'xhdpi_96x96' },
                { width: 144, height: 144, name: 'xxhdpi_144x144' },
                { width: 192, height: 192, name: 'xxxhdpi_192x192' },
                { width: 512, height: 512, name: 'playstore_512x512' }
            ],
            'ios': [
                { width: 60, height: 60, name: '60x60' },
                { width: 120, height: 120, name: '120x120' },
                { width: 180, height: 180, name: '180x180' },
                { width: 1024, height: 1024, name: 'appstore_1024x1024' }
            ],
            'social': [
                { width: 1080, height: 1080, name: 'instagram_1080x1080' },
                { width: 1200, height: 630, name: 'facebook_1200x630' },
                { width: 1280, height: 720, name: 'youtube_1280x720' },
                { width: 1200, height: 675, name: 'twitter_1200x675' }
            ],
            'all': [
                { width: 512, height: 512, name: '512x512' },
                { width: 256, height: 256, name: '256x256' },
                { width: 128, height: 128, name: '128x128' },
                { width: 64, height: 64, name: '64x64' },
                { width: 32, height: 32, name: '32x32' },
                { width: 16, height: 16, name: '16x16' },
                { width: 1024, height: 1024, name: '1024x1024' },
                { width: 192, height: 192, name: '192x192' },
                { width: 180, height: 180, name: '180x180' },
                { width: 144, height: 144, name: '144x144' },
                { width: 120, height: 120, name: '120x120' },
                { width: 96, height: 96, name: '96x96' },
                { width: 72, height: 72, name: '72x72' },
                { width: 60, height: 60, name: '60x60' },
                { width: 48, height: 48, name: '48x48' }
            ]
        };
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.imagesGrid = document.getElementById('imagesGrid');
        this.gridContainer = document.getElementById('gridContainer');
        this.progressSection = document.getElementById('progressSection');
        this.progressContainer = document.getElementById('progressContainer');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.convertBtn = document.getElementById('convertBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.quickActions = document.getElementById('quickActions');
        this.currentEditingImageIndex = null;
        this.outputFormat = document.getElementById('outputFormat');
        this.quality = document.getElementById('quality');
        this.qualityValue = document.getElementById('qualityValue');
        this.resizeMode = document.getElementById('resizeMode');
        this.resizeWidth = document.getElementById('resizeWidth');
        this.resizeHeight = document.getElementById('resizeHeight');
        this.resizeDimensions = document.getElementById('resizeDimensions');
        this.resizeHeightGroup = document.getElementById('resizeHeightGroup');
        this.backgroundColorGroup = document.getElementById('backgroundColorGroup');
        this.backgroundColor = document.getElementById('backgroundColor');
        this.preserveTransparency = document.getElementById('preserveTransparency');
        this.removeMetadata = document.getElementById('removeMetadata');
        this.zipFormat = document.getElementById('zipFormat');
        this.presetButtons = document.querySelectorAll('.preset-btn');
        this.presetInfo = document.getElementById('presetInfo');
        this.bgPresetButtons = document.querySelectorAll('.bg-preset-btn');
        this.cropShape = document.getElementById('cropShape');
        this.autoPadding = document.getElementById('autoPadding');
        this.autoSharpening = document.getElementById('autoSharpening');
        this.dpi = document.getElementById('dpi');
        this.advancedOptions = document.getElementById('advancedOptions');
        this.resizeType = document.getElementById('resizeType');
        this.pixelDimensions = document.getElementById('pixelDimensions');
        this.percentageDimensions = document.getElementById('percentageDimensions');
        this.maxFileSizeGroup = document.getElementById('maxFileSizeGroup');
        this.maxDimensionsGroup = document.getElementById('maxDimensionsGroup');
        this.resizePercentage = document.getElementById('resizePercentage');
        this.percentageValue = document.getElementById('percentageValue');
        this.maxFileSize = document.getElementById('maxFileSize');
        this.maxWidth = document.getElementById('maxWidth');
        this.maxHeight = document.getElementById('maxHeight');
        this.keepAspectRatio = document.getElementById('keepAspectRatio');
        this.convertMultipleFormats = document.getElementById('convertMultipleFormats');
        this.formatSelection = document.getElementById('formatSelection');
        this.formatOptions = document.querySelectorAll('.format-option');
        this.customNaming = document.getElementById('customNaming');
        this.customNamingPattern = document.getElementById('customNamingPattern');
        this.zipOptionsGroup = document.getElementById('zipOptionsGroup');
        this.zipCompressionLevel = document.getElementById('zipCompressionLevel');
        this.zipFileName = document.getElementById('zipFileName');
        this.organizeByFormat = document.getElementById('organizeByFormat');
        this.organizeBySize = document.getElementById('organizeBySize');
        this.folderImport = document.getElementById('folderImport');
        this.autoTheme = document.getElementById('autoTheme');
        this.savePresetBtn = document.getElementById('savePresetBtn');
        this.historyBtn = document.getElementById('historyBtn');
        this.historySection = document.getElementById('historySection');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.presetModal = document.getElementById('presetModal');
        this.presetName = document.getElementById('presetName');
        this.savePresetConfirmBtn = document.getElementById('savePresetConfirmBtn');
        this.cancelPresetBtn = document.getElementById('cancelPresetBtn');
        this.userPresetsSection = document.getElementById('userPresetsSection');
        this.userPresetsList = document.getElementById('userPresetsList');
        this.percentButtons = document.querySelectorAll('.percent-btn');
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggle?.querySelector('.theme-icon');
        this.customSizeListSection = document.getElementById('customSizeListSection');
        this.newSizeWidth = document.getElementById('newSizeWidth');
        this.newSizeHeight = document.getElementById('newSizeHeight');
        this.newSizeKeepAspect = document.getElementById('newSizeKeepAspect');
        this.addSizeBtn = document.getElementById('addSizeBtn');
        this.customSizesListContainer = document.getElementById('customSizesList');
        this.clearSizeListBtn = document.getElementById('clearSizeListBtn');
        this.saveSizeListPresetBtn = document.getElementById('saveSizeListPresetBtn');
        this.editSizeModal = document.getElementById('editSizeModal');
        this.editSizeWidth = document.getElementById('editSizeWidth');
        this.editSizeHeight = document.getElementById('editSizeHeight');
        this.editSizeFormat = document.getElementById('editSizeFormat');
        this.editSizeQuality = document.getElementById('editSizeQuality');
        this.editQualityValue = document.getElementById('editQualityValue');
        this.editSizeKeepAspect = document.getElementById('editSizeKeepAspect');
        this.editSizeBackground = document.getElementById('editSizeBackground');
        this.editSizeResizeMode = document.getElementById('editSizeResizeMode');
        this.saveSizeEditBtn = document.getElementById('saveSizeEditBtn');
        this.cancelSizeEditBtn = document.getElementById('cancelSizeEditBtn');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        this.clearAllImagesBtn = document.getElementById('clearAllImagesBtn');
        this.selectedImages = new Set(); // Track selected images
        this.openOptionsLink = document.getElementById('openOptions');
    }

    setupEventListeners() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.openFileDialog());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // File input (fallback for browser compatibility)
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        }
        
        // Folder import checkbox
        if (this.folderImport) {
            this.folderImport.addEventListener('change', (e) => {
                // Folder import handled via Electron dialog
            });
        }
        
        // Resize type change
        this.resizeType.addEventListener('change', (e) => {
            const type = e.target.value;
            this.pixelDimensions.style.display = type === 'pixels' ? 'block' : 'none';
            this.percentageDimensions.style.display = type === 'percentage' ? 'block' : 'none';
            this.maxFileSizeGroup.style.display = type === 'maxfilesize' ? 'block' : 'none';
            this.maxDimensionsGroup.style.display = type === 'maxdimensions' ? 'block' : 'none';
        });

        // Percentage slider
        this.resizePercentage.addEventListener('input', (e) => {
            this.percentageValue.textContent = e.target.value;
        });

        // Percentage preset buttons
        this.percentButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const percent = e.target.dataset.percent;
                this.resizePercentage.value = percent;
                this.percentageValue.textContent = percent;
            });
        });

        // Multiple formats
        this.convertMultipleFormats.addEventListener('change', (e) => {
            this.formatSelection.style.display = e.target.checked ? 'block' : 'none';
        });

        // Custom naming
        this.customNaming.addEventListener('change', (e) => {
            this.customNamingPattern.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        // ZIP format change
        this.zipFormat.addEventListener('change', (e) => {
            this.zipOptionsGroup.style.display = e.target.value === 'zip' ? 'block' : 'none';
        });

        // Folder import - handled via Electron dialog in openFileDialog

        // Preset buttons
        this.savePresetBtn.addEventListener('click', () => this.showPresetModal());
        this.savePresetConfirmBtn.addEventListener('click', () => this.saveCurrentPreset());
        this.cancelPresetBtn.addEventListener('click', () => this.closePresetModal());
        this.historyBtn.addEventListener('click', () => this.toggleHistory());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // Custom size list
        this.addSizeBtn.addEventListener('click', () => this.addCustomSize());
        this.newSizeWidth.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCustomSize();
        });
        this.newSizeHeight.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCustomSize();
        });
        this.clearSizeListBtn.addEventListener('click', () => this.clearCustomSizesList());
        this.saveSizeListPresetBtn.addEventListener('click', () => this.saveSizeListAsPreset());
        this.saveSizeEditBtn.addEventListener('click', () => this.saveSizeEdit());
        this.cancelSizeEditBtn.addEventListener('click', () => this.closeSizeEditModal());
        this.editSizeQuality.addEventListener('input', (e) => {
            this.editQualityValue.textContent = e.target.value;
        });

        // Close modals on outside click
        this.presetModal.addEventListener('click', (e) => {
            if (e.target === this.presetModal) {
                this.closePresetModal();
            }
        });
        this.editSizeModal.addEventListener('click', (e) => {
            if (e.target === this.editSizeModal) {
                this.closeSizeEditModal();
            }
        });
        
        // Settings
        this.quality.addEventListener('input', (e) => {
            this.qualityValue.textContent = e.target.value;
        });

        this.resizeMode.addEventListener('change', (e) => {
            const showDimensions = e.target.value === 'custom' || e.target.value === 'fit' || e.target.value === 'fill';
            if (this.resizeDimensions) this.resizeDimensions.style.display = showDimensions ? 'block' : 'none';
            if (this.resizeHeightGroup) this.resizeHeightGroup.style.display = showDimensions ? 'block' : 'none';
        });

        this.outputFormat.addEventListener('change', (e) => {
            const needsBackground = e.target.value === 'jpg' || e.target.value === 'jpeg';
            this.backgroundColorGroup.style.display = needsBackground ? 'block' : 'none';
        });

        this.resizeMode.addEventListener('change', (e) => {
            const isCircular = e.target.value === 'circular';
            this.advancedOptions.style.display = isCircular ? 'block' : 'none';
        });

        // Preset buttons
        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.selectPreset(preset);
            });
        });

        // Background color preset buttons
        this.bgPresetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (color === 'transparent') {
                    this.preserveTransparency.checked = true;
                    this.outputFormat.value = 'png';
                } else {
                    this.backgroundColor.value = color;
                }
            });
        });

        // Action buttons
        this.convertBtn.addEventListener('click', () => this.convertAll());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        
        // Quick Actions - Use arrow functions to preserve 'this' context
        const quickCrop = document.getElementById('quickCrop');
        const quickRotate = document.getElementById('quickRotate');
        const quickFlipH = document.getElementById('quickFlipH');
        const quickFlipV = document.getElementById('quickFlipV');
        const quickOptimize = document.getElementById('quickOptimize');
        const quickWatermark = document.getElementById('quickWatermark');
        const quickMetadata = document.getElementById('quickMetadata');
        const quickRename = document.getElementById('quickRename');
        
        if (quickCrop) quickCrop.addEventListener('click', () => this.openCropModal());
        if (quickRotate) quickRotate.addEventListener('click', () => this.rotateImage(90));
        if (quickFlipH) quickFlipH.addEventListener('click', () => this.flipImage('horizontal'));
        if (quickFlipV) quickFlipV.addEventListener('click', () => this.flipImage('vertical'));
        if (quickOptimize) quickOptimize.addEventListener('click', () => this.openOptimizeModal());
        if (quickWatermark) quickWatermark.addEventListener('click', () => this.openWatermarkModal());
        if (quickMetadata) quickMetadata.addEventListener('click', () => this.openMetadataModal());
        if (quickRename) quickRename.addEventListener('click', () => this.openRenameModal());
        
        // Add event listeners for crop controls
        const cropX = document.getElementById('cropX');
        const cropY = document.getElementById('cropY');
        const cropWidth = document.getElementById('cropWidth');
        const cropHeight = document.getElementById('cropHeight');
        
        if (cropX) cropX.addEventListener('input', () => this.updateCropPreview());
        if (cropY) cropY.addEventListener('input', () => this.updateCropPreview());
        if (cropWidth) cropWidth.addEventListener('input', () => this.updateCropPreview());
        if (cropHeight) cropHeight.addEventListener('input', () => this.updateCropPreview());
        
        // Modal close buttons
        const cancelCropBtn = document.getElementById('cancelCropBtn');
        const applyCropBtn = document.getElementById('applyCropBtn');
        const resetCropBtn = document.getElementById('resetCropBtn');
        const cancelOptimizeBtn = document.getElementById('cancelOptimizeBtn');
        const applyOptimizeBtn = document.getElementById('applyOptimizeBtn');
        const cancelWatermarkBtn = document.getElementById('cancelWatermarkBtn');
        const applyWatermarkBtn = document.getElementById('applyWatermarkBtn');
        const closeMetadataBtn = document.getElementById('closeMetadataBtn');
        const exportMetadataBtn = document.getElementById('exportMetadataBtn');
        const cancelRenameBtn = document.getElementById('cancelRenameBtn');
        const applyRenameBtn = document.getElementById('applyRenameBtn');
        
        if (cancelCropBtn) cancelCropBtn.addEventListener('click', () => this.closeModal('cropModal'));
        if (applyCropBtn) applyCropBtn.addEventListener('click', () => this.applyCrop());
        if (resetCropBtn) resetCropBtn.addEventListener('click', () => this.resetCrop());
        if (cancelOptimizeBtn) cancelOptimizeBtn.addEventListener('click', () => this.closeModal('optimizeModal'));
        if (applyOptimizeBtn) applyOptimizeBtn.addEventListener('click', () => this.applyOptimization());
        if (cancelWatermarkBtn) cancelWatermarkBtn.addEventListener('click', () => this.closeModal('watermarkModal'));
        if (applyWatermarkBtn) applyWatermarkBtn.addEventListener('click', () => this.applyWatermark());
        if (closeMetadataBtn) closeMetadataBtn.addEventListener('click', () => this.closeModal('metadataModal'));
        if (exportMetadataBtn) exportMetadataBtn.addEventListener('click', () => this.exportMetadata());
        if (cancelRenameBtn) cancelRenameBtn.addEventListener('click', () => this.closeModal('renameModal'));
        if (applyRenameBtn) applyRenameBtn.addEventListener('click', () => this.applyRename());
        
        // Watermark type change
        const watermarkType = document.getElementById('watermarkType');
        const watermarkTextGroup = document.getElementById('watermarkTextGroup');
        const watermarkImageGroup = document.getElementById('watermarkImageGroup');
        if (watermarkType) {
            watermarkType.addEventListener('change', (e) => {
                const isText = e.target.value === 'text';
                if (watermarkTextGroup) watermarkTextGroup.style.display = isText ? 'block' : 'none';
                if (watermarkImageGroup) watermarkImageGroup.style.display = isText ? 'none' : 'block';
            });
        }
        
        // Optimize quality slider
        const optimizeQuality = document.getElementById('optimizeQuality');
        const optimizeQualityValue = document.getElementById('optimizeQualityValue');
        if (optimizeQuality && optimizeQualityValue) {
            optimizeQuality.addEventListener('input', (e) => {
                optimizeQualityValue.textContent = e.target.value;
                this.updateOptimizePreview();
            });
        }
        
        // Watermark opacity slider
        const watermarkOpacity = document.getElementById('watermarkOpacity');
        const watermarkOpacityValue = document.getElementById('watermarkOpacityValue');
        if (watermarkOpacity && watermarkOpacityValue) {
            watermarkOpacity.addEventListener('input', (e) => {
                watermarkOpacityValue.textContent = e.target.value;
                this.updateWatermarkPreview();
            });
        }
        
        // Rename pattern change
        const renamePattern = document.getElementById('renamePattern');
        const renameCustomGroup = document.getElementById('renameCustomGroup');
        if (renamePattern && renameCustomGroup) {
            renamePattern.addEventListener('change', (e) => {
                renameCustomGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
                this.updateRenamePreview();
            });
        }
        
        // Rename input change
        const renameCustom = document.getElementById('renameCustom');
        const renameStartNumber = document.getElementById('renameStartNumber');
        if (renameCustom) renameCustom.addEventListener('input', () => this.updateRenamePreview());
        if (renameStartNumber) renameStartNumber.addEventListener('input', () => this.updateRenamePreview());
        
        // Bulk actions
        if (this.selectAllBtn) {
            this.selectAllBtn.addEventListener('click', () => this.selectAllImages());
        }
        if (this.deleteSelectedBtn) {
            this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedImages());
        }
        if (this.clearAllImagesBtn) {
            this.clearAllImagesBtn.addEventListener('click', () => this.clearAllImages());
        }

        // Theme toggle
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Load saved theme preference
        this.loadThemePreference();

        // Initial format check
        this.outputFormat.dispatchEvent(new Event('change'));
        this.resizeType.dispatchEvent(new Event('change'));
        this.zipFormat.dispatchEvent(new Event('change'));
        this.selectPreset('none');
        this.updateUserPresetsUI();
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('imageConverter_theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            this.updateThemeIcon(true);
        } else if (savedTheme === 'dark') {
            document.body.classList.remove('light-theme');
            this.updateThemeIcon(false);
        } else {
            // Use system preference if auto-theme is enabled
            if (this.autoTheme?.checked) {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.body.classList.toggle('light-theme', !prefersDark);
                this.updateThemeIcon(!prefersDark);
            }
        }
    }

    toggleTheme() {
        const isLight = document.body.classList.contains('light-theme');
        document.body.classList.toggle('light-theme');
        const newIsLight = document.body.classList.contains('light-theme');
        this.updateThemeIcon(newIsLight);
        
        // Save preference
        localStorage.setItem('imageConverter_theme', newIsLight ? 'light' : 'dark');
        
        // Disable auto-theme when manually toggled
        if (this.autoTheme) {
            this.autoTheme.checked = false;
        }
    }

    updateThemeIcon(isLight) {
        if (this.themeIcon) {
            this.themeIcon.textContent = isLight ? '☀️' : '🌙';
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const ctrl = e.ctrlKey || e.metaKey;
            if (ctrl && e.key === 'u') {
                e.preventDefault();
                this.openFileDialog();
            } else if (ctrl && e.key === 'Enter') {
                e.preventDefault();
                this.convertBtn.click();
            } else if (ctrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.clearAll();
            } else if (ctrl && e.key === 'd') {
                e.preventDefault();
                if (this.convertedImages.length > 0) {
                    this.downloadAll();
                }
            } else if (ctrl && e.key === 'h') {
                e.preventDefault();
                this.toggleHistory();
            } else if (e.key === 'Escape') {
                this.closePresetModal();
                this.historySection.style.display = 'none';
            }
        });
    }

    setupAutoTheme() {
        if (this.autoTheme?.checked) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('light-theme', !prefersDark);
            this.updateThemeIcon(!prefersDark);
            
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                document.body.classList.toggle('light-theme', !e.matches);
                this.updateThemeIcon(!e.matches);
            });
        }
        
        this.autoTheme?.addEventListener('change', (e) => {
            if (e.target.checked) {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.body.classList.toggle('light-theme', !prefersDark);
                this.updateThemeIcon(!prefersDark);
                localStorage.removeItem('imageConverter_theme'); // Clear manual preference
            }
        });
    }

    async loadUserPresets() {
        if (this.isChromeExtension) {
            return new Promise((resolve) => {
                chrome.storage.local.get(['imageConverter_userPresets'], (result) => {
                    try {
                        const presets = result.imageConverter_userPresets ? JSON.parse(result.imageConverter_userPresets) : {};
                        resolve(presets);
                    } catch {
                        resolve({});
                    }
                });
            });
        } else {
            try {
                const saved = localStorage.getItem('imageConverter_userPresets');
                return saved ? JSON.parse(saved) : {};
            } catch {
                return {};
            }
        }
    }

    async saveUserPresets() {
        if (this.isChromeExtension) {
            try {
                await chrome.storage.local.set({
                    imageConverter_userPresets: JSON.stringify(this.userPresets)
                });
            } catch (e) {
                console.error('Failed to save presets:', e);
            }
        } else {
            try {
                localStorage.setItem('imageConverter_userPresets', JSON.stringify(this.userPresets));
            } catch (e) {
                console.error('Failed to save presets:', e);
            }
        }
    }

    async loadHistory() {
        if (this.isChromeExtension) {
            return new Promise((resolve) => {
                chrome.storage.local.get(['imageConverter_history'], (result) => {
                    try {
                        const history = result.imageConverter_history ? JSON.parse(result.imageConverter_history) : [];
                        resolve(history);
                    } catch {
                        resolve([]);
                    }
                });
            });
        } else {
            try {
                const saved = localStorage.getItem('imageConverter_history');
                return saved ? JSON.parse(saved) : [];
            } catch {
                return [];
            }
        }
    }

    async saveHistory() {
        try {
            const history = this.conversionHistory.slice(-10);
            if (this.isChromeExtension) {
                await chrome.storage.local.set({
                    imageConverter_history: JSON.stringify(history)
                });
            } else {
                localStorage.setItem('imageConverter_history', JSON.stringify(history));
            }
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }
    
    async handleURLParameters() {
        // Handle images passed via URL parameters (from context menu or content script)
        const urlParams = new URLSearchParams(window.location.search);
        const imageUrl = urlParams.get('imageUrl');
        const imagesParam = urlParams.get('images');
        
        if (imageUrl) {
            await this.loadImageFromURL(imageUrl);
        } else if (imagesParam) {
            const imageUrls = imagesParam.split(',').map(url => decodeURIComponent(url));
            for (const url of imageUrls) {
                await this.loadImageFromURL(url);
            }
        }
    }
    
    async loadImageFromURL(url) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], url.split('/').pop() || 'image.png', { type: blob.type });
            const imageData = await this.loadImage(file);
            this.images.push(imageData);
            this.updateUI();
        } catch (error) {
            console.error('Error loading image from URL:', error);
            alert(`Error loading image: ${error.message}`);
        }
    }

    selectPreset(preset) {
        this.currentPreset = preset;
        
        // Update button states
        this.presetButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === preset);
        });

        // Show/hide custom size list section
        if (preset === 'custom-list') {
            if (this.customSizeListSection) {
                this.customSizeListSection.style.display = 'block';
            }
            if (this.presetInfo) {
                this.presetInfo.innerHTML = `
                    <strong>Custom Size List Mode</strong><br>
                    <small>💡 Add any sizes you want, then generate them all at once</small>
                `;
            }
        } else {
            if (this.customSizeListSection) {
                this.customSizeListSection.style.display = 'none';
            }
        }

        // Update preset info
        const sizes = this.presetSizes[preset];
        if (preset === 'none') {
            if (this.presetInfo) this.presetInfo.textContent = 'Using custom dimensions or no resize';
            if (this.resizeWidth) this.resizeWidth.disabled = false;
            if (this.resizeHeight) this.resizeHeight.disabled = false;
            if (this.resizeDimensions) this.resizeDimensions.style.display = 'block';
            if (this.resizeHeightGroup) this.resizeHeightGroup.style.display = 'block';
        } else if (preset === 'custom-list') {
            // Already handled above
        } else {
            const sizesList = sizes.map(s => `${s.name || s.width + 'x' + s.height}`).join(', ');
            const count = sizes.length;
            if (this.presetInfo) {
                this.presetInfo.innerHTML = `
                    <strong>${count} sizes will be generated:</strong><br>
                    ${sizesList}<br>
                    <small>💡 Each uploaded image will generate ${count} resized versions automatically</small>
                `;
            }
            if (this.resizeWidth) this.resizeWidth.disabled = true;
            if (this.resizeHeight) this.resizeHeight.disabled = true;
            if (this.resizeDimensions) this.resizeDimensions.style.display = 'none';
            if (this.resizeHeightGroup) this.resizeHeightGroup.style.display = 'none';
            // Auto-set resize mode to fit for presets
            if (this.resizeMode.value === 'none') {
                this.resizeMode.value = 'fit';
            }
        }
    }

    addCustomSize() {
        if (!this.newSizeWidth || !this.newSizeHeight || !this.newSizeKeepAspect) {
            console.error('Custom size input elements not found');
            return;
        }
        
        const width = parseInt(this.newSizeWidth.value);
        const height = parseInt(this.newSizeHeight.value);
        const keepAspect = this.newSizeKeepAspect.checked;

        if (!width && !height) {
            alert('Please enter at least width or height');
            return;
        }

        const newSize = {
            width: width || null,
            height: height || null,
            keepAspect: keepAspect,
            format: this.outputFormat.value,
            quality: parseInt(this.quality.value),
            backgroundColor: this.backgroundColor.value,
            resizeMode: this.resizeMode.value || 'fit',
            name: `${width || 'auto'}x${height || 'auto'}`
        };

        this.customSizesList.push(newSize);
        this.updateCustomSizesListUI();
        
        // Clear inputs
        this.newSizeWidth.value = '';
        this.newSizeHeight.value = '';
        this.newSizeKeepAspect.checked = false;
    }

    removeCustomSize(index) {
        this.customSizesList.splice(index, 1);
        this.updateCustomSizesListUI();
    }

    editCustomSize(index) {
        const size = this.customSizesList[index];
        this.editingSizeIndex = index;

        this.editSizeWidth.value = size.width || '';
        this.editSizeHeight.value = size.height || '';
        this.editSizeFormat.value = size.format || 'png';
        this.editSizeQuality.value = size.quality || 80;
        this.editQualityValue.textContent = size.quality || 80;
        this.editSizeKeepAspect.checked = size.keepAspect || false;
        this.editSizeBackground.value = size.backgroundColor || '#ffffff';
        this.editSizeResizeMode.value = size.resizeMode || 'fit';

        this.editSizeModal.style.display = 'flex';
    }

    saveSizeEdit() {
        if (this.editingSizeIndex === null) return;

        const size = this.customSizesList[this.editingSizeIndex];
        size.width = parseInt(this.editSizeWidth.value) || null;
        size.height = parseInt(this.editSizeHeight.value) || null;
        size.format = this.editSizeFormat.value;
        size.quality = parseInt(this.editSizeQuality.value);
        size.keepAspect = this.editSizeKeepAspect.checked;
        size.backgroundColor = this.editSizeBackground.value;
        size.resizeMode = this.editSizeResizeMode.value;
        size.name = `${size.width || 'auto'}x${size.height || 'auto'}`;

        this.updateCustomSizesListUI();
        this.closeSizeEditModal();
    }

    closeSizeEditModal() {
        this.editSizeModal.style.display = 'none';
        this.editingSizeIndex = null;
    }

    clearCustomSizesList() {
        if (this.customSizesList.length === 0) return;
        if (confirm(`Clear all ${this.customSizesList.length} custom sizes?`)) {
            this.customSizesList = [];
            this.updateCustomSizesListUI();
        }
    }

    updateCustomSizesListUI() {
        if (!this.customSizesListContainer) {
            console.error('Custom sizes list container not found');
            return;
        }
        
        if (this.customSizesList.length === 0) {
            this.customSizesListContainer.innerHTML = '<p class="empty-message">No custom sizes added yet. Click "+ Add Size" to start building your list.</p>';
            return;
        }

        this.customSizesListContainer.innerHTML = this.customSizesList.map((size, index) => {
            const width = size.width || 'Auto';
            const height = size.height || 'Auto';
            return `
                <div class="custom-size-item">
                    <div class="size-item-info">
                        <div class="size-item-main">
                            <span class="size-item-dimensions">${width} × ${height}px</span>
                            ${size.keepAspect ? '<span style="color: var(--text-secondary); font-size: 0.9rem;">(Aspect ratio)</span>' : ''}
                        </div>
                        <div class="size-item-details">
                            <span>Format: ${size.format.toUpperCase()}</span>
                            <span>Quality: ${size.quality}%</span>
                            <span>Mode: ${size.resizeMode}</span>
                        </div>
                    </div>
                    <div class="size-item-actions">
                        <button class="btn-icon" onclick="window.imageConverter.editCustomSize(${index})" title="Edit">✏️</button>
                        <button class="btn-icon danger" onclick="window.imageConverter.removeCustomSize(${index})" title="Remove">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    saveSizeListAsPreset() {
        if (this.customSizesList.length === 0) {
            alert('Please add some custom sizes first');
            return;
        }

        const name = prompt('Enter preset name:', 'My Custom Sizes');
        if (!name || !name.trim()) return;

        const preset = {
            name: name.trim(),
            type: 'custom-size-list',
            sizes: JSON.parse(JSON.stringify(this.customSizesList)),
            timestamp: Date.now()
        };

        this.userPresets[name.trim()] = preset;
        this.saveUserPresets();
        this.updateUserPresetsUI();
        alert(`Preset "${name.trim()}" saved! You can load it from "Your Custom Presets" section.`);
    }

    checkFormatSupport() {
        // Check WebP support
        const webpSupported = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
        if (!webpSupported) {
            const webpOption = this.outputFormat.querySelector('option[value="webp"]');
            if (webpOption) {
                webpOption.disabled = true;
                webpOption.textContent += ' (not supported)';
            }
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    async handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        // Check if Electron is available
        if (window.electronAPI) {
            // In Electron, we need to handle file paths from drag & drop
            const files = Array.from(e.dataTransfer.files);
            const filePaths = files.map(f => f.path || f.name);
            
            for (const filePath of filePaths) {
                try {
                    const result = await window.electronAPI.readFile(filePath);
                    if (result.success) {
                        const file = new File([result.data], result.name, { type: 'image/*' });
                        const imageData = await this.loadImage(file);
                        imageData.filePath = filePath; // Store original path
                        this.images.push(imageData);
                    }
                } catch (error) {
                    console.error('Error loading image:', error);
                }
            }
        } else {
            // Browser fallback
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            this.handleFiles(files);
        }
        
        this.updateUI();
    }
    
    async openFileDialog() {
        if (window.electronAPI) {
            // Use Electron file dialog
            const folderMode = this.folderImport?.checked || false;
            let result;
            
            if (folderMode) {
                result = await window.electronAPI.openFolderDialog();
            } else {
                result = await window.electronAPI.openFileDialog({ allowFolders: false });
            }
            
            if (!result.canceled && result.files && result.files.length > 0) {
                for (const fileInfo of result.files) {
                    try {
                        const readResult = await window.electronAPI.readFile(fileInfo.path);
                        if (readResult.success) {
                            const file = new File([readResult.data], fileInfo.name, { type: 'image/*' });
                            const imageData = await this.loadImage(file);
                            imageData.filePath = fileInfo.path; // Store original path
                            this.images.push(imageData);
                        }
                    } catch (error) {
                        console.error('Error loading image:', error);
                        if (window.electronAPI) {
                            await window.electronAPI.showMessageBox({
                                type: 'error',
                                title: 'Error',
                                message: `Error loading ${fileInfo.name}: ${error.message}`
                            });
                        } else {
                            alert(`Error loading ${fileInfo.name}: ${error.message}`);
                        }
                    }
                }
                this.updateUI();
            }
        } else {
            // Browser fallback - use file input
            if (this.fileInput) {
                this.fileInput.click();
            }
        }
    }

    async handleFiles(files) {
        if (files.length === 0) return;

        for (const file of files) {
            try {
                const imageData = await this.loadImage(file);
                this.images.push(imageData);
            } catch (error) {
                console.error('Error loading image:', error);
                alert(`Error loading ${file.name}: ${error.message}`);
            }
        }

        this.updateUI();
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    resolve({
                        file: file,
                        name: file.name,
                        originalSize: file.size,
                        width: img.width,
                        height: img.height,
                        image: img,
                        format: this.detectFormat(file.name, file.type)
                    });
                };
                
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    detectFormat(filename, mimeType) {
        const ext = filename.split('.').pop().toLowerCase();
        const formatMap = {
            'png': 'png',
            'jpg': 'jpg',
            'jpeg': 'jpeg',
            'webp': 'webp',
            'bmp': 'bmp',
            'gif': 'gif',
            'tiff': 'tiff',
            'svg': 'svg',
            'avif': 'avif',
            'heic': 'heic'
        };
        return formatMap[ext] || mimeType.split('/')[1] || 'unknown';
    }

    updateUI() {
        if (this.images.length > 0) {
            this.settingsPanel.style.display = 'block';
            this.imagesGrid.style.display = 'block';
            this.updateImageGrid();
            this.updateBulkActionsUI();
            this.updateQuickActions();
        } else {
            this.settingsPanel.style.display = 'none';
            this.imagesGrid.style.display = 'none';
            this.selectedImages.clear();
            this.updateBulkActionsUI();
            if (this.quickActions) {
                this.quickActions.style.display = 'none';
            }
        }
    }

    updateImageGrid() {
        this.updateQuickActions();
        this.gridContainer.innerHTML = '';
        
        this.images.forEach((imageData, index) => {
            const card = document.createElement('div');
            card.className = 'image-card';
            card.dataset.index = index;
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = 200;
            
            // Draw preview
            const scale = Math.min(canvas.width / imageData.width, canvas.height / imageData.height);
            const x = (canvas.width - imageData.width * scale) / 2;
            const y = (canvas.height - imageData.height * scale) / 2;
            ctx.drawImage(imageData.image, x, y, imageData.width * scale, imageData.height * scale);
            
            const img = document.createElement('img');
            img.className = 'image-preview';
            img.src = canvas.toDataURL();
            
            const isSelected = this.selectedImages.has(index);
            card.innerHTML = `
                <div class="image-card-header">
                    <label class="image-checkbox" title="Select for bulk actions">
                        <input type="checkbox" class="image-select-checkbox" data-index="${index}" ${isSelected ? 'checked' : ''}>
                        <span class="image-index">#${index + 1}</span>
                    </label>
                    <div class="image-actions">
                        <button class="btn-icon-small" data-action="replace" data-index="${index}" title="Replace Image">🔄</button>
                        <button class="btn-icon-small" data-action="duplicate" data-index="${index}" title="Duplicate">📋</button>
                        <button class="btn-icon-small" data-action="move-up" data-index="${index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>⬆️</button>
                        <button class="btn-icon-small" data-action="move-down" data-index="${index}" title="Move Down" ${index === this.images.length - 1 ? 'disabled' : ''}>⬇️</button>
                        <button class="btn-icon-small danger" data-action="delete" data-index="${index}" title="Delete">🗑️</button>
                    </div>
                </div>
                ${img.outerHTML}
                <div class="image-name">${imageData.name}</div>
                <div class="image-info">
                    <div><strong>Format:</strong> ${imageData.format.toUpperCase()}</div>
                    <div><strong>Size:</strong> ${this.formatFileSize(imageData.originalSize)}</div>
                    <div><strong>Dimensions:</strong> ${imageData.width} × ${imageData.height}px</div>
                </div>
            `;
            
            // Add checkbox event listener
            const checkbox = card.querySelector('.image-select-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const idx = parseInt(e.target.dataset.index);
                    if (e.target.checked) {
                        this.selectedImages.add(idx);
                    } else {
                        this.selectedImages.delete(idx);
                    }
                    this.updateBulkActionsUI();
                });
            }
            
            // Add event listeners for action buttons
            const actionButtons = card.querySelectorAll('[data-action]');
            actionButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const idx = parseInt(btn.dataset.index);
                    this.handleImageAction(action, idx);
                });
            });
            
            this.gridContainer.appendChild(card);
        });
    }
    
    async handleImageAction(action, index) {
        switch(action) {
            case 'delete':
                await this.deleteImage(index);
                break;
            case 'replace':
                await this.replaceImage(index);
                break;
            case 'duplicate':
                this.duplicateImage(index);
                break;
            case 'move-up':
                this.moveImage(index, -1);
                break;
            case 'move-down':
                this.moveImage(index, 1);
                break;
        }
    }
    
    async deleteImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        const imageName = this.images[index].name;
        let confirmDelete = true;
        
        if (window.electronAPI) {
            const result = await window.electronAPI.showMessageBox({
                type: 'question',
                title: 'Delete Image',
                message: `Are you sure you want to delete "${imageName}"?`,
                buttons: ['Cancel', 'Delete'],
                defaultId: 0
            });
            confirmDelete = result.response === 1;
        } else {
            confirmDelete = confirm(`Delete "${imageName}"?`);
        }
        
        if (confirmDelete) {
            this.images.splice(index, 1);
            // Update selected indices - remove deleted index and shift others down
            const newSelected = new Set();
            this.selectedImages.forEach(selectedIndex => {
                if (selectedIndex < index) {
                    newSelected.add(selectedIndex);
                } else if (selectedIndex > index) {
                    newSelected.add(selectedIndex - 1);
                }
                // Skip the deleted index
            });
            this.selectedImages = newSelected;
            this.updateUI();
        }
    }
    
    async replaceImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        const wasSelected = this.selectedImages.has(index);
        
        if (window.electronAPI) {
            const result = await window.electronAPI.openFileDialog({ allowFolders: false });
            
            if (!result.canceled && result.files && result.files.length > 0) {
                const fileInfo = result.files[0]; // Replace with first selected file
                try {
                    const readResult = await window.electronAPI.readFile(fileInfo.path);
                    if (readResult.success) {
                        const file = new File([readResult.data], fileInfo.name, { type: 'image/*' });
                        const imageData = await this.loadImage(file);
                        imageData.filePath = fileInfo.path;
                        this.images[index] = imageData; // Replace at same index
                        // Maintain selection state
                        if (wasSelected) {
                            this.selectedImages.add(index);
                        }
                        this.updateUI();
                    }
                } catch (error) {
                    console.error('Error replacing image:', error);
                    if (window.electronAPI) {
                        await window.electronAPI.showMessageBox({
                            type: 'error',
                            title: 'Error',
                            message: `Error replacing image: ${error.message}`
                        });
                    } else {
                        alert(`Error replacing image: ${error.message}`);
                    }
                }
            }
        } else {
            // Browser fallback
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const imageData = await this.loadImage(file);
                        this.images[index] = imageData;
                        // Maintain selection state
                        if (wasSelected) {
                            this.selectedImages.add(index);
                        }
                        this.updateUI();
                    } catch (error) {
                        alert(`Error replacing image: ${error.message}`);
                    }
                }
            };
            input.click();
        }
    }
    
    duplicateImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        const originalImage = this.images[index];
        // Create a deep copy
        const duplicated = {
            ...originalImage,
            name: `${originalImage.name.replace(/\.[^/.]+$/, '')}_copy${originalImage.name.match(/\.[^/.]+$/)?.[0] || ''}`,
            file: originalImage.file, // Reference to same file
            image: originalImage.image // Reference to same image
        };
        
        const newIndex = index + 1;
        this.images.splice(newIndex, 0, duplicated);
        
        // Update selected indices - shift indices after insertion point
        const newSelected = new Set();
        this.selectedImages.forEach(selectedIndex => {
            if (selectedIndex <= index) {
                newSelected.add(selectedIndex);
            } else {
                newSelected.add(selectedIndex + 1);
            }
        });
        this.selectedImages = newSelected;
        
        this.updateUI();
    }
    
    moveImage(index, direction) {
        if (index < 0 || index >= this.images.length) return;
        
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.images.length) return;
        
        // Swap images
        [this.images[index], this.images[newIndex]] = [this.images[newIndex], this.images[index]];
        
        // Update selected indices
        const wasSelected = this.selectedImages.has(index);
        const wasNewSelected = this.selectedImages.has(newIndex);
        this.selectedImages.delete(index);
        this.selectedImages.delete(newIndex);
        if (wasSelected) this.selectedImages.add(newIndex);
        if (wasNewSelected) this.selectedImages.add(index);
        
        this.updateUI();
    }
    
    selectAllImages() {
        this.images.forEach((_, index) => {
            this.selectedImages.add(index);
        });
        this.updateUI();
        this.updateBulkActionsUI();
    }
    
    async deleteSelectedImages() {
        if (this.selectedImages.size === 0) return;
        
        let confirmDelete = true;
        const count = this.selectedImages.size;
        
        if (window.electronAPI) {
            const result = await window.electronAPI.showMessageBox({
                type: 'question',
                title: 'Delete Selected Images',
                message: `Are you sure you want to delete ${count} image(s)?`,
                buttons: ['Cancel', 'Delete'],
                defaultId: 0
            });
            confirmDelete = result.response === 1;
        } else {
            confirmDelete = confirm(`Delete ${count} selected image(s)?`);
        }
        
        if (confirmDelete) {
            // Delete in reverse order to maintain correct indices
            const sortedIndices = Array.from(this.selectedImages).sort((a, b) => b - a);
            sortedIndices.forEach(index => {
                this.images.splice(index, 1);
            });
            this.selectedImages.clear();
            this.updateUI();
            this.updateBulkActionsUI();
        }
    }
    
    async clearAllImages() {
        if (this.images.length === 0) return;
        
        let confirmClear = true;
        const count = this.images.length;
        
        if (window.electronAPI) {
            const result = await window.electronAPI.showMessageBox({
                type: 'question',
                title: 'Clear All Images',
                message: `Are you sure you want to remove all ${count} image(s)?`,
                buttons: ['Cancel', 'Clear All'],
                defaultId: 0
            });
            confirmClear = result.response === 1;
        } else {
            confirmClear = confirm(`Remove all ${count} image(s)?`);
        }
        
        if (confirmClear) {
            this.images = [];
            this.selectedImages.clear();
            this.updateUI();
            this.updateBulkActionsUI();
        }
    }
    
    updateBulkActionsUI() {
        if (this.deleteSelectedBtn) {
            this.deleteSelectedBtn.style.display = this.selectedImages.size > 0 ? 'inline-block' : 'none';
        }
        if (this.selectAllBtn) {
            this.selectAllBtn.textContent = this.selectedImages.size === this.images.length && this.images.length > 0 
                ? '☐ Deselect All' 
                : '✓ Select All';
        }
    }

    async convertAll() {
        if (this.images.length === 0) {
            alert('Please upload images first');
            return;
        }

        this.convertedImages = [];
        if (this.resultsSection) this.resultsSection.style.display = 'none';
        if (this.progressSection) this.progressSection.style.display = 'block';
        if (this.progressContainer) this.progressContainer.innerHTML = '';
        if (this.convertBtn) this.convertBtn.disabled = true;

        const format = this.outputFormat.value;
        const quality = this.quality.value / 100;
        let resizeMode = this.resizeMode.value;
        const bgColor = this.backgroundColor.value === 'transparent' ? null : this.backgroundColor.value;
        const preserveTrans = this.preserveTransparency.checked;
        const autoPadding = this.autoPadding.checked;
        const autoSharpening = this.autoSharpening.checked;
        const cropShape = this.cropShape.value;
        const dpi = parseInt(this.dpi.value);

        // Get formats to generate
        let formatsToGenerate = this.convertMultipleFormats.checked
            ? Array.from(this.formatOptions).filter(opt => opt.checked).map(opt => opt.value)
            : [format];

        // Get sizes to generate based on preset
        let sizesToGenerate;
        if (this.currentPreset === 'custom-list') {
            // Use custom size list
            if (this.customSizesList.length === 0) {
                alert('Please add some custom sizes to your list first');
                if (this.convertBtn) this.convertBtn.disabled = false;
                return;
            }
            sizesToGenerate = this.customSizesList.map((size, idx) => ({
                width: size.width,
                height: size.height,
                name: size.name || `${size.width || 'auto'}x${size.height || 'auto'}`,
                format: size.format,
                quality: size.quality / 100,
                backgroundColor: size.backgroundColor,
                resizeMode: size.resizeMode,
                keepAspect: size.keepAspect
            }));
            // Use per-size formats if specified
            formatsToGenerate = [...new Set(sizesToGenerate.map(s => s.format))];
        } else if (this.currentPreset === 'none') {
            const resizeType = this.resizeType.value;
            
            if (resizeType === 'percentage') {
                const percentage = parseInt(this.resizePercentage.value) / 100;
                // Use first image as reference for percentage calculation
                const refImage = this.images[0];
                sizesToGenerate = [{
                    width: Math.round(refImage.width * percentage),
                    height: Math.round(refImage.height * percentage),
                    name: `${percentage * 100}%`
                }];
            } else if (resizeType === 'maxfilesize') {
                sizesToGenerate = [{ width: null, height: null, name: 'maxfilesize', maxSizeKB: parseInt(this.maxFileSize.value) }];
            } else if (resizeType === 'maxdimensions') {
                const maxW = parseInt(this.maxWidth.value);
                const maxH = parseInt(this.maxHeight.value);
                sizesToGenerate = [{ width: maxW, height: maxH, name: 'maxdimensions' }];
            } else {
                const customWidth = parseInt(this.resizeWidth.value);
                const customHeight = parseInt(this.resizeHeight.value);
                if (customWidth || customHeight) {
                    sizesToGenerate = [{ width: customWidth || null, height: customHeight || null, name: 'custom' }];
                } else {
                    sizesToGenerate = [{ width: null, height: null, name: 'original' }];
                }
            }
        } else {
            sizesToGenerate = this.presetSizes[this.currentPreset];
            // For presets, force fit mode to maintain aspect ratio
            resizeMode = 'fit';
        }

        let totalTasks = 0;
        let completedTasks = 0;

        for (let i = 0; i < this.images.length; i++) {
            const imageData = this.images[i];
            
            // Create progress item
            const progressItem = this.createProgressItem(imageData.name, i, sizesToGenerate.length);
            if (this.progressContainer) this.progressContainer.appendChild(progressItem);

            // Generate all sizes and formats for this image
            for (const size of sizesToGenerate) {
                // Use per-size format if available (for custom list), otherwise use format list
                const formatsForThisSize = size.format ? [size.format] : formatsToGenerate;
                
                for (const formatToUse of formatsForThisSize) {
                    totalTasks++;
                    const sizeName = size.name || `${size.width || 'auto'}x${size.height || 'auto'}`;
                    
                    try {
                        let converted;
                        
                        // Handle max file size resize
                        if (size.maxSizeKB) {
                            converted = await this.convertToMaxFileSize(
                                imageData,
                                formatToUse,
                                quality,
                                size.maxSizeKB * 1024,
                                bgColor,
                                preserveTrans,
                                sizeName,
                                (progress) => {
                                    const fill = progressItem.querySelector('.progress-fill');
                                    const currentProgress = ((completedTasks / totalTasks) * 100) + (progress / totalTasks);
                                    fill.style.width = `${currentProgress}%`;
                                    fill.textContent = `${Math.round(currentProgress)}%`;
                                }
                            );
                        } else {
                            // Use per-size settings if available (for custom list)
                            const sizeFormat = size.format || formatToUse;
                            const sizeQuality = size.quality !== undefined ? size.quality : quality;
                            const sizeResizeMode = size.resizeMode || resizeMode;
                            const sizeBgColor = size.backgroundColor || bgColor;
                            
                            // Handle keep aspect ratio for custom sizes
                            let finalWidth = size.width;
                            let finalHeight = size.height;
                            if (size.keepAspect && (finalWidth || finalHeight)) {
                                const aspect = imageData.width / imageData.height;
                                if (finalWidth && !finalHeight) {
                                    finalHeight = Math.round(finalWidth / aspect);
                                } else if (finalHeight && !finalWidth) {
                                    finalWidth = Math.round(finalHeight * aspect);
                                }
                            }

                            converted = await this.convertImage(
                                imageData,
                                sizeFormat,
                                sizeQuality,
                                sizeResizeMode,
                                finalWidth,
                                finalHeight,
                                sizeBgColor,
                                preserveTrans,
                                autoPadding,
                                autoSharpening,
                                cropShape,
                                sizeName,
                                (progress) => {
                                    const fill = progressItem.querySelector('.progress-fill');
                                    const currentProgress = ((completedTasks / totalTasks) * 100) + (progress / totalTasks);
                                    fill.style.width = `${currentProgress}%`;
                                    fill.textContent = `${Math.round(currentProgress)}%`;
                                }
                            );
                        }
                        
                        this.convertedImages.push(converted);
                        completedTasks++;
                    } catch (error) {
                        console.error('Conversion error:', error);
                        completedTasks++;
                        // Continue with other sizes/formats even if one fails
                    }
                }
            }
        }

        if (this.convertBtn) this.convertBtn.disabled = false;
        this.addToHistory();
        this.showResults();
    }

    async convertToMaxFileSize(imageData, format, quality, maxSizeBytes, bgColor, preserveTrans, sizeName, progressCallback) {
        // Binary search for optimal quality/size
        let minQuality = 0.1;
        let maxQuality = 1.0;
        let bestResult = null;
        const maxIterations = 10;

        for (let i = 0; i < maxIterations; i++) {
            const testQuality = (minQuality + maxQuality) / 2;
            progressCallback((i / maxIterations) * 100);

            const result = await this.convertImage(
                imageData,
                format,
                testQuality,
                'fit',
                imageData.width,
                imageData.height,
                bgColor,
                preserveTrans,
                false,
                false,
                'original',
                sizeName,
                () => {}
            );

            if (result.size <= maxSizeBytes) {
                bestResult = result;
                minQuality = testQuality;
            } else {
                maxQuality = testQuality;
            }

            if (Math.abs(result.size - maxSizeBytes) / maxSizeBytes < 0.05) {
                break; // Close enough
            }
        }

        if (!bestResult) {
            // Fallback: use minimum quality
            return await this.convertImage(
                imageData,
                format,
                0.1,
                'fit',
                imageData.width,
                imageData.height,
                bgColor,
                preserveTrans,
                false,
                false,
                'original',
                sizeName,
                progressCallback
            );
        }

        progressCallback(100);
        return bestResult;
    }

    createProgressItem(name, index, count = 1) {
        const item = document.createElement('div');
        item.className = 'progress-item';
        const statusText = count > 1 ? `Generating ${count} sizes...` : 'Converting...';
        item.innerHTML = `
            <div class="progress-item-header">
                <span>${name}</span>
                <span>${statusText}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%">0%</div>
            </div>
        `;
        return item;
    }

    async convertImage(imageData, format, quality, resizeMode, width, height, bgColor, preserveTrans, autoPadding, autoSharpening, cropShape, sizeName, progressCallback) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Calculate dimensions
            let finalWidth = width || imageData.width;
            let finalHeight = height || imageData.height;

            // Handle auto padding for square icons
            if (autoPadding && width && height && width === height) {
                // Keep original aspect, add padding
                const scale = Math.min(width / imageData.width, height / imageData.height);
                const scaledWidth = imageData.width * scale;
                const scaledHeight = imageData.height * scale;
                const offsetX = (width - scaledWidth) / 2;
                const offsetY = (height - scaledHeight) / 2;

                canvas.width = finalWidth;
                canvas.height = finalHeight;

                // Fill background
                if (bgColor) {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(imageData.image, offsetX, offsetY, scaledWidth, scaledHeight);
            } else {
                // Normal resize modes
                if (resizeMode === 'stretch' && width && height) {
                    finalWidth = width;
                    finalHeight = height;
                } else if (resizeMode === 'fit' && (width || height)) {
                    const scale = Math.min(
                        (width || Infinity) / imageData.width,
                        (height || Infinity) / imageData.height
                    );
                    finalWidth = Math.round(imageData.width * scale);
                    finalHeight = Math.round(imageData.height * scale);
                } else if (resizeMode === 'fill' && (width || height)) {
                    const scale = Math.max(
                        (width || 0) / imageData.width,
                        (height || 0) / imageData.height
                    );
                    finalWidth = Math.round(imageData.width * scale);
                    finalHeight = Math.round(imageData.height * scale);
                } else if (resizeMode === 'circular' && width && height) {
                    finalWidth = Math.min(width, height);
                    finalHeight = finalWidth; // Make square for circle
                } else if (!width && !height) {
                    finalWidth = imageData.width;
                    finalHeight = imageData.height;
                }

                canvas.width = finalWidth;
                canvas.height = finalHeight;

                // Set background
                if ((format === 'jpg' || format === 'jpeg') && !preserveTrans) {
                    ctx.fillStyle = bgColor || '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else if (bgColor && bgColor !== 'transparent') {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                progressCallback(30);

                // Handle circular crop
                if (resizeMode === 'circular' && cropShape === 'circle') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(finalWidth / 2, finalHeight / 2, finalWidth / 2, 0, Math.PI * 2);
                    ctx.clip();
                }

                // Handle fill mode (crop)
                if (resizeMode === 'fill' && (width || height)) {
                    const sourceWidth = imageData.width;
                    const sourceHeight = imageData.height;
                    const sourceAspect = sourceWidth / sourceHeight;
                    const targetAspect = finalWidth / finalHeight;

                    let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;

                    if (sourceAspect > targetAspect) {
                        sw = sourceHeight * targetAspect;
                        sx = (sourceWidth - sw) / 2;
                    } else {
                        sh = sourceWidth / targetAspect;
                        sy = (sourceHeight - sh) / 2;
                    }

                    ctx.drawImage(imageData.image, sx, sy, sw, sh, 0, 0, finalWidth, finalHeight);
                } else if (resizeMode === 'stretch' && width && height) {
                    ctx.drawImage(imageData.image, 0, 0, finalWidth, finalHeight);
                } else {
                    // Fit mode or custom
                    const scale = Math.min(finalWidth / imageData.width, finalHeight / imageData.height);
                    const scaledWidth = imageData.width * scale;
                    const scaledHeight = imageData.height * scale;
                    const x = (finalWidth - scaledWidth) / 2;
                    const y = (finalHeight - scaledHeight) / 2;
                    ctx.drawImage(imageData.image, x, y, scaledWidth, scaledHeight);
                }

                if (resizeMode === 'circular' && cropShape === 'circle') {
                    ctx.restore();
                }
            }

            // Apply sharpening filter if enabled
            if (autoSharpening && (finalWidth < imageData.width || finalHeight < imageData.height)) {
                const imageData_ctx = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData_ctx.data;
                
                // Simple unsharp mask approximation
                for (let i = 0; i < data.length; i += 4) {
                    // Light sharpening - can be enhanced with proper convolution
                    data[i] = Math.min(255, data[i] * 1.05);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.05);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.05);
                }
                ctx.putImageData(imageData_ctx, 0, 0);
            }

            progressCallback(70);

            // Handle SVG format separately
            if (format === 'svg') {
                // Convert canvas to base64 PNG for embedding in SVG
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to convert image'));
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64Image = reader.result;
                        // Create SVG with embedded image
                        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${finalWidth} ${finalHeight}">
    <image width="${finalWidth}" height="${finalHeight}" xlink:href="${base64Image}"/>
</svg>`;
                        
                        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
                        progressCallback(100);

                        const convertedName = this.generateFileName(imageData.name, format, sizeName);
                        
                        resolve({
                            original: imageData,
                            blob: svgBlob,
                            name: convertedName,
                            size: svgBlob.size,
                            format: format,
                            width: finalWidth,
                            height: finalHeight,
                            url: URL.createObjectURL(svgBlob)
                        });
                    };
                    reader.onerror = () => reject(new Error('Failed to read image data'));
                    reader.readAsDataURL(blob);
                }, 'image/png', 1.0); // Use PNG at max quality for embedding
                return;
            }

            // Handle formats that Canvas API doesn't support natively
            // Canvas API natively supports: PNG, JPEG, WebP (browser dependent)
            // For other formats, we'll convert to a supported format
            const normalizedFormat = this.normalizeFormat(format);
            
            // Determine which format Canvas can actually generate
            let canvasFormat = normalizedFormat;
            let canvasMimeType = this.getMimeType(canvasFormat);
            
            // Check if format is natively supported by canvas.toBlob
            // Most browsers: PNG, JPEG, WebP
            // Limited support: AVIF (Chrome/Edge only)
            // Not supported: BMP, GIF (animated), TIFF - convert to PNG
            if (!['png', 'jpg', 'jpeg', 'webp', 'avif'].includes(normalizedFormat)) {
                // Fallback to PNG for unsupported formats (BMP, GIF, TIFF)
                canvasFormat = 'png';
                canvasMimeType = 'image/png';
            }
            
            // Try to convert - some browsers may not support all formats
            canvas.toBlob((blob) => {
                if (!blob) {
                    // If conversion failed, try PNG as fallback
                    canvas.toBlob((fallbackBlob) => {
                        if (!fallbackBlob) {
                            reject(new Error('Failed to convert image'));
                            return;
                        }
                        
                        progressCallback(100);
                        const convertedName = this.generateFileName(imageData.name, normalizedFormat, sizeName);
                        
                        resolve({
                            original: imageData,
                            blob: fallbackBlob,
                            name: convertedName,
                            size: fallbackBlob.size,
                            format: normalizedFormat, // Keep requested format name
                            width: finalWidth,
                            height: finalHeight,
                            url: URL.createObjectURL(fallbackBlob)
                        });
                    }, 'image/png', quality);
                    return;
                }

                progressCallback(100);
                const convertedName = this.generateFileName(imageData.name, normalizedFormat, sizeName);
                
                resolve({
                    original: imageData,
                    blob: blob,
                    name: convertedName,
                    size: blob.size,
                    format: normalizedFormat,
                    width: finalWidth,
                    height: finalHeight,
                    url: URL.createObjectURL(blob)
                });
            }, canvasMimeType, quality);
        });
    }

    generateFileName(originalName, format, sizeName = '', index = 0) {
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const normalizedFormat = this.normalizeFormat(format);
        // Keep the requested format extension even if we convert internally
        const formatExt = normalizedFormat;
        
        const namingPattern = this.customNaming.value === 'custom' 
            ? this.customNamingPattern.value || '{name}_{width}x{height}.{format}'
            : this.customNaming.value;

        // Extract dimensions from sizeName if available
        let width = '';
        let height = '';
        if (sizeName && sizeName.includes('x')) {
            const parts = sizeName.split('x');
            width = parts[0].replace(/\D/g, '');
            height = parts[1]?.replace(/\D/g, '') || '';
        }

        let fileName = namingPattern
            .replace(/{name}/g, nameWithoutExt)
            .replace(/{width}/g, width)
            .replace(/{height}/g, height)
            .replace(/{format}/g, formatExt)
            .replace(/{index}/g, index)
            .replace(/{size}/g, sizeName || '');

        // Fallback to default if pattern didn't work
        if (fileName === namingPattern || !fileName) {
            const sizeSuffix = sizeName && sizeName !== 'custom' && sizeName !== 'original' ? `_${sizeName}` : '';
            fileName = `${nameWithoutExt}${sizeSuffix}.${formatExt}`;
        }

        return fileName;
    }

    showResults() {
        if (this.progressSection) this.progressSection.style.display = 'none';
        if (this.resultsSection) this.resultsSection.style.display = 'block';
        if (this.resultsContainer) this.resultsContainer.innerHTML = '';

        // Group by original image if using presets
        const groupedResults = {};
        this.convertedImages.forEach((converted) => {
            const originalName = converted.original.name;
            if (!groupedResults[originalName]) {
                groupedResults[originalName] = [];
            }
            groupedResults[originalName].push(converted);
        });

        Object.keys(groupedResults).forEach((originalName, groupIndex) => {
            const results = groupedResults[originalName];
            const isMultipleSizes = results.length > 1;
            
            if (isMultipleSizes) {
                // Show grouped view for multiple sizes
                const groupCard = document.createElement('div');
                groupCard.className = 'result-card result-group';
                groupCard.innerHTML = `
                    <div class="result-card-header">
                        <h4>${originalName} - ${results.length} sizes generated</h4>
                    </div>
                    <div class="results-grid">
                        ${results.map((converted, idx) => {
                            const originalSize = converted.original.originalSize;
                            const newSize = converted.size;
                            return `
                                <div class="result-item">
                                    <img src="${converted.url}" class="result-thumbnail" alt="${converted.name}">
                                    <div class="result-details">
                                        <div class="result-name">${converted.name}</div>
                                        <div class="size-info">
                                            <div><strong>${converted.width} × ${converted.height}px</strong></div>
                                            <div>${this.formatFileSize(newSize)}</div>
                                        </div>
                                        <a href="${converted.url}" download="${converted.name}" class="btn btn-primary btn-small">
                                            ⬇️ Download
                                        </a>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                this.resultsContainer.appendChild(groupCard);
                
                // Add Electron download handlers
                if (window.electronAPI) {
                    groupCard.querySelectorAll('a[download]').forEach((link, idx) => {
                        link.addEventListener('click', async (e) => {
                            e.preventDefault();
                            const converted = results[idx];
                            await this.downloadSingleFile(converted);
                        });
                    });
                }
            } else {
                // Show single comparison view
                const converted = results[0];
                const resultCard = document.createElement('div');
                resultCard.className = 'result-card';

                const originalSize = converted.original.originalSize;
                const newSize = converted.size;
                const sizeSaved = originalSize - newSize;
                const percentSaved = ((sizeSaved / originalSize) * 100).toFixed(1);

                resultCard.innerHTML = `
                    <div class="result-card-header">
                        <h4>${converted.name}</h4>
                        <a href="${converted.url}" download="${converted.name}" class="btn btn-primary">
                            ⬇️ Download
                        </a>
                    </div>
                    <div class="comparison">
                        <div class="comparison-item">
                            <h4>Before</h4>
                            <img src="${converted.original.image.src}" class="comparison-preview" alt="Original">
                            <div class="size-info">
                                <div><strong>Size:</strong> ${this.formatFileSize(originalSize)}</div>
                                <div><strong>Dimensions:</strong> ${converted.original.width} × ${converted.original.height}px</div>
                                <div><strong>Format:</strong> ${converted.original.format.toUpperCase()}</div>
                            </div>
                        </div>
                        <div class="comparison-item">
                            <h4>After</h4>
                            <img src="${converted.url}" class="comparison-preview" alt="Converted">
                            <div class="size-info">
                                <div><strong>Size:</strong> ${this.formatFileSize(newSize)}</div>
                                <div><strong>Dimensions:</strong> ${converted.width} × ${converted.height}px</div>
                                <div><strong>Format:</strong> ${converted.format.toUpperCase()}</div>
                                ${sizeSaved > 0 ? `<div class="size-saved">💾 Saved: ${this.formatFileSize(sizeSaved)} (${percentSaved}%)</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;

                this.resultsContainer.appendChild(resultCard);
                
                // Add Electron download handler
                if (window.electronAPI) {
                    const downloadLink = resultCard.querySelector('a[download]');
                    if (downloadLink) {
                        downloadLink.addEventListener('click', async (e) => {
                            e.preventDefault();
                            await this.downloadSingleFile(converted);
                        });
                    }
                }
            }
        });

        // Show download all button if multiple files
        if (this.convertedImages.length > 1) {
            this.downloadAllBtn.style.display = 'inline-block';
            this.downloadAllBtn.textContent = `📦 Download All (${this.convertedImages.length} files) as ZIP`;
        } else {
            this.downloadAllBtn.style.display = 'none';
        }
    }

    async downloadSingleFile(converted) {
        if (window.electronAPI) {
            // Electron desktop app
            try {
                const blob = await fetch(converted.url).then(r => r.blob());
                const arrayBuffer = await blob.arrayBuffer();
                const BufferClass = window.electronAPI.Buffer || Buffer;
                const buffer = BufferClass.from(arrayBuffer);
                
                const result = await window.electronAPI.saveFileDialog(converted.name);
                if (!result.canceled && result.path) {
                    await window.electronAPI.writeFile(result.path, buffer);
                    await window.electronAPI.showMessageBox({
                        type: 'info',
                        title: 'Success',
                        message: `File saved successfully!`
                    });
                }
            } catch (error) {
                console.error('Download error:', error);
                await window.electronAPI.showMessageBox({
                    type: 'error',
                    title: 'Error',
                    message: `Failed to save file: ${error.message}`
                });
            }
        } else if (this.isChromeExtension) {
            // Chrome extension - use chrome.downloads API
            try {
                // Get download settings
                const settings = await new Promise((resolve) => {
                    chrome.storage.local.get(['askSaveLocation', 'downloadFolder'], resolve);
                });
                
                const blob = await fetch(converted.url).then(r => r.blob());
                const blobUrl = URL.createObjectURL(blob);
                
                let filename = converted.name;
                if (settings.downloadFolder) {
                    filename = `${settings.downloadFolder}/${converted.name}`;
                }
                
                chrome.downloads.download({
                    url: blobUrl,
                    filename: filename,
                    saveAs: settings.askSaveLocation !== false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error('Download error:', chrome.runtime.lastError);
                        alert(`Failed to download: ${chrome.runtime.lastError.message}`);
                    } else {
                        // Show notification if enabled
                        chrome.storage.local.get(['showNotifications'], (result) => {
                            if (result.showNotifications !== false) {
                                chrome.notifications.create({
                                    type: 'basic',
                                    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                                    title: 'Download Started',
                                    message: `Downloading ${converted.name}`
                                });
                            }
                        });
                    }
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                });
            } catch (error) {
                console.error('Download error:', error);
                alert(`Failed to download: ${error.message}`);
            }
        } else {
            // Browser fallback - let the link work normally
            return;
        }
    }

    async downloadAll() {
        if (this.convertedImages.length === 0) return;

        const zipFormat = this.zipFormat.value;

        if (zipFormat === 'individual') {
            // Download individually
            if (window.electronAPI) {
                // Use Electron save dialogs
                for (const converted of this.convertedImages) {
                    try {
                        const blob = await fetch(converted.url).then(r => r.blob());
                        const arrayBuffer = await blob.arrayBuffer();
                        // Use Buffer from electronAPI if available
                        const BufferClass = window.electronAPI.Buffer || Buffer;
                        const buffer = BufferClass.from(arrayBuffer);
                        
                        const result = await window.electronAPI.saveFileDialog(converted.name);
                        if (!result.canceled && result.path) {
                            await window.electronAPI.writeFile(result.path, buffer);
                        }
                    } catch (error) {
                        console.error(`Error saving ${converted.name}:`, error);
                    }
                }
            } else {
                // Browser fallback
                this.convertedImages.forEach(converted => {
                    const link = document.createElement('a');
                    link.href = converted.url;
                    link.download = converted.name;
                    link.click();
                });
            }
            return;
        }

        // Create ZIP - Wait for JSZip to load if needed
        let JSZipLoaded = typeof JSZip !== 'undefined';
        if (!JSZipLoaded) {
            // Wait a bit for script to load
            await new Promise(resolve => setTimeout(resolve, 100));
            JSZipLoaded = typeof JSZip !== 'undefined';
        }
        
        if (!JSZipLoaded) {
            const message = 'ZIP library not loaded. Please refresh the page.';
            if (this.isChromeExtension && chrome.notifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                    title: 'Error',
                    message: message
                });
            } else if (window.electronAPI) {
                await window.electronAPI.showMessageBox({ type: 'error', message });
            } else {
                alert(message);
            }
            return;
        }

        const zip = new JSZip();
        const organizeByFormat = this.organizeByFormat.checked;
        const organizeBySize = this.organizeBySize.checked;
        
        for (const converted of this.convertedImages) {
            const blob = await fetch(converted.url).then(r => r.blob());
            
            let filePath = converted.name;
            
            if (organizeByFormat) {
                filePath = `${converted.format.toUpperCase()}/${filePath}`;
            }
            
            if (organizeBySize) {
                const sizeFolder = `${converted.width}x${converted.height}`;
                filePath = organizeByFormat 
                    ? `${converted.format.toUpperCase()}/${sizeFolder}/${converted.name}`
                    : `${sizeFolder}/${filePath}`;
            }
            
            zip.file(filePath, blob);
        }

        // Add readme if organized
        if (organizeByFormat || organizeBySize) {
            const readme = `Image Converter Pro - Generated Files\n` +
                          `Generated: ${new Date().toLocaleString()}\n` +
                          `Total files: ${this.convertedImages.length}\n`;
            zip.file('readme.txt', readme);
        }

        const compressionLevel = this.zipCompressionLevel.value === 'fast' ? 1 : 
                                this.zipCompressionLevel.value === 'maximum' ? 9 : 6;
        
        const zipFileName = this.zipFileName.value.trim() || `converted_images_${Date.now()}`;
        
        if (window.electronAPI) {
            // Use nodebuffer for Electron
            let zipBuffer = await zip.generateAsync({ 
                type: 'nodebuffer',
                compression: 'DEFLATE',
                compressionOptions: { level: compressionLevel }
            });
            
            // Ensure it's a proper Buffer (JSZip might return Uint8Array)
            const BufferClass = window.electronAPI.Buffer || Buffer;
            if (!BufferClass.isBuffer(zipBuffer)) {
                zipBuffer = BufferClass.from(zipBuffer);
            }
            
            const result = await window.electronAPI.saveZipDialog(`${zipFileName}.zip`);
            if (!result.canceled && result.path) {
                await window.electronAPI.writeFile(result.path, zipBuffer);
                await window.electronAPI.showMessageBox({
                    type: 'info',
                    title: 'Success',
                    message: `ZIP file saved successfully!`
                });
            }
        } else if (this.isChromeExtension) {
            // Chrome extension - use blob and chrome.downloads
            // Get download settings
            const settings = await new Promise((resolve) => {
                chrome.storage.local.get(['askSaveLocation', 'downloadFolder', 'showConversionComplete'], resolve);
            });
            
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: compressionLevel }
            });
            
            const zipUrl = URL.createObjectURL(zipBlob);
            
            let filename = `${zipFileName}.zip`;
            if (settings.downloadFolder) {
                filename = `${settings.downloadFolder}/${zipFileName}.zip`;
            }
            
            chrome.downloads.download({
                url: zipUrl,
                filename: filename,
                saveAs: settings.askSaveLocation !== false
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error('Download error:', chrome.runtime.lastError);
                    alert(`Failed to download ZIP: ${chrome.runtime.lastError.message}`);
                } else {
                    console.log('ZIP download started:', downloadId);
                    // Show notification if enabled
                    if (settings.showConversionComplete !== false) {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                            title: 'Conversion Complete',
                            message: `Downloaded ${this.convertedImages.length} files as ZIP`
                        });
                    }
                }
                setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);
            });
        } else {
            // Browser fallback
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: compressionLevel }
            });
            
            const zipUrl = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = `${zipFileName}.zip`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(zipUrl), 100);
        }
    }

    clearAll() {
        this.images = [];
        this.convertedImages = [];
        this.customSizesList = [];
        this.selectedImages.clear();
        this.settingsPanel.style.display = 'none';
        if (this.imagesGrid) this.imagesGrid.style.display = 'none';
        if (this.progressSection) this.progressSection.style.display = 'none';
        if (this.resultsSection) this.resultsSection.style.display = 'none';
        if (this.customSizeListSection) this.customSizeListSection.style.display = 'none';
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        this.updateCustomSizesListUI();
        this.updateBulkActionsUI();
        this.updateQuickActions();
    }

    addToHistory() {
        if (this.convertedImages.length === 0) return;
        
        const historyEntry = {
            timestamp: Date.now(),
            count: this.convertedImages.length,
            formats: [...new Set(this.convertedImages.map(img => img.format))],
            preview: this.convertedImages[0].url
        };
        
        this.conversionHistory.push(historyEntry);
        this.saveHistory();
    }

    toggleHistory() {
        if (this.historySection.style.display === 'none') {
            this.displayHistory();
            this.historySection.style.display = 'block';
        } else {
            this.historySection.style.display = 'none';
        }
    }

    displayHistory() {
        this.historyList.innerHTML = '';
        
        if (this.conversionHistory.length === 0) {
            this.historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No conversion history yet</p>';
            return;
        }

        this.conversionHistory.slice().reverse().forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            const date = new Date(entry.timestamp);
            item.innerHTML = `
                <img src="${entry.preview}" alt="Preview">
                <div style="font-weight: 600; margin-top: 5px;">${entry.count} file(s)</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${date.toLocaleString()}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${entry.formats.join(', ').toUpperCase()}</div>
            `;
            this.historyList.appendChild(item);
        });
    }

    clearHistory() {
        if (confirm('Clear all conversion history?')) {
            this.conversionHistory = [];
            this.saveHistory();
            this.displayHistory();
        }
    }

    showPresetModal() {
        this.presetModal.style.display = 'flex';
        this.presetName.value = '';
        this.presetName.focus();
    }

    closePresetModal() {
        this.presetModal.style.display = 'none';
    }

    saveCurrentPreset() {
        const name = this.presetName.value.trim();
        if (!name) {
            alert('Please enter a preset name');
            return;
        }

        const preset = {
            name: name,
            outputFormat: this.outputFormat.value,
            quality: this.quality.value,
            resizeMode: this.resizeMode.value,
            resizeType: this.resizeType.value,
            resizeWidth: this.resizeWidth.value,
            resizeHeight: this.resizeHeight.value,
            backgroundColor: this.backgroundColor.value,
            preserveTransparency: this.preserveTransparency.checked,
            autoPadding: this.autoPadding.checked,
            autoSharpening: this.autoSharpening.checked,
            customNaming: this.customNaming.value,
            customNamingPattern: this.customNamingPattern.value,
            timestamp: Date.now()
        };

        this.userPresets[name] = preset;
        this.saveUserPresets();
        this.updateUserPresetsUI();
        this.closePresetModal();
    }

    updateUserPresetsUI() {
        this.userPresetsList.innerHTML = '';
        
        if (Object.keys(this.userPresets).length === 0) {
            this.userPresetsSection.style.display = 'none';
            return;
        }

        this.userPresetsSection.style.display = 'block';
        
        Object.keys(this.userPresets).forEach(presetName => {
            const btn = document.createElement('button');
            btn.className = 'user-preset-btn';
            btn.textContent = presetName;
            btn.innerHTML = `${presetName} <span class="delete-preset" data-preset="${presetName}">×</span>`;
            
            btn.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-preset')) {
                    e.stopPropagation();
                    this.deletePreset(presetName);
                    return;
                }
                this.applyPreset(presetName);
            });
            
            this.userPresetsList.appendChild(btn);
        });
    }

    applyPreset(presetName) {
        const preset = this.userPresets[presetName];
        if (!preset) return;

        // Handle custom size list presets
        if (preset.type === 'custom-size-list' && preset.sizes) {
            this.customSizesList = JSON.parse(JSON.stringify(preset.sizes));
            this.updateCustomSizesListUI();
            this.selectPreset('custom-list');
            return;
        }

        // Handle regular presets
        this.outputFormat.value = preset.outputFormat || 'png';
        this.quality.value = preset.quality || 80;
        this.qualityValue.textContent = preset.quality || 80;
        this.resizeMode.value = preset.resizeMode || 'fit';
        this.resizeType.value = preset.resizeType || 'pixels';
        this.resizeWidth.value = preset.resizeWidth || '';
        this.resizeHeight.value = preset.resizeHeight || '';
        this.backgroundColor.value = preset.backgroundColor || '#ffffff';
        this.preserveTransparency.checked = preset.preserveTransparency !== false;
        this.autoPadding.checked = preset.autoPadding || false;
        this.autoSharpening.checked = preset.autoSharpening || false;
        this.customNaming.value = preset.customNaming || 'original_size';
        this.customNamingPattern.value = preset.customNamingPattern || '';

        this.selectPreset('none');
        this.resizeType.dispatchEvent(new Event('change'));
        this.customNaming.dispatchEvent(new Event('change'));
    }

    deletePreset(presetName) {
        if (confirm(`Delete preset "${presetName}"?`)) {
            delete this.userPresets[presetName];
            this.saveUserPresets();
            this.updateUserPresetsUI();
        }
    }

    normalizeFormat(format) {
        // Normalize format names
        const formatLower = format.toLowerCase();
        if (formatLower === 'jpeg') return 'jpg';
        return formatLower;
    }

    getMimeType(format) {
        const normalized = this.normalizeFormat(format);
        const mimeTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp',
            'gif': 'image/gif',
            'ico': 'image/png', // ICO is converted to PNG
            'avif': 'image/avif',
            'tiff': 'image/tiff'
        };
        return mimeTypes[normalized] || 'image/png';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // ========== NEW FEATURES ==========

    // Show/hide quick actions toolbar
    updateQuickActions() {
        if (this.quickActions) {
            this.quickActions.style.display = this.images.length > 0 ? 'block' : 'none';
        }
    }
    

    // Crop functionality
    openCropModal() {
        if (this.images.length === 0) {
            alert('Please upload an image first');
            return;
        }
        const image = this.images[0]; // Crop first image
        this.currentEditingImageIndex = 0;
        const modal = document.getElementById('cropModal');
        const canvas = document.getElementById('cropCanvas');
        const cropX = document.getElementById('cropX');
        const cropY = document.getElementById('cropY');
        const cropWidth = document.getElementById('cropWidth');
        const cropHeight = document.getElementById('cropHeight');
        
        if (!modal || !canvas || !cropX || !cropY || !cropWidth || !cropHeight) {
            console.error('Crop modal elements not found');
            return;
        }
        
        // Use the image element directly if available, otherwise create from file
        const img = image.image || new Image();
        
        if (image.image && image.image.complete) {
            // Image is already loaded
            const maxWidth = 700;
            const scale = Math.min(maxWidth / image.image.width, 1);
            canvas.width = image.image.width * scale;
            canvas.height = image.image.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image.image, 0, 0, canvas.width, canvas.height);
            
            // Initialize crop values
            cropX.value = 0;
            cropY.value = 0;
            cropWidth.value = Math.floor(canvas.width);
            cropHeight.value = Math.floor(canvas.height);
            
            // Add event listeners for crop controls
            cropX.addEventListener('input', () => this.updateCropPreview());
            cropY.addEventListener('input', () => this.updateCropPreview());
            cropWidth.addEventListener('input', () => this.updateCropPreview());
            cropHeight.addEventListener('input', () => this.updateCropPreview());
            
            this.updateCropPreview();
            modal.style.display = 'flex';
        } else {
            // Load image from file
            if (image.file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.onload = () => {
                        const maxWidth = 700;
                        const scale = Math.min(maxWidth / img.width, 1);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // Initialize crop values
                        cropX.value = 0;
                        cropY.value = 0;
                        cropWidth.value = Math.floor(canvas.width);
                        cropHeight.value = Math.floor(canvas.height);
                        
                        // Add event listeners for crop controls
                        cropX.addEventListener('input', () => this.updateCropPreview());
                        cropY.addEventListener('input', () => this.updateCropPreview());
                        cropWidth.addEventListener('input', () => this.updateCropPreview());
                        cropHeight.addEventListener('input', () => this.updateCropPreview());
                        
                        this.updateCropPreview();
                    };
                    img.onerror = () => {
                        alert('Failed to load image for cropping');
                    };
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                    alert('Failed to read image file');
                };
                reader.readAsDataURL(image.file);
            } else {
                alert('Image data not available');
                return;
            }
            modal.style.display = 'flex';
        }
    }

    updateCropPreview() {
        const canvas = document.getElementById('cropCanvas');
        if (!canvas || this.currentEditingImageIndex === null || !this.images[this.currentEditingImageIndex]) return;
        
        const ctx = canvas.getContext('2d');
        const cropX = document.getElementById('cropX');
        const cropY = document.getElementById('cropY');
        const cropWidth = document.getElementById('cropWidth');
        const cropHeight = document.getElementById('cropHeight');
        
        if (!cropX || !cropY || !cropWidth || !cropHeight) return;
        
        const x = parseInt(cropX.value) || 0;
        const y = parseInt(cropY.value) || 0;
        const w = parseInt(cropWidth.value) || 100;
        const h = parseInt(cropHeight.value) || 100;
        
        // Redraw image
        const image = this.images[this.currentEditingImageIndex];
        const drawPreview = (imgElement) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
            
            // Draw crop overlay
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
            
            // Draw corner handles
            const handleSize = 8;
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
            ctx.fillRect(x + w - handleSize/2, y - handleSize/2, handleSize, handleSize);
            ctx.fillRect(x - handleSize/2, y + h - handleSize/2, handleSize, handleSize);
            ctx.fillRect(x + w - handleSize/2, y + h - handleSize/2, handleSize, handleSize);
        };
        
        if (image.image && image.image.complete) {
            drawPreview(image.image);
        } else if (image.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => drawPreview(img);
                img.onerror = () => console.error('Failed to load image for crop preview');
                img.src = e.target.result;
            };
            reader.readAsDataURL(image.file);
        }
    }

    applyCrop() {
        if (this.currentEditingImageIndex === null) return;
        const image = this.images[this.currentEditingImageIndex];
        if (!image) return;
        
        const cropCanvas = document.getElementById('cropCanvas');
        const cropX = document.getElementById('cropX');
        const cropY = document.getElementById('cropY');
        const cropWidth = document.getElementById('cropWidth');
        const cropHeight = document.getElementById('cropHeight');
        
        if (!cropCanvas || !cropX || !cropY || !cropWidth || !cropHeight) return;
        
        const x = parseInt(cropX.value) || 0;
        const y = parseInt(cropY.value) || 0;
        const w = parseInt(cropWidth.value) || 100;
        const h = parseInt(cropHeight.value) || 100;
        
        const processCrop = (imgElement) => {
            const scale = imgElement.width / cropCanvas.width;
            const actualX = x * scale;
            const actualY = y * scale;
            const actualW = w * scale;
            const actualH = h * scale;
            
            const canvas = document.createElement('canvas');
            canvas.width = actualW;
            canvas.height = actualH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, actualX, actualY, actualW, actualH, 0, 0, actualW, actualH);
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    alert('Failed to crop image. Please try again.');
                    return;
                }
                // Update image data
                image.file = blob;
                // Create new image element from blob
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newImg = new Image();
                    newImg.onload = () => {
                        image.image = newImg;
                        image.width = newImg.width;
                        image.height = newImg.height;
                        image.originalSize = blob.size;
                        this.updateImageGrid();
                        this.closeModal('cropModal');
                    };
                    newImg.src = e.target.result;
                };
                reader.readAsDataURL(blob);
            }, 'image/png');
        };
        
        if (image.image && image.image.complete) {
            processCrop(image.image);
        } else if (image.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => processCrop(img);
                img.onerror = () => alert('Failed to load image for cropping');
                img.src = e.target.result;
            };
            reader.readAsDataURL(image.file);
        } else {
            alert('Image data not available');
        }
    }

    resetCrop() {
        const canvas = document.getElementById('cropCanvas');
        const cropX = document.getElementById('cropX');
        const cropY = document.getElementById('cropY');
        const cropWidth = document.getElementById('cropWidth');
        const cropHeight = document.getElementById('cropHeight');
        
        if (!canvas || !cropX || !cropY || !cropWidth || !cropHeight) return;
        
        cropX.value = 0;
        cropY.value = 0;
        cropWidth.value = Math.floor(canvas.width);
        cropHeight.value = Math.floor(canvas.height);
        this.updateCropPreview();
    }

    // Rotate and Flip
    rotateImage(degrees) {
        if (this.images.length === 0) {
            alert('Please upload an image first');
            return;
        }
        const image = this.images[0];
        if (!image) return;
        
        const processRotation = (imgElement) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (degrees === 90 || degrees === -90) {
                canvas.width = imgElement.height;
                canvas.height = imgElement.width;
            } else {
                canvas.width = imgElement.width;
                canvas.height = imgElement.height;
            }
            
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(degrees * Math.PI / 180);
            ctx.drawImage(imgElement, -imgElement.width / 2, -imgElement.height / 2);
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    alert('Failed to rotate image. Please try again.');
                    return;
                }
                // Update image data
                image.file = blob;
                // Create new image element from blob
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newImg = new Image();
                    newImg.onload = () => {
                        image.image = newImg;
                        image.width = newImg.width;
                        image.height = newImg.height;
                        image.originalSize = blob.size;
                        this.updateImageGrid();
                    };
                    newImg.src = e.target.result;
                };
                reader.readAsDataURL(blob);
            }, 'image/png');
        };
        
        if (image.image && image.image.complete) {
            processRotation(image.image);
        } else if (image.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => processRotation(img);
                img.onerror = () => alert('Failed to load image for rotation');
                img.src = e.target.result;
            };
            reader.readAsDataURL(image.file);
        } else {
            alert('Image data not available');
        }
    }

    flipImage(direction) {
        if (this.images.length === 0) {
            alert('Please upload an image first');
            return;
        }
        const image = this.images[0];
        if (!image) return;
        
        const processFlip = (imgElement) => {
            const canvas = document.createElement('canvas');
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            const ctx = canvas.getContext('2d');
            
            if (direction === 'horizontal') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(0, canvas.height);
                ctx.scale(1, -1);
            }
            
            ctx.drawImage(imgElement, 0, 0);
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    alert('Failed to flip image. Please try again.');
                    return;
                }
                // Update image data
                image.file = blob;
                // Create new image element from blob
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newImg = new Image();
                    newImg.onload = () => {
                        image.image = newImg;
                        image.width = newImg.width;
                        image.height = newImg.height;
                        image.originalSize = blob.size;
                        this.updateImageGrid();
                    };
                    newImg.src = e.target.result;
                };
                reader.readAsDataURL(blob);
            }, 'image/png');
        };
        
        if (image.image && image.image.complete) {
            processFlip(image.image);
        } else if (image.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => processFlip(img);
                img.onerror = () => alert('Failed to load image for flipping');
                img.src = e.target.result;
            };
            reader.readAsDataURL(image.file);
        } else {
            alert('Image data not available');
        }
    }

    // Optimize compression
    openOptimizeModal() {
        if (this.images.length === 0) {
            alert('Please upload an image first');
            return;
        }
        const image = this.images[0];
        if (!image) return;
        
        this.currentEditingImageIndex = 0;
        const modal = document.getElementById('optimizeModal');
        const beforePreview = document.getElementById('optimizeBeforePreview');
        const beforeSize = document.getElementById('optimizeBeforeSize');
        
        if (!modal || !beforePreview || !beforeSize) {
            console.error('Optimize modal elements not found');
            return;
        }
        
        // Clear previous content
        beforePreview.innerHTML = '<p style="color: var(--text-secondary);">Loading...</p>';
        
        // Load image using Image object to handle blob URLs properly
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            // Create a canvas to display the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxWidth = 400;
            const maxHeight = 300;
            let width = img.width;
            let height = img.height;
            
            // Scale down if too large
            if (width > maxWidth || height > maxHeight) {
                const scale = Math.min(maxWidth / width, maxHeight / height);
                width = width * scale;
                height = height * scale;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Display the canvas
            beforePreview.innerHTML = '';
            beforePreview.appendChild(canvas);
        };
        
        img.onerror = () => {
            // Try to load as blob URL or data URL
            if (image.file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img2 = new Image();
                    img2.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const maxWidth = 400;
                        const maxHeight = 300;
                        let width = img2.width;
                        let height = img2.height;
                        
                        if (width > maxWidth || height > maxHeight) {
                            const scale = Math.min(maxWidth / width, maxHeight / height);
                            width = width * scale;
                            height = height * scale;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img2, 0, 0, width, height);
                        beforePreview.innerHTML = '';
                        beforePreview.appendChild(canvas);
                    };
                    img2.onerror = () => {
                        beforePreview.innerHTML = '<p style="color: var(--danger);">Failed to load image</p>';
                    };
                    img2.src = e.target.result;
                };
                reader.onerror = () => {
                    beforePreview.innerHTML = '<p style="color: var(--danger);">Failed to read image file</p>';
                };
                reader.readAsDataURL(image.file);
            } else {
                beforePreview.innerHTML = '<p style="color: var(--danger);">Failed to load image</p>';
            }
        };
        
        // Load image from image element or file
        if (image.image && image.image.complete) {
            // Create data URL from image element
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = image.image.width;
            tempCanvas.height = image.image.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(image.image, 0, 0);
            img.src = tempCanvas.toDataURL();
        } else if (image.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(image.file);
        } else {
            beforePreview.innerHTML = '<p style="color: var(--danger);">Image data not available</p>';
        }
        
        if (image.file) {
            beforeSize.textContent = `Size: ${this.formatFileSize(image.file.size)}`;
        } else {
            beforeSize.textContent = 'Size: Unknown';
        }
        
        // Wait a bit for image to load, then update preview
        setTimeout(() => {
            this.updateOptimizePreview();
        }, 100);
        
        modal.style.display = 'flex';
    }

    updateOptimizePreview() {
        if (this.currentEditingImageIndex === null) return;
        const image = this.images[this.currentEditingImageIndex];
        if (!image) return;
        
        const optimizeQuality = document.getElementById('optimizeQuality');
        const afterPreview = document.getElementById('optimizeAfterPreview');
        const afterSize = document.getElementById('optimizeAfterSize');
        
        if (!optimizeQuality || !afterPreview || !afterSize) return;
        
        const quality = parseInt(optimizeQuality.value) || 80;
        
        // Show loading state
        afterPreview.innerHTML = '<p style="color: var(--text-secondary);">Generating preview...</p>';
        
        // Function to process image
        const processImage = (imageSrc) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (!blob) {
                        afterPreview.innerHTML = '<p style="color: var(--danger);">Failed to generate preview</p>';
                        return;
                    }
                    
                    // Create preview canvas
                    const previewCanvas = document.createElement('canvas');
                    const previewCtx = previewCanvas.getContext('2d');
                    const maxWidth = 400;
                    const maxHeight = 300;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const scale = Math.min(maxWidth / width, maxHeight / height);
                        width = width * scale;
                        height = height * scale;
                    }
                    
                    previewCanvas.width = width;
                    previewCanvas.height = height;
                    previewCtx.drawImage(img, 0, 0, width, height);
                    
                    afterPreview.innerHTML = '';
                    afterPreview.appendChild(previewCanvas);
                    
                    const originalSize = image.file?.size || blob.size;
                    const saved = originalSize > blob.size ? Math.round((1 - blob.size / originalSize) * 100) : 0;
                    afterSize.textContent = `Size: ${this.formatFileSize(blob.size)}${saved > 0 ? ` (${saved}% smaller)` : ''}`;
                }, 'image/jpeg', quality / 100);
            };
            
            img.onerror = () => {
                // Try loading from file if URL fails
                if (image.file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img2 = new Image();
                        img2.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img2.width;
                            canvas.height = img2.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img2, 0, 0);
                            
                            canvas.toBlob((blob) => {
                                if (!blob) {
                                    afterPreview.innerHTML = '<p style="color: var(--danger);">Failed to generate preview</p>';
                                    return;
                                }
                                
                                const previewCanvas = document.createElement('canvas');
                                const previewCtx = previewCanvas.getContext('2d');
                                const maxWidth = 400;
                                const maxHeight = 300;
                                let width = img2.width;
                                let height = img2.height;
                                
                                if (width > maxWidth || height > maxHeight) {
                                    const scale = Math.min(maxWidth / width, maxHeight / height);
                                    width = width * scale;
                                    height = height * scale;
                                }
                                
                                previewCanvas.width = width;
                                previewCanvas.height = height;
                                previewCtx.drawImage(img2, 0, 0, width, height);
                                
                                afterPreview.innerHTML = '';
                                afterPreview.appendChild(previewCanvas);
                                
                                const originalSize = image.file?.size || blob.size;
                                const saved = originalSize > blob.size ? Math.round((1 - blob.size / originalSize) * 100) : 0;
                                afterSize.textContent = `Size: ${this.formatFileSize(blob.size)}${saved > 0 ? ` (${saved}% smaller)` : ''}`;
                            }, 'image/jpeg', quality / 100);
                        };
                        img2.onerror = () => {
                            afterPreview.innerHTML = '<p style="color: var(--danger);">Failed to load image</p>';
                        };
                        img2.src = e.target.result;
                    };
                    reader.onerror = () => {
                        afterPreview.innerHTML = '<p style="color: var(--danger);">Failed to read image file</p>';
                    };
                    reader.readAsDataURL(image.file);
                } else {
                    afterPreview.innerHTML = '<p style="color: var(--danger);">Failed to load image</p>';
                }
            };
            
            img.src = imageSrc;
        };
        
        // Try to load from URL first
        if (image.url) {
            processImage(image.url);
        } else if (image.file) {
            // If no URL, read from file
            const reader = new FileReader();
            reader.onload = (e) => {
                processImage(e.target.result);
            };
            reader.onerror = () => {
                afterPreview.innerHTML = '<p style="color: var(--danger);">Failed to read image file</p>';
            };
            reader.readAsDataURL(image.file);
        } else {
            afterPreview.innerHTML = '<p style="color: var(--danger);">No image data available</p>';
        }
    }

    applyOptimization() {
        if (this.currentEditingImageIndex === null) return;
        const image = this.images[this.currentEditingImageIndex];
        const quality = parseInt(document.getElementById('optimizeQuality').value) || 80;
        
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                image.url = url;
                image.file = blob;
                this.updateImageGrid();
                this.closeModal('optimizeModal');
            }, 'image/jpeg', quality / 100);
        };
        img.src = image.url;
    }

    // Watermark
    openWatermarkModal() {
        if (this.images.length === 0) {
            alert('Please upload an image first');
            return;
        }
        this.currentEditingImageIndex = 0;
        const modal = document.getElementById('watermarkModal');
        if (!modal) {
            console.error('Watermark modal not found');
            return;
        }
        this.updateWatermarkPreview();
        modal.style.display = 'flex';
    }

    updateWatermarkPreview() {
        if (this.currentEditingImageIndex === null) return;
        const image = this.images[this.currentEditingImageIndex];
        if (!image) return;
        
        const canvas = document.getElementById('watermarkPreview');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const watermarkType = document.getElementById('watermarkType');
        const watermarkPosition = document.getElementById('watermarkPosition');
        const watermarkOpacity = document.getElementById('watermarkOpacity');
        const watermarkText = document.getElementById('watermarkText');
        const watermarkFontSize = document.getElementById('watermarkFontSize');
        const watermarkColor = document.getElementById('watermarkColor');
        
        if (!watermarkType || !watermarkPosition || !watermarkOpacity) return;
        
        const drawWatermark = (imgElement) => {
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            ctx.drawImage(imgElement, 0, 0);
            
            const type = watermarkType.value;
            const position = watermarkPosition.value;
            const opacity = parseInt(watermarkOpacity.value) / 100;
            
            ctx.globalAlpha = opacity;
            
            if (type === 'text' && watermarkText && watermarkFontSize && watermarkColor) {
                const text = watermarkText.value || '© 2024';
                const fontSize = parseInt(watermarkFontSize.value) || 24;
                const color = watermarkColor.value || '#ffffff';
                
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = color;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                
                const metrics = ctx.measureText(text);
                let x, y;
                
                switch(position) {
                    case 'top-left': x = 20; y = fontSize + 20; break;
                    case 'top-right': x = canvas.width - metrics.width - 20; y = fontSize + 20; break;
                    case 'bottom-left': x = 20; y = canvas.height - 20; break;
                    case 'bottom-right': x = canvas.width - metrics.width - 20; y = canvas.height - 20; break;
                    default: x = (canvas.width - metrics.width) / 2; y = canvas.height / 2;
                }
                
                ctx.strokeText(text, x, y);
                ctx.fillText(text, x, y);
            }
            
            ctx.globalAlpha = 1.0;
        };
        
        if (image.image && image.image.complete) {
            drawWatermark(image.image);
        } else if (image.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => drawWatermark(img);
                img.onerror = () => console.error('Failed to load image for watermark preview');
                img.src = e.target.result;
            };
            reader.readAsDataURL(image.file);
        }
    }

    applyWatermark() {
        if (this.currentEditingImageIndex === null) return;
        const image = this.images[this.currentEditingImageIndex];
        if (!image) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const watermarkType = document.getElementById('watermarkType');
        const watermarkPosition = document.getElementById('watermarkPosition');
        const watermarkOpacity = document.getElementById('watermarkOpacity');
        const watermarkText = document.getElementById('watermarkText');
        const watermarkFontSize = document.getElementById('watermarkFontSize');
        const watermarkColor = document.getElementById('watermarkColor');
        
        if (!watermarkType || !watermarkPosition || !watermarkOpacity) return;
        
        const processWatermark = (imgElement) => {
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            ctx.drawImage(imgElement, 0, 0);
            
            const type = watermarkType.value;
            const position = watermarkPosition.value;
            const opacity = parseInt(watermarkOpacity.value) / 100;
            
            ctx.globalAlpha = opacity;
            
            if (type === 'text' && watermarkText && watermarkFontSize && watermarkColor) {
                const text = watermarkText.value || '© 2024';
                const fontSize = parseInt(watermarkFontSize.value) || 24;
                const color = watermarkColor.value || '#ffffff';
                
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = color;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                
                const metrics = ctx.measureText(text);
                let x, y;
                
                switch(position) {
                    case 'top-left': x = 20; y = fontSize + 20; break;
                    case 'top-right': x = canvas.width - metrics.width - 20; y = fontSize + 20; break;
                    case 'bottom-left': x = 20; y = canvas.height - 20; break;
                    case 'bottom-right': x = canvas.width - metrics.width - 20; y = canvas.height - 20; break;
                    default: x = (canvas.width - metrics.width) / 2; y = canvas.height / 2;
                }
                
                ctx.strokeText(text, x, y);
                ctx.fillText(text, x, y);
            }
            
            ctx.globalAlpha = 1.0;
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    alert('Failed to apply watermark. Please try again.');
                    return;
                }
                // Update image data
                image.file = blob;
                // Create new image element from blob
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newImg = new Image();
                    newImg.onload = () => {
                        image.image = newImg;
                        image.width = newImg.width;
                        image.height = newImg.height;
                        image.originalSize = blob.size;
                        this.updateImageGrid();
                        this.closeModal('watermarkModal');
                    };
                    newImg.src = e.target.result;
                };
                reader.readAsDataURL(blob);
            }, 'image/png');
        };
        
        if (image.image && image.image.complete) {
            processWatermark(image.image);
        } else if (image.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => processWatermark(img);
                img.onerror = () => alert('Failed to load image for watermarking');
                img.src = e.target.result;
            };
            reader.readAsDataURL(image.file);
        } else {
            alert('Image data not available');
        }
    }

    // Metadata viewer
    async openMetadataModal() {
        if (this.images.length === 0) {
            alert('Please upload an image first');
            return;
        }
        const image = this.images[0];
        const modal = document.getElementById('metadataModal');
        const content = document.getElementById('metadataContent');
        
        content.innerHTML = '<p>Loading metadata...</p>';
        modal.style.display = 'flex';
        
        const metadata = {
            name: image.name || 'Unknown',
            size: image.file ? this.formatFileSize(image.file.size) : 'Unknown',
            type: image.file?.type || 'Unknown',
            dimensions: 'Loading...'
        };
        
        // Load image dimensions from image element or file
        if (image.image && image.image.complete) {
            metadata.dimensions = `${image.image.width} × ${image.image.height} pixels`;
            this.displayMetadata(metadata);
        } else if (image.file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    metadata.dimensions = `${img.width} × ${img.height} pixels`;
                    this.displayMetadata(metadata);
                };
                img.onerror = () => {
                    metadata.dimensions = 'Unable to load';
                    this.displayMetadata(metadata);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(image.file);
        } else {
            metadata.dimensions = 'Unknown';
            this.displayMetadata(metadata);
        }
    }

    displayMetadata(metadata) {
        const content = document.getElementById('metadataContent');
        if (!content) return;
        
        content.innerHTML = `
            <div style="display: grid; gap: 10px;">
                <div><strong>File Name:</strong> ${metadata.name}</div>
                <div><strong>File Size:</strong> ${metadata.size}</div>
                <div><strong>MIME Type:</strong> ${metadata.type}</div>
                <div><strong>Dimensions:</strong> ${metadata.dimensions}</div>
            </div>
        `;
    }

    exportMetadata() {
        if (this.images.length === 0) return;
        const image = this.images[0];
        if (!image) return;
        
        const metadata = {
            name: image.name,
            size: image.file?.size,
            type: image.file?.type,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        if (this.isChromeExtension && chrome.downloads) {
            chrome.downloads.download({
                url: url,
                filename: `${image.name || 'image'}_metadata.json`,
                saveAs: true
            });
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = `${image.name || 'image'}_metadata.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    // Batch rename
    openRenameModal() {
        if (this.images.length === 0) {
            alert('Please upload images first');
            return;
        }
        const modal = document.getElementById('renameModal');
        if (!modal) {
            console.error('Rename modal not found');
            return;
        }
        this.updateRenamePreview();
        modal.style.display = 'flex';
    }

    updateRenamePreview() {
        const previewList = document.getElementById('renamePreviewList');
        const renamePattern = document.getElementById('renamePattern');
        const renameCustom = document.getElementById('renameCustom');
        const renameStartNumber = document.getElementById('renameStartNumber');
        
        if (!previewList || !renamePattern || !renameStartNumber) return;
        
        const pattern = renamePattern.value;
        const custom = (renameCustom && renameCustom.value) ? renameCustom.value : 'image_{#}';
        const startNumber = parseInt(renameStartNumber.value) || 1;
        
        previewList.innerHTML = '';
        
        this.images.forEach((image, index) => {
            const div = document.createElement('div');
            div.style.padding = '8px';
            div.style.borderBottom = '1px solid var(--border)';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            
            const originalName = image.name || `image_${index + 1}`;
            let newName = originalName;
            
            if (pattern === 'custom') {
                newName = custom.replace('{#}', startNumber + index)
                    .replace('{name}', originalName.split('.')[0])
                    .replace('{ext}', originalName.split('.').pop() || 'png');
            } else if (pattern === 'numbered') {
                const ext = originalName.split('.').pop() || 'png';
                newName = `image_${startNumber + index}.${ext}`;
            } else if (pattern === 'timestamp') {
                const ext = originalName.split('.').pop() || 'png';
                const now = new Date();
                const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0];
                newName = `image_${timestamp}_${startNumber + index}.${ext}`;
            } else if (pattern === 'original-numbered') {
                const base = originalName.split('.')[0];
                const ext = originalName.split('.').pop() || 'png';
                newName = `${base}_${startNumber + index}.${ext}`;
            }
            
            div.innerHTML = `
                <span style="color: var(--text-secondary);">${originalName}</span>
                <span style="color: var(--primary); font-weight: 600;">→ ${newName}</span>
            `;
            previewList.appendChild(div);
        });
    }

    applyRename() {
        const renamePattern = document.getElementById('renamePattern');
        const renameCustom = document.getElementById('renameCustom');
        const renameStartNumber = document.getElementById('renameStartNumber');
        
        if (!renamePattern || !renameStartNumber) return;
        
        const pattern = renamePattern.value;
        const custom = (renameCustom && renameCustom.value) ? renameCustom.value : 'image_{#}';
        const startNumber = parseInt(renameStartNumber.value) || 1;
        
        this.images.forEach((image, index) => {
            const originalName = image.name || `image_${index + 1}`;
            let newName = originalName;
            
            if (pattern === 'custom') {
                newName = custom.replace('{#}', startNumber + index)
                    .replace('{name}', originalName.split('.')[0])
                    .replace('{ext}', originalName.split('.').pop() || 'png');
            } else if (pattern === 'numbered') {
                const ext = originalName.split('.').pop() || 'png';
                newName = `image_${startNumber + index}.${ext}`;
            } else if (pattern === 'timestamp') {
                const ext = originalName.split('.').pop() || 'png';
                const now = new Date();
                const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0];
                newName = `image_${timestamp}_${startNumber + index}.${ext}`;
            } else if (pattern === 'original-numbered') {
                const base = originalName.split('.')[0];
                const ext = originalName.split('.').pop() || 'png';
                newName = `${base}_${startNumber + index}.${ext}`;
            }
            
            image.name = newName;
        });
        
        this.updateImageGrid();
        this.closeModal('renameModal');
    }

    // Utility: Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
        this.currentEditingImageIndex = null;
    }
}

// Initialize the application
let imageConverter;
document.addEventListener('DOMContentLoaded', async () => {
    imageConverter = new ImageConverter();
    window.imageConverter = imageConverter; // Make globally accessible for inline onclick handlers
    
    // Handle Chrome extension initialization
    if (imageConverter.isChromeExtension) {
        // Setup options link
        const openOptionsLink = document.getElementById('openOptions');
        if (openOptionsLink) {
            openOptionsLink.addEventListener('click', (e) => {
                e.preventDefault();
                chrome.runtime.openOptionsPage();
            });
        }
    }
});

// Electron-specific initialization
if (window.electronAPI) {
    console.log('Running in Electron desktop app');
} else {
    console.log('Running in browser');
}

