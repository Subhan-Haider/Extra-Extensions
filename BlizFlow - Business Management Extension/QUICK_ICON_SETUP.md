# Quick Icon Setup Guide

## Fastest Way to Add Icons

### Option 1: Use the HTML Generator (Recommended)

1. **Open the generator:**
   - Navigate to `extension/icons/`
   - Open `generate-icons.html` in your web browser
   - Or double-click the file

2. **Generate icons:**
   - Click the "Generate Icons" button
   - You'll see previews of all three sizes

3. **Download icons:**
   - Click "Download All Icons" button
   - Three PNG files will download automatically

4. **Save to extension:**
   - Move the downloaded files to `extension/icons/` folder
   - Files should be named: `icon16.png`, `icon48.png`, `icon128.png`

### Option 2: Use Online Converter

1. **Get the SVG:**
   - Use `extension/icons/icon.svg`

2. **Convert online:**
   - Go to https://cloudconvert.com/svg-to-png
   - Upload `icon.svg`
   - Set output sizes: 16, 48, 128
   - Download all three PNG files

3. **Rename and save:**
   - Rename to: `icon16.png`, `icon48.png`, `icon128.png`
   - Save to `extension/icons/` folder

### Option 3: Create Simple Placeholders (For Testing)

If you just want to test the extension quickly, create simple colored squares:

**Using Paint (Windows):**
1. Open Paint
2. Create new image: 16x16 pixels
3. Fill with purple color (#667eea)
4. Save as `icon16.png`
5. Repeat for 48x48 and 128x128

**Using Preview (Mac):**
1. Create new image: 16x16 pixels
2. Fill with purple color
3. Export as PNG: `icon16.png`
4. Repeat for other sizes

## Verify Icons Work

After adding icons:

1. **Load extension:**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `extension` folder

2. **Check icons appear:**
   - Icon should appear in browser toolbar
   - Icon should show in extension management page
   - Popup should display correctly

## Icon Requirements

- **Format**: PNG
- **Sizes**: 16x16, 48x48, 128x128 pixels
- **Location**: `extension/icons/` folder
- **Names**: `icon16.png`, `icon48.png`, `icon128.png`

## Troubleshooting

**Icons not showing?**
- Check file names are exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Verify files are in `extension/icons/` folder
- Reload the extension in Chrome
- Clear browser cache

**Icons look blurry?**
- Use high-resolution source images
- Ensure icons are exactly the specified sizes
- Use PNG format (not JPG)

**Can't generate icons?**
- Use the online converter method instead
- Or create simple placeholder icons for testing

---

**That's it!** Once icons are in place, your extension is ready to use! 🎉

