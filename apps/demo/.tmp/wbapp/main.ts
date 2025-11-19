
// import {attachRemoteConsole} from '@b2m/remote-console-log';
// attachRemoteConsole("https://wbcore.b2mapp.ca/api/wbcore/consolelog");

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { registerServiceWorker } from '@b2m/service-worker';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(() => {registerServiceWorker(environment)})
  .catch(err => console.error(err));

