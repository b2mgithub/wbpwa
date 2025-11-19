/** @file
important files related to service worker:
this file - the code which is inserted with processing into the service worker
@w2m/register-service-worker - a module for speeding the creation of service workers
*/

/** @function liteRequire
 *  @argument {string} absolute_path the path from the top-level project folder to the correct file
 *  @warn This is not a real function; it is found and replaced in the workbox-build-inject script.
 * 
 *  While the api of liteRequire has has been designed to be reminiscent  of node-style requires. 
 *  There are important differences. 
 *  * Only one level of imports is supported.  imported files can't also import additional files.
 *  * the supplied parameter must be a string literal; no dynamic imports
 *  * the supplied path is relative to the cwd of the calling script (generally the top level 
 *    of the respository) instead of relative to the file. Typescript aliases are not supported.
 *  * only an exports object is supplied. no module is supplied and thus, no default imports.
 * 
 * */

const { configureServiceWorker } = liteRequire("./libs/service-worker/src/js/service-worker-lib");

// For the simplicity let's use Workbox hosted on CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js')

const wbappCore = "https://wbcore.b2mapp.ca/api/wbcore";
//workbox manifest
const INJECT_MANIFEST = self.__WB_MANIFEST; //this is replaced by the manifest by the injection script
//the version of the app desplayed on the About page
const version = "1.0-" + __DATE_TOKEN; //__DATE_TOKEN is replaced by the date by the injection script

// Detailed logging is very useful during development
workbox.setConfig({ debug: true })

configureServiceWorker(workbox, INJECT_MANIFEST, version, wbappCore);

