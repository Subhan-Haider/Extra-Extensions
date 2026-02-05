# Extension Icons

Place your extension icon files here:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon32.png` - 32x32 pixels
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Quick Start

If you don't have icons yet, you can:

1. **Create simple colored squares** as placeholders
2. **Use an online icon generator**:
   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/
3. **Use any PNG image** temporarily (rename to required sizes)

## Icon Design Tips

- Use a simple, recognizable design
- Ensure it looks good at small sizes (16x16)
- Use high contrast colors
- Test visibility on light and dark backgrounds
- Keep design consistent across all sizes

## Creating Icons

### Using ImageMagick (Command Line)
```bash
# Create from a master 512x512 image
convert master.png -resize 16x16 icon16.png
convert master.png -resize 32x32 icon32.png
convert master.png -resize 48x48 icon48.png
convert master.png -resize 128x128 icon128.png
```

### Using Online Tools
1. Create or find a 512x512 master image
2. Upload to favicon generator
3. Download generated icons
4. Place in this folder

The extension will work without icons, but Chrome will show a default puzzle piece icon.

