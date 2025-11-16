import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Workbox } from 'workbox-window';
import { environment } from './environments/environment';

// Initialize authUser in localStorage on first load
function initializeAuthUser() {
  const storedAuthUser = localStorage.getItem('authUser');
  
  if (!storedAuthUser) {
    console.log('🔐 Initializing authUser from environment');
    localStorage.setItem('authUser', JSON.stringify(environment.authUser));
  } else {
    console.log('🔐 AuthUser already exists in localStorage');
  }
}

// Initialize auth user before bootstrapping
initializeAuthUser();

bootstrapApplication(App, appConfig)
  .then(() => {
    console.log('🚀 Application bootstrapped');

    // Only register service worker in production
    if (environment.production && 'serviceWorker' in navigator) {
      registerServiceWorker();
    } else if (!environment.production) {
      console.log('⚠️  Service Worker disabled in development mode');
    } else {
      console.warn('⚠️  Service Workers not supported in this browser');
    }
  })
  .catch((err) => console.error('❌ Application bootstrap failed:', err));

function registerServiceWorker() {
  const wb = new Workbox('/service-worker.js');

  let updateShown = false;

  // Detect when a new service worker is waiting to activate
  wb.addEventListener('waiting', () => {
    console.log('🔄 New service worker waiting to activate');

    // Prevent showing update prompt multiple times
    if (updateShown) return;
    updateShown = true;

    // Show update notification to user
    const shouldUpdate = confirm(
      'A new version of this app is available. Reload to update?'
    );

    if (shouldUpdate) {
      // Tell the new service worker to skip waiting
      wb.addEventListener('controlling', () => {
        console.log('✅ New service worker activated, reloading...');
        window.location.reload();
      });

      // Send skip waiting message
      wb.messageSkipWaiting();
    } else {
      console.log('ℹ️  Update postponed - will activate on next page load');
    }
  });

  // Service worker activated for the first time
  wb.addEventListener('activated', (event) => {
    if (!event.isUpdate) {
      console.log('✅ Service worker activated for the first time');
      console.log('🎉 App is now available offline!');
      
      // Optional: Show a notification to the user
      showNotification('App installed! Now available offline.');
    } else {
      console.log('✅ Service worker updated');
    }
  });

  // Warn user if there's no network
  window.addEventListener('online', () => {
    console.log('🌐 Network connection restored');
    showNotification('Back online!');
  });

  window.addEventListener('offline', () => {
    console.log('📴 Network connection lost - running in offline mode');
    showNotification('You are offline. Some features may be limited.');
  });

  // Register the service worker
  wb.register()
    .then((registration) => {
      console.log('✅ Service worker registered:', registration);

      // Check for updates every hour
      setInterval(() => {
        console.log('🔍 Checking for service worker updates...');
        registration?.update();
      }, 60 * 60 * 1000); // 1 hour
    })
    .catch((error) => {
      console.error('❌ Service worker registration failed:', error);
    });
}

// Simple notification function (you can replace with your own UI)
function showNotification(message: string) {
  // Option 1: Browser notification (requires permission)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Demo App', { body: message });
  } 
  // Option 2: Toast notification (implement with your UI library)
  else {
    console.log(`📢 ${message}`);
    // Example: this.toastService.show(message);
  }
}

// Optional: Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      console.log('Notification permission:', permission);
    });
  }
}