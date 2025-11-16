import { inject, Type } from '@angular/core';
import { updateState } from '@angular-architects/ngrx-toolkit';
import { signalStoreFeature, withMethods } from '@ngrx/signals';
import { addEntity, removeEntity, setAllEntities, updateEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { from, pipe, switchMap, tap } from 'rxjs';

/**
 * Clean offline-first data service feature without filter/selectedIds state.
 * 
 * Unlike @angular-architects/ngrx-toolkit's withDataService(), this version:
 * - Does NOT add filter or selectedIds state properties
 * - Does NOT add collection-prefixed names (uses generic names: load, create, update, delete)
 * - IS optimized for offline-first PWA with IDB backing
 * 
 * Generated methods:
 * - load() - loads all entities from IDB
 * - loadById(id) - loads single entity by id
 * - create(entity) - creates entity in IDB
 * - update(entity) - updates entity in IDB
 * - updateAll(entities) - bulk update entities in IDB
 * - delete(entity) - deletes entity from IDB
 */
export function withOfflineDataService<Entity extends { id: string }>(config: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataServiceType: Type<any>; // IDB adapter with DataService interface
}) {
  return signalStoreFeature(
    withMethods((store) => {
      const adapter = inject(config.dataServiceType);
      
      return {
        // Load all entities from IDB
        load: rxMethod<void>(
          pipe(
            switchMap(() => from(adapter.load({}) as Promise<Entity[]>)),
            tap((entities: unknown) => {
              updateState(store, '[Data Service] Load All', setAllEntities(entities as Entity[]));
            })
          )
        ),
        
        // Load single entity by ID
        async loadById(id: string): Promise<Entity> {
          return await adapter.loadById(id);
        },
        
        // Create entity in IDB
        async create(entity: Entity): Promise<Entity> {
          const created = await adapter.create(entity);
          updateState(store, '[Data Service] Create', addEntity(created));
          return created;
        },
        
        // Update entity in IDB
        async update(entity: Entity): Promise<Entity> {
          const updated = await adapter.update(entity);
          updateState(store, '[Data Service] Update', updateEntity({ id: entity.id, changes: updated }));
          return updated;
        },
        
        // Bulk update entities in IDB
        async updateAll(entities: Entity[]): Promise<Entity[]> {
          const updated = await adapter.updateAll(entities);
          updateState(store, '[Data Service] Update All', setAllEntities(updated));
          return updated;
        },
        
        // Delete entity from IDB
        async delete(entity: Entity): Promise<void> {
          await adapter.delete(entity);
          updateState(store, '[Data Service] Delete', removeEntity(entity.id));
        },
      };
    })
  );
}
