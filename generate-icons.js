// generate-icons.js
const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons(inputFile, outputDir, color) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    await sharp(inputFile)
      .resize(size, size, {
        fit: 'contain',
        background: color
      })
      .png()
      .toFile(`${outputDir}/icon-${size}x${size}.png`);
    
    console.log(`✅ Generated ${size}x${size}`);
  }
  
  // Also create apple-touch-icon (180x180 is standard)
  await sharp(inputFile)
    .resize(180, 180, {
      fit: 'contain',
      background: color
    })
    .png()
    .toFile(`${outputDir}/apple-touch-icon.png`);
  
  console.log(`✅ Generated apple-touch-icon`);
}

// Generate client icons (with warm background)
generateIcons(
  './source-logo-client.png',
  './public/client-icons',
  { r: 254, g: 243, b: 199, alpha: 1 } // warm amber
);

// Generate admin icons (with cool background)
generateIcons(
  './source-logo-admin.png',
  './public/admin-icons',
  { r: 51, g: 65, b: 85, alpha: 1 } // slate
);