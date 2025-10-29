#!/usr/bin/env node

/**
 * Generate placeholder assets for MemoryVerse
 * This creates simple colored rectangles as placeholders
 * until proper icons are designed
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size, bgColor, text) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${bgColor}" rx="${size * 0.2}"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
};

// Create splash screen SVG
const createSplashSVG = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1242" height="2436" viewBox="0 0 1242 2436" xmlns="http://www.w3.org/2000/svg">
  <rect width="1242" height="2436" fill="#F5F0E8"/>
  <g transform="translate(421, 918)">
    <rect width="400" height="500" fill="#D4C4A8" rx="40"/>
    <rect x="390" y="5" width="15" height="490" fill="#D4AF6A"/>
    <circle cx="200" cy="200" r="40" fill="#3E3226"/>
    <circle cx="200" cy="320" r="40" fill="#3E3226"/>
    <path d="M 160 250 Q 200 280 240 250" stroke="#3E3226" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
  <text x="621" y="1500" font-family="Georgia, serif" font-size="80" font-weight="bold" fill="#3E3226" text-anchor="middle">MemoryVerse</text>
  <text x="621" y="1600" font-family="Arial, sans-serif" font-size="40" fill="#6B5D52" text-anchor="middle">Scripture Memorization</text>
</svg>`;
};

const assetsDir = path.join(__dirname, '../assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create icon.png (as SVG for now)
fs.writeFileSync(
  path.join(assetsDir, 'icon.svg'),
  createSVGIcon(1024, '#D4C4A8', 'MV')
);

// Create adaptive-icon.png (as SVG for now)
fs.writeFileSync(
  path.join(assetsDir, 'adaptive-icon.svg'),
  createSVGIcon(1024, '#D4C4A8', 'MV')
);

// Create splash.png (as SVG for now)
fs.writeFileSync(
  path.join(assetsDir, 'splash.svg'),
  createSplashSVG()
);

// Create favicon.png (as SVG for now)
fs.writeFileSync(
  path.join(assetsDir, 'favicon.svg'),
  createSVGIcon(48, '#D4C4A8', 'M')
);

console.log('✅ Created placeholder asset files (SVG format)');
console.log('');
console.log('📝 Note: These are SVG placeholders. For production:');
console.log('   1. Design proper icons with the biblical theme');
console.log('   2. Convert to PNG format at the required sizes');
console.log('   3. Replace the SVG files with PNG files');
console.log('');
console.log('   Or use online tools to convert SVG to PNG:');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - https://svgtopng.com/');
