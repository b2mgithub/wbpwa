import { Route } from '@angular/router';

import { Blocks } from './blocks/blocks';
import { Reports } from './reports/reports';
import { ProductsForm } from './products/products.form';
import { ProductsGrid } from './products/products.grid';
import { ProductionsForm } from './productions/productions.form';
import { ProductionsGrid } from './productions/productions.grid';
import { RatesForm } from './rates/rates.form';
import { RatesGrid } from './rates/rates.grid';
import { TestRequestComponent } from './test-request/test-request.component';
import { TestSwComponent } from './test-sw/test-sw.component';
import { TestKeyboardComponent } from './test-keyboard/test-keyboard.component';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/productions', pathMatch: 'full' },
  { path: 'blocks', component: Blocks },
  { path: 'reports', component: Reports },
  { 
    path: 'products', 
    children: [
      { path: '', component: ProductsGrid },
      { path: 'new', component: ProductsForm },
      { path: ':id', component: ProductsForm },
    ]
  },
  { 
    path: 'productions', 
    children: [
      { path: '', component: ProductionsGrid },
      { path: 'new', component: ProductionsForm },
      { path: ':id', component: ProductionsForm },
    ]
  },
  { 
    path: 'rates', 
    children: [
      { path: '', component: RatesGrid },
      { path: 'new', component: RatesForm },
      { path: ':id', component: RatesForm },
    ]
  },
  { path: 'test-request', component: TestRequestComponent },
  { path: 'test-sw', component: TestSwComponent },
  { path: 'test-keyboard', component: TestKeyboardComponent },
];
