const fs = require('fs');
const { createCanvas } = require('canvas');

// Icon sizes to generate
const sizes = [16, 32, 48, 128];

// Generate icons
sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');

    // Fill background with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Draw clipboard shape
    const scale = size / 128;

    // Clipboard board (white rectangle)
    ctx.fillStyle = 'white';
    ctx.fillRect(20 * scale, 30 * scale, 88 * scale, 88 * scale);

    // Clipboard clip (light gray rectangle at top)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(45 * scale, 20 * scale, 38 * scale, 15 * scale);

    // Lines representing text/history
    ctx.fillStyle = '#6366f1';
    const lineWidth = 60 * scale;
    const lineHeight = 4 * scale;
    const lineSpacing = 12 * scale;
    const startX = 34 * scale;
    let startY = 50 * scale;

    for (let i = 0; i < 4; i++) {
        ctx.fillRect(startX, startY, lineWidth, lineHeight);
        startY += lineSpacing;
    }

    // Save to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./icons/icon${size}.png`, buffer);
    console.log(`Generated icon${size}.png`);
});

console.log('All icons generated successfully!');
