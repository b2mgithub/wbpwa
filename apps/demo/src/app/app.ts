import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { KENDO_LAYOUT } from '@progress/kendo-angular-layout';
import { SVGIcon, menuIcon } from '@progress/kendo-svg-icons';

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

  ngOnInit() {
    // Send userId to service worker for IndexedDB access
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        const authUser = localStorage.getItem('authUser');
        if (authUser) {
          const user = JSON.parse(authUser);
          registration.active?.postMessage({
            type: 'SET_USER_ID',
            userId: user.UserId,
          });
          console.log('📤 Sent userId to service worker:', user.UserId);
        }
      });
    }
  }
}
