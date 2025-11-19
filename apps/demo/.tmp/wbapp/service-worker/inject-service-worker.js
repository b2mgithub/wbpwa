//we can't use typescript aliases here because this is node javascript 
const { injectServiceWorker } = require('../../../../libs/service-worker/src/js/workbox-build-inject');

let workboxConfig = {
  globDirectory: './dist/apps/wbapp',
  globPatterns: [
    "favicon.ico",
    "index.html",
    "manifest.webmanifest",
    "manifest.json",
    "assets/**",
    "*.css",
    "*.js"
  ],
  swSrc: './apps/wbapp/src/service-worker/service-worker.js',
  swDest: './dist/apps/wbapp/service-worker.js'
}

injectServiceWorker(workboxConfig);