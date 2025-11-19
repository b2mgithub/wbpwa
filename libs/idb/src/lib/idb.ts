import { IDBPDatabase, openDB } from 'idb';

function getUserId(): string {
  try {
    const authUser = localStorage.getItem('authUser');
    if (authUser) {
      const user = JSON.parse(authUser);
      return user.UserId || 'default';
    }
  } catch (error) {
    console.error('Failed to parse authUser from localStorage:', error);
  }
  return 'default';
}

export const getDbName = () => `DevilsOfflineDB-${getUserId()}`;
export const STATES_STORE = 'states';
export const REQUESTS_STORE = 'requests';

export interface StateRecord {
  key: string;
  [key: string]: unknown;
}

export interface FailedRequest {
  id: string;               // GUID
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;              // Full API endpoint
  body: unknown;            // Request payload
  timestamp: number;        // When it failed
  retryCount: number;       // How many times we've tried
  productId?: string;       // For linking back to product
  productionId?: string;    // For linking back to production
  rateId?: string;          // For linking back to rate
  operation: 'create' | 'update' | 'remove';
}

export interface DevilsOfflineDBSchema {
  states: {
    key: string;
    value: StateRecord;
  };
  requests: {
    key: string;
    value: FailedRequest;
  };
}

export class DevilsOfflineDB {
  private db: IDBPDatabase<DevilsOfflineDBSchema> | null = null;
  private initPromise: Promise<void> | null = null;

  public async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._init();
    await this.initPromise;
    this.initPromise = null;
  }

  private async _init(): Promise<void> {
    const dbName = getDbName();
    this.db = await openDB<DevilsOfflineDBSchema>(dbName, 4, {
      upgrade(db, oldVersion) {
        // Version 1: products store (managed by product-specific adapter)
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('products')) {
            const store = db.createObjectStore('products', { keyPath: 'ProductId' });
            store.createIndex('by-category', 'Category', { unique: false });
            store.createIndex('by-name', 'ProductName', { unique: false });
          }
        }
        // Version 2: states store for UI states
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(STATES_STORE)) {
            db.createObjectStore(STATES_STORE, { keyPath: 'key' });
          }
        }
        // Version 3: requests store for failed server requests
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains(REQUESTS_STORE)) {
            const store = db.createObjectStore(REQUESTS_STORE, { keyPath: 'id' });
            store.createIndex('by-timestamp', 'timestamp', { unique: false });
            store.createIndex('by-productId', 'productId', { unique: false });
          }
        }
        // Version 4: productions and rates stores
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains('productions')) {
            const store = db.createObjectStore('productions', { keyPath: 'ProductionId' });
            store.createIndex('by-name', 'ProductionName', { unique: false });
          }
          if (!db.objectStoreNames.contains('rates')) {
            const store = db.createObjectStore('rates', { keyPath: 'RateId' });
            store.createIndex('by-type', 'RateType', { unique: false });
          }
        }
      },
    });
  }

  public async readState<T = unknown>(key: string): Promise<T | undefined> {
    await this.init();
    if (!this.db) return undefined;
    const result = await this.db.get(STATES_STORE, key);
    if (!result) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key: _, ...state } = result;
    return state as T;
  }

  public async persistState<T = unknown>(key: string, state: T): Promise<void> {
    await this.init();
    if (!this.db) return;
    try {
      const tx = this.db.transaction(STATES_STORE, 'readwrite');
      tx.store.put({ key, ...state } as StateRecord);
      await tx.done;
    } catch (err) {
      console.warn('Failed to persist state:', key, err);
    }
  }

  public async removeState(key: string): Promise<void> {
    await this.init();
    if (!this.db) return;
    const tx = this.db.transaction(STATES_STORE, 'readwrite');
    tx.store.delete(key);
    await tx.done;
  }

  public async removeAllStates(): Promise<void> {
    await this.init();
    if (!this.db) return;
    const tx = this.db.transaction(STATES_STORE, 'readwrite');
    tx.store.clear();
    await tx.done;
  }

  // Failed request queue methods
  public async persistFailedRequest(request: FailedRequest): Promise<void> {
    await this.init();
    if (!this.db) return;
    const tx = this.db.transaction(REQUESTS_STORE, 'readwrite');
    tx.store.put(request);
    await tx.done;
    console.log('💾 Saved failed request to IDB:', request.id, request.operation);
  }
  public async readFailedRequests(): Promise<FailedRequest[]> {
    await this.init();
    if (!this.db) return [];
    return await this.db.getAll(REQUESTS_STORE);
  }
  public async removeFailedRequest(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;
    const tx = this.db.transaction(REQUESTS_STORE, 'readwrite');
    tx.store.delete(id);
    await tx.done;
    console.log('🗑️ Removed failed request from IDB:', id);
  }
  public async updateFailedRequest(request: FailedRequest): Promise<void> {
    await this.init();
    if (!this.db) return;
    const tx = this.db.transaction(REQUESTS_STORE, 'readwrite');
    tx.store.put(request);
    await tx.done;
  }

  public getDB(): IDBPDatabase<DevilsOfflineDBSchema> | null {
    return this.db;
  }
}

export const devilsOfflineDB = new DevilsOfflineDB();

