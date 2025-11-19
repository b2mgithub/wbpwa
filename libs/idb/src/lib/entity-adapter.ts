import { DataService } from '@angular-architects/ngrx-toolkit';
import { EntityId } from '@ngrx/signals/entities';

import { devilsOfflineDB } from './idb';

// Empty filter type for offline-first (no server queries)
export type EmptyFilter = Record<string, never>;

// Entity type must have an 'id' field for DataService compatibility
export interface DataServiceEntity {
  id: EntityId;
}

export interface EntityAdapterConfig<T extends DataServiceEntity> {
  storeName: string;
  idField: keyof T;
}

/**
 * EntityAdapter - Generic IDB persistence layer implementing DataService interface
 * 
 * This adapter provides offline-first storage using IndexedDB and implements
 * the DataService interface required by @angular-architects/ngrx-toolkit's
 * withDataService() feature.
 * 
 * NOTE: DataService interface requires entities with 'id' field. Entity-specific
 * adapters should extend this class and map custom ID fields to 'id' field
 * (e.g., Product with ProductId should also have id: ProductId).
 * 
 * @template T - Entity type (must extend DataServiceEntity with 'id' field)
 */
export class EntityAdapter<T extends DataServiceEntity> implements DataService<T, EmptyFilter> {
  protected storeName: string;
  protected idField: keyof T;

  constructor(config: EntityAdapterConfig<T>) {
    this.storeName = config.storeName;
    this.idField = config.idField;
  }

  public async init(): Promise<void> {
    await devilsOfflineDB.init();
  }

  /**
   * Map entity from IDB to DataService format (entity-specific ID → generic 'id')
   * @param entity - Entity from IDB with entity-specific ID field
   * @returns Entity with generic 'id' field set
   */
  protected mapToDataService(entity: T): T {
    return { ...entity, id: String(entity[this.idField]) };
  }

  /**
   * Map entity from DataService to IDB format (generic 'id' → entity-specific ID)
   * @param entity - Entity with generic 'id' field
   * @returns Entity with entity-specific ID field set
   */
  protected mapFromDataService(entity: T): T {
    return { ...entity, [this.idField]: entity.id } as T;
  }

  // ===================================================================
  // DataService Interface Implementation (for withDataService())
  // ===================================================================

  /**
   * Load all entities from IDB (DataService interface method)
   * @param filter - Empty filter object (unused for offline-first)
   * @returns Promise of all entities
   */
  async load(_filter: EmptyFilter): Promise<T[]> {
    const entities = await this.readAll();
    return entities.map(e => this.mapToDataService(e));
  }

  /**
   * Load single entity by ID (DataService interface method)
   * @param id - Entity ID (string or number)
   * @returns Promise of entity
   * @throws Error if entity not found
   */
  async loadById(id: string | number): Promise<T> {
    const result = await this.read(String(id));
    if (!result) {
      throw new Error(`Entity not found in ${this.storeName}: ${id}`);
    }
    return this.mapToDataService(result);
  }

  /**
   * Create entity in IDB (DataService interface method)
   * @param entity - Entity to create
   * @returns Promise of created entity
   */
  async create(entity: T): Promise<T> {
    const mapped = this.mapFromDataService(entity);
    await this.persist(mapped);
    return this.mapToDataService(mapped);
  }

  /**
   * Update entity in IDB (DataService interface method)
   * @param entity - Entity to update
   * @returns Promise of updated entity
   */
  async update(entity: T): Promise<T> {
    const mapped = this.mapFromDataService(entity);
    await this.persist(mapped);
    return this.mapToDataService(mapped);
  }

  /**
   * Update multiple entities in IDB (DataService interface method)
   * @param entities - Array of entities to update
   * @returns Promise of updated entities
   */
  async updateAll(entities: T[]): Promise<T[]> {
    const mapped = entities.map(e => this.mapFromDataService(e));
    await this.persistMany(mapped);
    return mapped.map(e => this.mapToDataService(e));
  }

  /**
   * Delete entity from IDB (DataService interface method)
   * @param entity - Entity to delete
   * @returns Promise<void>
   */
  async delete(entity: T): Promise<void> {
    // Robust ID extraction with string coercion
    const id = String(entity.id ?? entity[this.idField]);
    await this.remove(id);
  }

  // ===================================================================
  // Legacy Methods (Backward Compatibility)
  // ===================================================================

  public async readAll(): Promise<T[]> {
    await this.init();
    const db = devilsOfflineDB.getDB();
    if (!db) return [];
    const all = await db.getAll(this.storeName);
    return (all as T[]) || [];
  }

  public async read(id: string): Promise<T | undefined> {
    await this.init();
    const db = devilsOfflineDB.getDB();
    if (!db) return undefined;
    return (await db.get(this.storeName, id)) as T | undefined;
  }

  public async persist(entity: T): Promise<void> {
    await this.init();
    const db = devilsOfflineDB.getDB();
    if (!db) return;
    try {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.store.put(entity);
      await tx.done;
    } catch (err) {
      console.warn(`Failed to persist entity in ${this.storeName}:`, err);
    }
  }

  public async persistMany(entities: T[]): Promise<void> {
    await this.init();
    const db = devilsOfflineDB.getDB();
    if (!db) return;
    try {
      const tx = db.transaction(this.storeName, 'readwrite');
      for (const entity of entities) {
        tx.store.put(entity);
      }
      await tx.done;
    } catch (err) {
      console.warn(`Failed to persist entities in ${this.storeName}:`, err);
    }
  }

  public async remove(id: string): Promise<void> {
    await this.init();
    const db = devilsOfflineDB.getDB();
    if (!db) return;
    try {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.store.delete(id);
      await tx.done;
    } catch (err) {
      console.warn(`Failed to remove entity from ${this.storeName}:`, err);
    }
  }

  public async removeAll(): Promise<void> {
    await this.init();
    const db = devilsOfflineDB.getDB();
    if (!db) return;
    try {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.store.clear();
      await tx.done;
    } catch (err) {
      console.warn(`Failed to remove all entities from ${this.storeName}:`, err);
    }
  }

  public async count(): Promise<number> {
    await this.init();
    const db = devilsOfflineDB.getDB();
    if (!db) return 0;
    return await db.count(this.storeName);
  }

  // State persistence methods
  public async readState(key: string): Promise<unknown | undefined> {
    return await devilsOfflineDB.readState<unknown>(key);
  }

  public async persistState(key: string, state: unknown): Promise<void> {
    await devilsOfflineDB.persistState(key, state);
  }
}
