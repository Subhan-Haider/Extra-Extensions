// Node.js script to generate extension icons
// Run with: node generate-icons-node.js
// This creates simple PNG icons that work immediately

const fs = require('fs');
const path = require('path');

// Minimal valid PNG file (1x1 purple pixel)
// This is a base64-encoded minimal PNG
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Function to create a simple colored PNG
// This creates a minimal valid PNG with a solid color
function createSimplePNG(size, color) {
  // For now, we'll create a very simple PNG
  // This is a minimal PNG header + data for a solid color square
  // Using a more complete approach with proper PNG structure
  
  // Create a canvas-like approach using a simple method
  // Since we can't easily create PNGs without libraries, 
  // we'll use a workaround: create a data URL approach
  
  // Actually, let's create proper minimal PNG files
  // PNG signature + IHDR + IDAT + IEND chunks
  
  const width = size;
  const height = size;
  
  // PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // Helper to create CRC32
  function crc32(data) {
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  // Helper to write 32-bit integer (big-endian)
  function writeUInt32BE(buffer, value, offset) {
    buffer[offset] = (value >>> 24) & 0xFF;
    buffer[offset + 1] = (value >>> 16) & 0xFF;
    buffer[offset + 2] = (value >>> 8) & 0xFF;
    buffer[offset + 3] = value & 0xFF;
  }
  
  // Parse color (hex format like #667eea)
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Create IHDR chunk
  const ihdrData = Buffer.alloc(13);
  writeUInt32BE(ihdrData, width, 0);
  writeUInt32BE(ihdrData, height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrChunk = Buffer.concat([
    Buffer.from('IHDR'),
    ihdrData
  ]);
  const ihdrCRC = crc32(ihdrChunk);
  const ihdrChunkWithCRC = Buffer.concat([
    Buffer.alloc(4),
    ihdrChunk,
    Buffer.alloc(4)
  ]);
  writeUInt32BE(ihdrChunkWithCRC, ihdrData.length, 0);
  writeUInt32BE(ihdrChunkWithCRC, ihdrCRC, ihdrData.length + 4 + 4);
  
  // Create IDAT chunk (compressed image data)
  // For simplicity, we'll create uncompressed data
  // Each row: filter byte (0) + RGB pixels
  const rowSize = width * 3 + 1;
  const imageData = Buffer.alloc(height * rowSize);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    imageData[rowOffset] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      imageData[pixelOffset] = r;
      imageData[pixelOffset + 1] = g;
      imageData[pixelOffset + 2] = b;
    }
  }
  
  // Simple compression (store as-is for now, real PNG needs zlib)
  // For a working solution, we'll use a simpler approach
  // Let's use a library-free method: create a very basic PNG
  
  // Actually, the simplest solution is to use an existing minimal PNG
  // and scale it, or create one using a different method
  
  // Let's create a proper minimal PNG using a known-good approach
  // We'll create a 1-bit PNG and scale it
  
  return createMinimalPNGWithColor(size, r, g, b);
}

// Simpler approach: create a minimal valid PNG
function createMinimalPNGWithColor(size, r, g, b) {
  // Use a template approach - create a minimal PNG structure
  // This is a simplified version that creates a working PNG
  
  // For immediate fix, let's create a script that uses sharp if available,
  // or falls back to creating simple placeholder files
  
  // Check if sharp is available
  try {
    const sharp = require('sharp');
    // Create a simple image with sharp
    const svgBuffer = Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.1}"/>
        <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">B</text>
      </svg>
    `);
    
    return sharp(svgBuffer)
      .png()
      .toBuffer();
  } catch (e) {
    // sharp not available, create a simple colored square PNG
    // We'll use a base64-encoded minimal PNG and modify it
    console.log('Sharp not available, creating simple placeholder...');
    
    // Read the SVG and use it
    const svgPath = path.join(__dirname, 'icon.svg');
    if (fs.existsSync(svgPath)) {
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      // Replace viewBox and size
      const modifiedSVG = svgContent
        .replace(/width="[^"]*"/, `width="${size}"`)
        .replace(/height="[^"]*"/, `height="${size}"`)
        .replace(/viewBox="[^"]*"/, `viewBox="0 0 ${size} ${size}"`);
      
      // Try to use canvas if available
      try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Draw B
        ctx.fillStyle = 'white';
        ctx.font = `bold ${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('B', size/2, size/2);
        
        return canvas.toBuffer('image/png');
      } catch (canvasError) {
        // Neither sharp nor canvas available
        // Create a very simple 1-color PNG
        return createBasicPNG(size, r, g, b);
      }
    } else {
      return createBasicPNG(size, 102, 126, 234); // #667eea
    }
  }
}

// Create a basic single-color PNG (simplified)
function createBasicPNG(size, r, g, b) {
  // This is a minimal approach - we'll create a very simple PNG
  // For production, install sharp: npm install sharp
  console.warn('Creating basic placeholder. For better icons, install sharp: npm install sharp');
  
  // Create a minimal valid PNG (this is complex without libraries)
  // Instead, let's output instructions
  console.log('\n⚠️  Cannot generate PNG without image libraries.');
  console.log('Please either:');
  console.log('1. Install sharp: npm install sharp (in extension/icons/)');
  console.log('2. Or open generate-icons.html in your browser and download the icons');
  console.log('3. Or use an online SVG to PNG converter\n');
  
  // Return null to indicate we couldn't create it
  return null;
}

// Main function
function generateIcons() {
  const sizes = [16, 48, 128];
  const iconsDir = __dirname;
  
  console.log('🎨 Generating extension icons...\n');
  
  sizes.forEach(size => {
    try {
      const pngData = createMinimalPNGWithColor(size, 102, 126, 234);
      if (pngData) {
        const filename = path.join(iconsDir, `icon${size}.png`);
        fs.writeFileSync(filename, pngData);
        console.log(`✅ Created: icon${size}.png`);
      } else {
        console.log(`❌ Could not create icon${size}.png (see instructions above)`);
      }
    } catch (error) {
      console.error(`❌ Error creating icon${size}.png:`, error.message);
    }
  });
  
  console.log('\n✨ Done!');
}

// Run if called directly
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons, createMinimalPNGWithColor };

