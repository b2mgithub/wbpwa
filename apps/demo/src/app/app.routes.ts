import { Route } from '@angular/router';

import { BlocksForm } from './blocks/blocks.form';
import { BlocksGrid } from './blocks/blocks.grid';
import { ProductionsForm } from './productions/productions.form';
import { ProductionsGrid } from './productions/productions.grid';
import { ProductsForm } from './products/products.form';
import { ProductsGrid } from './products/products.grid';
import { RatesForm } from './rates/rates.form';
import { RatesGrid } from './rates/rates.grid';
import { Reports } from './reports/reports';
import { SmartGridComponent } from './smart-grid/smart-grid.component';
import { TestKeyboardComponent } from './test-keyboard/test-keyboard.component';
import { TestRequestComponent } from './test-request/test-request.component';
import { TestSwComponent } from './test-sw/test-sw.component';
import { TestIdbComponent } from './test-idb/test-idb.component';

import { LoginComponent } from '@devils-offline/auth/feature-login';
import { authGuard, adminGuard } from '@devils-offline/auth/util-guards';
import { UsersGrid } from './user/user.grid';
import { UsersForm } from './user/user.form';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/productions', pathMatch: 'full' },
  { 
    path: 'blocks', 
    canActivate: [authGuard],
    children: [
      { path: '', component: BlocksGrid },
      { path: 'new', component: BlocksForm },
      { path: ':id', component: BlocksForm },
    ]
  },
  { path: 'reports', component: Reports, canActivate: [authGuard] },
  { 
    path: 'products', 
    canActivate: [authGuard],
    children: [
      { path: '', component: ProductsGrid },
      { path: 'new', component: ProductsForm },
      { path: ':id', component: ProductsForm },
    ]
  },
  { 
    path: 'productions', 
    canActivate: [authGuard],
    children: [
      { path: '', component: ProductionsGrid },
      { path: 'new', component: ProductionsForm },
      { path: ':id', component: ProductionsForm },
    ]
  },
  { 
    path: 'rates', 
    canActivate: [adminGuard],
    children: [
      { path: '', component: RatesGrid },
      { path: 'new', component: RatesForm },
      { path: ':id', component: RatesForm },
    ]
  },
  { 
    path: 'user', 
    canActivate: [adminGuard],
    children: [
      { path: '', component: UsersGrid },
      { path: 'new', component: UsersForm },
      { path: ':id', component: UsersForm },
    ]
  },
  { path: 'test-request', component: TestRequestComponent, canActivate: [authGuard] },
  { path: 'test-sw', component: TestSwComponent, canActivate: [authGuard] },
  { path: 'test-keyboard', component: TestKeyboardComponent, canActivate: [authGuard] },
  { path: 'smart-grid', component: SmartGridComponent, canActivate: [authGuard] },
  { path: 'test-idb', component: TestIdbComponent },
];
