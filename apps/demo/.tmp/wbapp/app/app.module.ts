import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { Store, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { DialogModule } from '@progress/kendo-angular-dialog';
import { GridModule } from '@progress/kendo-angular-grid';
import { Actions, EffectsModule } from '@ngrx/effects';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '@b2m/material';
import { NgVirtualKeyboardModule } from './virtual-keyboard/virtual-keyboard.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@progress/kendo-angular-layout';
import { BrowserModule } from '@angular/platform-browser';
import { SplashScreenComponent } from './app.splash-screen.component';

import { SignalREffects, signalrReducer } from 'ngrx-signalr-core';
import { NgrxDataIdbModule } from '@b2m/ngrx-data-idb';
import { NgrxDataSignalRModule, SignalRDataServiceFactory } from '@b2m/ngrx-data-signalr';
import { B2MRouterModule } from '@b2m/router';
import { idbEntityConfig, defaultDataServiceConfig } from './store/app.entity-metadata';
import { DefaultDataServiceConfig, DefaultDataServiceFactory } from '@ngrx/data';
import { ReactiveComponentModule } from '@ngrx/component';
import { wbHub } from './hubs';

import { ToastrModule } from 'ngx-toastr';
import { APP_ROUTES } from './app.routes';

import { NgrxTelemetryModule } from '@b2m/ngrx-telemetry';
import { environment } from '@environments/environment';
import { AuthModule } from '@b2m/auth';
import { AppEffects } from './store/app.effects';
import { initApplication } from './app.initializer';

@NgModule({
  declarations: [
    AppComponent,
    SplashScreenComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    GridModule,
    DialogModule,
    HttpClientModule,
    HttpClientJsonpModule,
    MaterialModule,
    NgVirtualKeyboardModule,
    ToastrModule.forRoot(), // ToastrModule added
    
    StoreModule.forRoot(      
      { 
        signalr: signalrReducer,   
      },
    ),   
    B2MRouterModule.forRoot(APP_ROUTES),
    AuthModule.forRoot({authApi: `${environment.apiUrl}/auth`}),
    EffectsModule.forRoot([AppEffects, SignalREffects]),
    ReactiveComponentModule,
    NgrxDataSignalRModule.forRoot(wbHub),
    NgrxDataIdbModule.forRoot(idbEntityConfig),

    StoreDevtoolsModule.instrument(),
    //Uncomment this line for remote viewing of the actions
    //NgrxTelemetryModule.forRoot({url: "https://wbcore.b2mapp.ca/api/wbcore/actionlog"}),
  ],
  providers: [ 
    { provide: DefaultDataServiceConfig, useValue: defaultDataServiceConfig },
    { provide: APP_INITIALIZER, useFactory: initApplication, deps: [Store, Actions], multi: true }
    // { provide: DefaultDataServiceFactory, useClass: SignalRDataServiceFactory }
   ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {}
}
