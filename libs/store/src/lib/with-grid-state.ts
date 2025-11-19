import { computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { updateState } from '@angular-architects/ngrx-toolkit';
import { signalStoreFeature, withHooks, withMethods, withState } from '@ngrx/signals';
import { GridState } from '@progress/kendo-angular-grid';
import { distinctUntilChanged, filter, map, tap } from 'rxjs';

export interface WithGridStateConfig {
  storageKey: string;
  defaultGridState?: Partial<GridState>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: any; // IDB adapter with persistState/readState methods
}

const DEFAULT_GRID_STATE: GridState = {
  filter: undefined,
  group: [],
  skip: 0,
  sort: [],
  take: 5,
};

const sanitizeGridState = (state: GridState): GridState => {
  // Only keep the essential GridState properties that should be persisted
  const sanitized: GridState = {
    skip: state.skip ?? 0,
    take: state.take ?? 5,
    sort: state.sort ?? [],
    filter: state.filter,
    group: state.group ?? [],
  };
  return sanitized;
};

const gridStatesEqual = (a: GridState, b: GridState): boolean => 
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Custom SignalStore feature that adds Kendo Grid state management with IDB persistence.
 * 
 * Features:
 * - Adds gridState signal to store
 * - Hydrates gridState from IDB on init
 * - Automatically persists gridState changes to IDB
 * - Provides setGridState method
 * - Prevents circular hydration loops
 * 
 * Generated state:
 * - gridState: Signal<GridState> - Current grid state (filter, sort, skip, take, group)
 * 
 * Generated methods:
 * - setGridState(state: GridState) - Updates grid state and persists to IDB
 */
export function withGridState(config: WithGridStateConfig) {
  const { storageKey, defaultGridState, adapter: adapterInstance } = config;
  
  const initialState = {
    gridState: { ...DEFAULT_GRID_STATE, ...defaultGridState } as GridState,
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resolvedAdapter: any = null;
  
  return signalStoreFeature(
    withState(initialState),
    
    withMethods((store) => ({
      async setGridState(gridState: GridState) {
        const sanitized = sanitizeGridState(gridState);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateState(store, '[Grid] Set Grid State', { gridState: sanitized } as any);
        
        // Use adapter resolved during onInit
        if (resolvedAdapter) {
          await resolvedAdapter.persistState(storageKey, sanitized).catch((err: unknown) => 
            console.error('Failed to persist gridState', err)
          );
        }
      },
    })),
    
    withHooks({
      onInit(store) {
        // Resolve adapter: allow either an instance, or a class token that can be injected
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let adapter: any = adapterInstance ?? null;
        if (!adapter) {
          // config.adapter may be an injection token (class) - inject it
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          adapter = inject((config as any).adapter as any);
        } else if (typeof adapter === 'function') {
          // Caller passed a class/constructor instead of instance - inject to get instance
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          adapter = inject(adapter as any);
        }
        
        // Store resolved adapter for use in setGridState
        resolvedAdapter = adapter;

        let hydrationComplete = false;

        const init = async () => {
          await adapter.init();
          
          // Load grid state from IDB
          const gridState = await adapter.readState(storageKey).catch(() => null);
          
          if (gridState) {
            const sanitized = sanitizeGridState(gridState);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updateState(store, '[Grid] Hydrate Grid State', { gridState: sanitized } as any);
          }
          
          // Mark hydration as complete BEFORE starting persistence subscription
          hydrationComplete = true;
        };
        
        init();
        
        // Start persistence subscription, but skip initial value if hydration hasn't completed yet
        const gridStateSignal = computed(() => store['gridState']());
        const subscription = toObservable(gridStateSignal)
          .pipe(
            // Skip persistence until hydration is complete to avoid overwriting IDB with defaults
            filter(() => hydrationComplete),
            map((s) => sanitizeGridState(s)),
            distinctUntilChanged(gridStatesEqual),
            tap(async (s) => {
              await adapter.persistState(storageKey, s).catch((err: unknown) => 
                console.error('Failed to persist gridState', err)
              );
            })
          )
          .subscribe();
        
        return () => subscription.unsubscribe();
      },
    })
  );
}
