const { injectManifest } = require('workbox-build');
const path = require('path');
const fs = require('fs');

// Paths
const swSrc = path.join(__dirname, '.tmp', 'service-worker.js');
const swDest = path.join(__dirname, '../../dist/apps/demo/browser/service-worker.js');
const distDir = path.join(__dirname, '../../dist/apps/demo/browser');

async function buildServiceWorker() {
  console.log('🔨 Building Service Worker with Workbox...');
  console.log(`   Source: ${swSrc}`);
  console.log(`   Destination: ${swDest}`);
  console.log(`   Assets directory: ${distDir}`);

  // Check if compiled service worker exists
  if (!fs.existsSync(swSrc)) {
    console.error('❌ Compiled service worker not found at:', swSrc);
    console.error('   Make sure webpack compiled the TypeScript service worker first.');
    process.exit(1);
  }

  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    console.error('❌ Distribution directory not found at:', distDir);
    console.error('   Make sure the Angular app was built first (nx build demo)');
    process.exit(1);
  }

  try {
    const { count, size, warnings } = await injectManifest({
      swSrc,
      swDest,
      globDirectory: distDir,
      globPatterns: [
        '**/*.{js,css,html,json,png,jpg,jpeg,svg,ico,woff,woff2,ttf,eot,webmanifest}',
      ],
      // Don't cache bust files that Angular already hashed
      dontCacheBustURLsMatching: /\.[0-9a-f]{20}\./,
      
      // Maximum file size to cache (5MB)
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      
      // Ignore patterns
      globIgnores: [
        '**/node_modules/**',
        '**/*.map',              // Don't precache source maps
        '**/stats.json',         // Don't cache build stats
        '**/.gitkeep',
      ],

      // Manifest transforms - log what's being filtered
      manifestTransforms: [
        (manifestEntries) => {
          console.log(`   ℹ️  Found ${manifestEntries.length} files to potentially cache`);
          
          // Log large files for debugging
          const largeFiles = manifestEntries.filter(entry => entry.size > 2 * 1024 * 1024);
          if (largeFiles.length > 0) {
            console.log(`   📦 Large files (>2MB):`);
            largeFiles.forEach(entry => {
              console.log(`      - ${entry.url}: ${(entry.size / 1024 / 1024).toFixed(2)} MB`);
            });
          }
          
          // Don't filter anything - cache all files that match the glob patterns
          // The maximumFileSizeToCacheInBytes (5MB) is our only limit
          return { manifest: manifestEntries };
        },
      ],
    });

    // Display warnings if any
    if (warnings.length > 0) {
      console.warn('⚠️  Workbox warnings:');
      warnings.forEach((warning) => console.warn(`   - ${warning}`));
    }

    // Success message
    console.log('✅ Service Worker generated successfully!');
    console.log(`   📦 Precached ${count} files`);
    console.log(`   📊 Total size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📁 Output: ${swDest}`);

    // Copy source map if it exists
    const sourceMapSrc = swSrc + '.map';
    const sourceMapDest = swDest + '.map';
    if (fs.existsSync(sourceMapSrc)) {
      fs.copyFileSync(sourceMapSrc, sourceMapDest);
      console.log(`   🗺️  Source map copied`);
    }

  } catch (error) {
    console.error('❌ Service Worker generation failed!');
    console.error('   Error:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the build
buildServiceWorker().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});