import { signalStore, withMethods, withState } from '@ngrx/signals';
import { updateState, withDevtools } from '@angular-architects/ngrx-toolkit';
import { environment } from '../environments/environment';

type SplashScreenState = {
  visible: boolean;
  fadingOut: boolean;
};

const initialState: SplashScreenState = {
  visible: false,
  fadingOut: false,
};

export const SplashScreenStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withDevtools('splash'),
  withMethods((store) => ({
    show: () => {
      if (!environment.showSplashScreen) {
        return;
      }

      updateState(store, '🌊 Show Splash', { visible: true, fadingOut: false });

      setTimeout(() => {
        updateState(store, '🌊 Start Fade Out', { fadingOut: true });
        setTimeout(() => {
          updateState(store, '🌊 Hide Splash', { visible: false, fadingOut: false });
        }, environment.splashFadeDuration); // Fade duration
      }, environment.splashDisplayDuration); // Display duration
    },
    hide: () => {
      updateState(store, '🌊 Force Hide', { visible: false, fadingOut: false });
    },
  }))
);
