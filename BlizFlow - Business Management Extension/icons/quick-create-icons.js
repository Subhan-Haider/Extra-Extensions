// Quick icon creation script
// Creates minimal valid PNG icons immediately

const fs = require('fs');
const path = require('path');

// Minimal valid PNG file structure
// This creates a simple colored square PNG

function createPNG(size, r, g, b) {
  // PNG file structure:
  // - PNG signature (8 bytes)
  // - IHDR chunk
  // - IDAT chunk (image data)
  // - IEND chunk
  
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // Helper functions
  function crc32(data) {
    let table = [];
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
  
  function writeUInt32BE(buf, value, offset) {
    buf[offset] = (value >>> 24) & 0xFF;
    buf[offset + 1] = (value >>> 16) & 0xFF;
    buf[offset + 2] = (value >>> 8) & 0xFF;
    buf[offset + 3] = value & 0xFF;
  }
  
  // Create IHDR chunk
  const ihdrData = Buffer.alloc(13);
  writeUInt32BE(ihdrData, width, 0);
  writeUInt32BE(ihdrData, height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrType = Buffer.from('IHDR');
  const ihdrChunk = Buffer.concat([ihdrType, ihdrData]);
  const ihdrCRC = crc32(ihdrChunk);
  
  const ihdrLength = Buffer.alloc(4);
  writeUInt32BE(ihdrLength, 13, 0);
  const ihdrCRCbuf = Buffer.alloc(4);
  writeUInt32BE(ihdrCRCbuf, ihdrCRC, 0);
  
  // Create image data (uncompressed for simplicity)
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
  
  // For a proper PNG, we need to compress the data with zlib
  // Since that's complex, let's use a simpler approach:
  // Create a gradient effect or use a library
  
  // Actually, let's try using the zlib that comes with Node.js
  const zlib = require('zlib');
  const compressedData = zlib.deflateSync(imageData);
  
  // Create IDAT chunk
  const idatType = Buffer.from('IDAT');
  const idatChunk = Buffer.concat([idatType, compressedData]);
  const idatCRC = crc32(idatChunk);
  
  const idatLength = Buffer.alloc(4);
  writeUInt32BE(idatLength, compressedData.length, 0);
  const idatCRCbuf = Buffer.alloc(4);
  writeUInt32BE(idatCRCbuf, idatCRC, 0);
  
  // Create IEND chunk
  const iendType = Buffer.from('IEND');
  const iendCRC = crc32(iendType);
  const iendLength = Buffer.from([0, 0, 0, 0]);
  const iendCRCbuf = Buffer.alloc(4);
  writeUInt32BE(iendCRCbuf, iendCRC, 0);
  
  // Combine all chunks
  return Buffer.concat([
    signature,
    ihdrLength,
    ihdrChunk,
    ihdrCRCbuf,
    idatLength,
    idatChunk,
    idatCRCbuf,
    iendLength,
    iendType,
    iendCRCbuf
  ]);
}

// Create icons with gradient colors
const sizes = [16, 48, 128];
const iconsDir = __dirname;

console.log('🎨 Creating extension icons...\n');

sizes.forEach(size => {
  try {
    // Use purple gradient color (#667eea)
    const pngData = createPNG(size, 102, 126, 234);
    const filename = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(filename, pngData);
    console.log(`✅ Created: icon${size}.png`);
  } catch (error) {
    console.error(`❌ Error creating icon${size}.png:`, error.message);
  }
});

console.log('\n✨ Done! Icons created successfully.');
console.log('You can now load the extension in Chrome.\n');

