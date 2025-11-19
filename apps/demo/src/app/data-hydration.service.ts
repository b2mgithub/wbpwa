import { inject, Injectable } from '@angular/core';

import { BlocksStore } from './blocks/blocks.state';
import { ProductionsStore } from './productions/productions.state';
import { ProductsStore } from './products/products.state';
import { RatesStore } from './rates/rates.state';

/**
 * Service to eagerly hydrate all devils-offline stores after login.
 * Ensures all data is loaded from user-specific IDB and synced from server.
 */
@Injectable({ providedIn: 'root' })
export class DataHydrationService {
  // Inject all devils-offline stores
  private blocksStore = inject(BlocksStore);
  private productionsStore = inject(ProductionsStore);
  private productsStore = inject(ProductsStore);
  private ratesStore = inject(RatesStore);

  /**
   * Hydrate all stores after successful login and database switch.
   * Called by auth.store after switchDatabase() completes.
   */
  async hydrateAllStores(): Promise<void> {
    console.log('🔄 Starting eager hydration of all devils-offline stores...');
    
    // Load all stores from user-specific IDB and sync from server
    try {
      await Promise.all([
        this.loadStore(this.blocksStore, 'Blocks'),
        this.loadStore(this.productionsStore, 'Productions'),
        this.loadStore(this.productsStore, 'Products'),
        this.loadStore(this.ratesStore, 'Rates'),
      ]);
      
      console.log('✅ Store hydration complete:', {
        blocks: this.blocksStore['entities']().length,
        productions: this.productionsStore['entities']().length,
        products: this.productsStore['entities']().length,
        rates: this.ratesStore['entities']().length,
      });
    } catch (err) {
      console.error('❌ Failed to hydrate stores:', err);
    }
  }

  private async loadStore(store: any, name: string): Promise<void> {
    try {
      // Load from IDB first
      await store['load']();
      // Sync from server and WAIT for it to complete (critical for IDB persistence!)
      await store['syncFromServer']();
    } catch (err) {
      console.error(`❌ Failed to load ${name}:`, err);
    }
  }
}
