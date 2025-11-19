import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { KENDO_LAYOUT } from '@progress/kendo-angular-layout';
import { SVGIcon, menuIcon } from '@progress/kendo-svg-icons';

import { AuthStore } from '@devils-offline/auth/data-access';

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
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit {
  public menuSvg: SVGIcon = menuIcon;
  public authStore = inject(AuthStore);

  // Signal-based mobile/handset detection using native matchMedia
  public isHandset = signal(false);

  constructor() {
    // Set up responsive breakpoint detection
    const mediaQuery = window.matchMedia('(max-width: 599px)'); // Handset breakpoint
    
    // Set initial value
    this.isHandset.set(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      this.isHandset.set(e.matches);
    });
  }

  ngOnInit() {
    // Clean up legacy localStorage keys from old auth implementation
    localStorage.removeItem('authUser');
    localStorage.removeItem('AccessToken');
    localStorage.removeItem('RefreshToken');

    // Send userId to service worker for IndexedDB access
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        const authData = localStorage.getItem('AuthUser');
        if (authData) {
          const parsed = JSON.parse(authData);
          const user = parsed.User;
          if (user?.UserId) {
            registration.active?.postMessage({
              type: 'SET_USER_ID',
              userId: user.UserId,
            });
            console.log('📤 Sent userId to service worker:', user.UserId);
          }
        }
      });
    }
  }
}
