import { Route } from '@angular/router'
import { authRoutes } from '@b2m/auth'

export const APP_ROUTES: Route[] = [
      { path: '', redirectTo: 'productions', pathMatch: 'full' },  
      { path: 'productions', loadChildren: () => import('./productions/productions.module').then(m => m.ProductionsModule) },
      { path: 'blocks', loadChildren: () => import('./blocks/blocks.module').then(m => m.BlocksModule) },
      { path: 'users', loadChildren: () => import('./users/users.module').then(m => m.UsersModule) }, 
      { path: 'rates', loadChildren: () => import('./rates/rates.module').then(m => m.RatesModule) },
      { path: 'report', loadChildren: () => import('./report/report.module').then(m => m.ReportModule) },      
      { path: 'about', loadChildren: () => import('@b2m/service-worker').then(m => m.ServiceWorkerModule) }, 
      ...authRoutes,     
      { path: '**', redirectTo: '' }
    ]