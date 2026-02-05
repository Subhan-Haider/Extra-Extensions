// Generate proper icons from SVG using sharp
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    const sharp = require('sharp');
    const svgPath = path.join(__dirname, 'icon.svg');
    const svgBuffer = fs.readFileSync(svgPath);
    
    const sizes = [16, 48, 128];
    
    console.log('🎨 Generating high-quality icons from SVG...\n');
    
    for (const size of sizes) {
      const outputPath = path.join(__dirname, `icon${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      console.log(`✅ Created: icon${size}.png (${size}x${size})`);
    }
    
    console.log('\n✨ All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  Sharp library not found. Installing...\n');
      console.log('Please run: npm install sharp');
      console.log('Then run this script again.\n');
      console.log('Alternatively, open generate-icons.html in your browser to generate icons.');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

generateIcons();

