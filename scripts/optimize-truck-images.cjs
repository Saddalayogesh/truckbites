// ============================================================================
// TruckBites - Optimize Truck Images
// ============================================================================
// Resizes every PNG in truckbites-frontend/public/trucks/ to a max width of
// 800px and converts it to WebP (quality 80), writing <name>.webp next to it.
// The original PNG is deleted only after a successful conversion.
//
// Run (after `npm install sharp` in this folder):
//   node optimize-truck-images.cjs
// ============================================================================

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TRUCKS_DIR = path.resolve(__dirname, '..', 'truckbites-frontend', 'public', 'trucks');
const MAX_WIDTH = 800;
const QUALITY = 80;

async function main() {
  if (!fs.existsSync(TRUCKS_DIR)) {
    console.error(`Directory not found: ${TRUCKS_DIR}`);
    process.exit(1);
  }

  const pngs = fs
    .readdirSync(TRUCKS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();

  if (pngs.length === 0) {
    console.log('No PNG files found in ' + TRUCKS_DIR);
    process.exit(0);
  }

  let totalBefore = 0;
  let totalAfter = 0;
  const rows = [];

  for (const file of pngs) {
    const inputPath = path.join(TRUCKS_DIR, file);
    const outputPath = path.join(TRUCKS_DIR, file.replace(/\.png$/i, '.webp'));

    const beforeBytes = fs.statSync(inputPath).size;

    try {
      const info = await sharp(inputPath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(outputPath);

      const afterBytes = info.size;
      totalBefore += beforeBytes;
      totalAfter += afterBytes;

      const savedPct = beforeBytes > 0 ? ((1 - afterBytes / beforeBytes) * 100).toFixed(1) : '0.0';
      rows.push({
        file,
        before: (beforeBytes / 1024).toFixed(0),
        after: (afterBytes / 1024).toFixed(0),
        pct: savedPct,
      });

      // Only remove the original once the WebP is written
      fs.unlinkSync(inputPath);
    } catch (err) {
      console.error(`✗ FAILED ${file}: ${err.message}`);
    }
  }

  console.log('\nTruck image optimization complete:');
  console.log('  input dir : ' + TRUCKS_DIR);
  console.log('  max width : ' + MAX_WIDTH + 'px, WebP quality ' + QUALITY);
  console.log('');
  console.log('  file                          before  after  saved');
  console.log('  ' + '-'.repeat(52));
  for (const r of rows) {
    console.log(`  ${r.file.padEnd(28)} ${String(r.before).padStart(6)}KB ${String(r.after).padStart(5)}KB ${r.pct.padStart(6)}%`);
  }
  if (rows.length > 0) {
    const pct = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
    console.log('  ' + '-'.repeat(52));
    console.log(`  TOTAL                         ${(totalBefore / 1024).toFixed(0)}KB ${(totalAfter / 1024).toFixed(0)}KB ${pct.padStart(6)}%`);
  }
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
