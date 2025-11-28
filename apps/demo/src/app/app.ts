import { Component, ViewEncapsulation, inject, signal, effect } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { KENDO_LAYOUT } from '@progress/kendo-angular-layout';
import { SVGIcon, menuIcon } from '@progress/kendo-svg-icons';

import { AuthStore, setDataHydrationCallback } from '@wbpwa/auth/data-access';
import { SplashScreenStore } from './splash-screen.store';
import { DataHydrationService } from './data-hydration.service';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    KENDO_LAYOUT,
    KENDO_BUTTONS,
    KENDO_ICONS,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  encapsulation: ViewEncapsulation.None,
})
export class App {
  public menuSvg: SVGIcon = menuIcon;
  public authStore = inject(AuthStore);
  public splashScreen = inject(SplashScreenStore);
  private dataHydration = inject(DataHydrationService);

  // Signal-based mobile/handset detection using native matchMedia
  public isHandset = signal(false);

  constructor() {
    // Show splash screen if enabled in environment
    this.splashScreen.show();

    // Register data hydration callback with auth store
    setDataHydrationCallback(() => this.dataHydration.hydrateAllStores());

    // Set up responsive breakpoint detection
    const mediaQuery = window.matchMedia('(max-width: 599px)'); // Handset breakpoint
    
    // Set initial value
    this.isHandset.set(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      this.isHandset.set(e.matches);
    });

    // Effect to sync userId to Service Worker whenever it changes
    effect(() => {
      const userId = this.authStore.userId();
      if (userId && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.active?.postMessage({
            type: 'SET_USER_ID',
            userId: userId,
          });
          console.log('📤 Sent userId to service worker:', userId);
        });
      }
    });
  }


}
