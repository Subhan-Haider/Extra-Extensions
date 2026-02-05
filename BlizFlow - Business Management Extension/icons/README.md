# Extension Icons

## Required Icon Files

The extension needs three PNG icon files:
- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## How to Generate Icons

### Method 1: Using the HTML Generator (Easiest)

1. Open `generate-icons.html` in your web browser
2. Click "Generate Icons" button
3. Click "Download All Icons" button
4. Save the downloaded PNG files to this folder (`extension/icons/`)

### Method 2: Using Online Converter

1. Use the provided `icon.svg` file
2. Go to an online SVG to PNG converter:
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/svg-png/
   - https://svgtopng.com/
3. Upload `icon.svg`
4. Convert to PNG at sizes: 16x16, 48x48, 128x128
5. Download and save as `icon16.png`, `icon48.png`, `icon128.png`

### Method 3: Using Image Editor

1. Open `icon.svg` in an image editor (Photoshop, GIMP, Figma, etc.)
2. Export/resize to:
   - 16x16 pixels → `icon16.png`
   - 48x48 pixels → `icon48.png`
   - 128x128 pixels → `icon128.png`
3. Save all files to this folder

## Icon Design

The icon features:
- **Gradient Background**: Purple to violet gradient (#667eea to #764ba2)
- **Letter B**: White letter "B" for "BlizFlow"
- **Arrow**: White arrow indicating "Flow"
- **Circular Shape**: Modern, rounded design

## Quick Start

If you just want to test the extension quickly:

1. Create simple colored squares as placeholders:
   - 16x16px purple square → `icon16.png`
   - 48x48px purple square → `icon48.png`
   - 128x128px purple square → `icon128.png`

2. Or use any existing PNG images and resize them to the required sizes

## Verification

After adding the icons, verify they work:

1. Load the extension in Chrome (`chrome://extensions/`)
2. Check that the icon appears in:
   - Browser toolbar
   - Extension management page
   - Extension popup

## Notes

- Icons should be PNG format with transparency support
- Use high-quality images for best appearance
- The icon design should be recognizable at small sizes (16x16)
- Keep file sizes small for faster loading
