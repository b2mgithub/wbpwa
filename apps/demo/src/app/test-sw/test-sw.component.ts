import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { KENDO_INDICATORS } from '@progress/kendo-angular-indicators';

import { environment } from '../../environments/environment';

interface CachedFile {
  url: string;
  size: number;
  type: string;
}

interface CacheInfo {
  name: string;
  files: CachedFile[];
  totalSize: number;
}

@Component({
  selector: 'app-test-sw',
  imports: [CommonModule, KENDO_BUTTONS, KENDO_ICONS, KENDO_INDICATORS],
  templateUrl: './test-sw.component.html',
})
export class TestSwComponent implements OnInit {
  public swRegistration = signal<ServiceWorkerRegistration | null>(null);
  public swActive = signal<boolean>(false);
  public isOnline = signal<boolean>(navigator.onLine);
  public caches = signal<CacheInfo[]>([]);
  public loading = signal<boolean>(false);
  public testResults = signal<string[]>([]);
  public totalCachedSize = signal<number>(0);

  async ngOnInit() {
    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          this.swRegistration.set(registration);
          this.swActive.set(!!registration.active);
        }
      } catch (error) {
        console.error('Error getting service worker registration:', error);
      }
    }

    // Listen for online/offline events
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

    // Load cache information on init
    await this.refreshCaches();
  }

  async refreshCaches() {
    this.loading.set(true);
    try {
      const cacheNames = await caches.keys();
      const cacheInfos: CacheInfo[] = [];
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        const files: CachedFile[] = [];

        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            const size = blob.size;
            totalSize += size;
            
            files.push({
              url: request.url,
              size: size,
              type: response.type || 'basic'
            });
          }
        }

        cacheInfos.push({
          name: cacheName,
          files: files,
          totalSize: files.reduce((sum, f) => sum + f.size, 0)
        });
      }

      this.caches.set(cacheInfos);
      this.totalCachedSize.set(totalSize);
    } catch (error) {
      this.addTestResult(`❌ Error loading caches: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  async testOfflineCapability() {
    this.addTestResult('🦪 Testing offline capability...');
    
    try {
      // Test if we can fetch the index.html from cache
      const response = await fetch('/', { cache: 'force-cache' });
      if (response.ok) {
        this.addTestResult('✅ Index page loads from cache');
      } else {
        this.addTestResult('❌ Index page failed to load');
      }
    } catch (error) {
      this.addTestResult(`❌ Offline test failed: ${error}`);
    }
  }

  async testApiCache() {
    this.addTestResult('🦪 Testing API cache...');
    
    try {
      const response = await fetch(`${environment.apiUrl}/Products`);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          this.addTestResult(`✅ API returned ${Array.isArray(data) ? data.length : 'some'} products`);
        } else {
          const text = await response.text();
          this.addTestResult(`⚠️ API returned non-JSON response (${contentType}): ${text.substring(0, 100)}...`);
        }
      } else {
        this.addTestResult(`⚠️ API returned status: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        this.addTestResult(`❌ API unreachable (offline or CORS). Try loading Products page while online first to cache the response.`);
      } else {
        this.addTestResult(`❌ API test failed: ${error}`);
      }
    }
  }

  async clearAllCaches() {
    this.addTestResult('🗑️ Clearing all caches...');
    
    try {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
      this.addTestResult(`✅ Cleared ${cacheNames.length} caches`);
      await this.refreshCaches();
    } catch (error) {
      this.addTestResult(`❌ Error clearing caches: ${error}`);
    }
  }

  async unregisterServiceWorker() {
    this.addTestResult('🔄 Unregistering service worker...');
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        this.swRegistration.set(null);
        this.swActive.set(false);
        this.addTestResult('✅ Service worker unregistered');
      } else {
        this.addTestResult('⚠️ No service worker registered');
      }
    } catch (error) {
      this.addTestResult(`❌ Error unregistering: ${error}`);
    }
  }

  async forceUpdate() {
    this.addTestResult('🔄 Checking for updates...');
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        this.addTestResult('✅ Update check complete');
      } else {
        this.addTestResult('⚠️ No service worker registered');
      }
    } catch (error) {
      this.addTestResult(`❌ Error checking for updates: ${error}`);
    }
  }

  clearTestResults() {
    this.testResults.set([]);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || urlObj.pathname;
    } catch {
      return url;
    }
  }

  private addTestResult(message: string) {
    this.testResults.update(results => [...results, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }
}
