// Node.js script to generate extension icons
// Run with: node create-icons.js
// Requires: npm install canvas (or use sharp)

const fs = require('fs');
const path = require('path');

// Simple SVG to PNG converter using a basic approach
// For production, use a library like sharp or canvas

const svgContent = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <circle cx="64" cy="64" r="60" fill="url(#gradient)"/>
  
  <path d="M 40 30 L 40 98 L 70 98 Q 85 98 85 83 L 85 70 Q 85 60 75 58 L 85 50 Q 85 35 70 35 L 40 35 Z" 
        fill="white" 
        stroke="white" 
        stroke-width="2"/>
  <path d="M 50 45 L 65 45 Q 72 45 72 52 L 72 58 Q 72 65 65 65 L 50 65 Z" 
        fill="url(#gradient)"/>
  <path d="M 50 70 L 70 70 Q 77 70 77 77 L 77 83 Q 77 90 70 90 L 50 90 Z" 
        fill="url(#gradient)"/>
  
  <path d="M 90 50 L 105 64 L 90 78" 
        stroke="white" 
        stroke-width="4" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        fill="none"/>
</svg>`;

// Save SVG file
fs.writeFileSync(path.join(__dirname, 'icon.svg'), svgContent);
console.log('✅ SVG icon created: icon.svg');

console.log('\n📝 To generate PNG icons:');
console.log('1. Open generate-icons.html in your browser');
console.log('2. Click "Generate Icons"');
console.log('3. Click "Download All Icons"');
console.log('4. Save the PNG files to this folder');
console.log('\nOr use an online SVG to PNG converter:');
console.log('https://cloudconvert.com/svg-to-png');
console.log('https://convertio.co/svg-png/');

