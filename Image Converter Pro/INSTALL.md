# Installation Guide - Image Converter Pro Chrome Extension

## Quick Install (Developer Mode)

### Step 1: Prepare the Extension
1. Make sure you have all files in the `chrome-extension` folder
2. Create icon files (see Icons section below)

### Step 2: Open Chrome Extensions
- Open Google Chrome
- Go to: `chrome://extensions/`
- Or: Menu (⋮) → More Tools → Extensions

### Step 3: Enable Developer Mode
- Toggle the "Developer mode" switch in the top-right corner

### Step 4: Load Extension
- Click "Load unpacked" button
- Navigate to and select the `chrome-extension` folder
- Click "Select Folder"

### Step 5: Verify Installation
- You should see "Image Converter Pro" in your extensions list
- The extension icon should appear in Chrome toolbar
- Right-click an image to see "Convert Image with Image Converter Pro" option

## Creating Icons

The extension needs icon files. You can:

### Option 1: Use Placeholder Icons
Create simple colored squares as placeholders:
- 16x16, 32x32, 48x48, 128x128 pixels
- Save as PNG files
- Place in `icons/` folder

### Option 2: Generate Icons
1. Create a 512x512 master icon
2. Use online tools like:
   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/
3. Download and place in `icons/` folder

### Option 3: Use Default Icons
You can temporarily use any PNG images renamed to:
- `icon16.png`
- `icon32.png`
- `icon48.png`
- `icon128.png`

## Testing

1. **Test Context Menu**
   - Go to any webpage with images
   - Right-click an image
   - Should see "Convert Image with Image Converter Pro"

2. **Test Extension Popup**
   - Click extension icon in toolbar
   - Should see popup with options

3. **Test Full Converter**
   - Click "Open Full Converter" in popup
   - Or right-click → "Open Image Converter Pro"
   - Should open full converter interface

## Updating the Extension

When you make changes:
1. Go to `chrome://extensions/`
2. Find "Image Converter Pro"
3. Click the refresh icon (↻)
4. Changes will be applied

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Image Converter Pro"
3. Click "Remove"
4. Confirm removal

## Troubleshooting

### "Manifest file is missing or unreadable"
- Make sure you selected the correct folder
- Check that `manifest.json` exists

### "Could not load manifest"
- Check `manifest.json` for syntax errors
- Verify all required fields are present

### Icons not showing
- Check that icon files exist in `icons/` folder
- Verify file names match exactly (case-sensitive)
- Ensure files are PNG format

### Context menu not appearing
- Reload the extension
- Check browser console for errors
- Verify permissions in manifest.json

## Next Steps

After installation:
1. Try right-clicking an image on any website
2. Test the extension popup
3. Convert some images!
4. Check out all the features in the full converter

Enjoy converting images! 🎉

