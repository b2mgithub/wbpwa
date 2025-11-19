import { IDBPDatabase, openDB, deleteDB } from 'idb';

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
    // Do nothing - DB is created on login via switchDatabase
    // Before login, no database is needed
  }

  private async _init(): Promise<void> {
    // Removed - DB is now created explicitly via switchDatabase(userId)
  }

  private async open(dbName: string): Promise<void> {
    this.db = await openDB<DevilsOfflineDBSchema>(dbName, 5, {
      upgrade(db, oldVersion) {
        // Version 1: products store (managed by product-specific adapter)
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('products')) {
            db.createObjectStore('products', { keyPath: 'ProductId' });
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
            db.createObjectStore(REQUESTS_STORE, { keyPath: 'id' });
          }
        }
        // Version 4: productions and rates stores
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains('productions')) {
            db.createObjectStore('productions', { keyPath: 'ProductionId' });
          }
          if (!db.objectStoreNames.contains('rates')) {
            db.createObjectStore('rates', { keyPath: 'RateId' });
          }
        }
        // Version 5: blocks store
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('blocks')) {
            db.createObjectStore('blocks', { keyPath: 'BlockId' });
          }
        }
      },
    });
  }

  public async switchDatabase(userId: string): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    const dbName = `DevilsOfflineDB-${userId}`;
    console.log('Switching to DB:', dbName);
    await this.open(dbName);
  }

  public async deleteCurrentDatabase(): Promise<void> {
    if (this.db) {
      const name = this.db.name;
      this.db.close();
      this.db = null;
      await deleteDB(name);
      console.log('Deleted DB:', name);
    }
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

// AuthDB manages the fixed-name "DevilsOffline-Auth" database
// This is the "Reception Desk" that stores the current user
export interface AuthDBSchema {
  currentUser: {
    key: string;
    value: unknown;
  };
}

export class AuthDB {
  private db: IDBPDatabase<AuthDBSchema> | null = null;
  private readonly AUTH_DB_NAME = 'DevilsOffline-Auth';
  private readonly AUTH_DB_VERSION = 1;

  public async init(): Promise<void> {
    if (this.db) return;
    
    this.db = await openDB<AuthDBSchema>(this.AUTH_DB_NAME, this.AUTH_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('currentUser')) {
          db.createObjectStore('currentUser');
        }
      },
    });
  }

  public async setCurrentUser(user: unknown): Promise<void> {
    await this.init();
    if (!this.db) return;
    await this.db.put('currentUser', user, 'current');
    console.log('💾 Saved current user to Auth DB');
  }

  public async getCurrentUser<T = unknown>(): Promise<T | null> {
    await this.init();
    if (!this.db) return null;
    const user = await this.db.get('currentUser', 'current');
    return (user as T) || null;
  }

  public async clearCurrentUser(): Promise<void> {
    await this.init();
    if (!this.db) return;
    await this.db.delete('currentUser', 'current');
    console.log('🗑️ Cleared current user from Auth DB');
  }

  public getDB(): IDBPDatabase<AuthDBSchema> | null {
    return this.db;
  }
}

export const authDB = new AuthDB();
export const devilsOfflineDB = new DevilsOfflineDB();
