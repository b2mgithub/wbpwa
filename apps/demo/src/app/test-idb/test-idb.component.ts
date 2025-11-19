import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { GridModule } from '@progress/kendo-angular-grid';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { KENDO_INDICATORS } from '@progress/kendo-angular-indicators';
import { TreeViewModule } from '@progress/kendo-angular-treeview';

import { authDB, devilsOfflineDB } from '@devils-offline/idb';
import { AuthStore } from '@devils-offline/auth/data-access';

interface TreeViewNode {
  text: string;
  items: TreeViewNode[];
}

interface ObjectStoreInfo {
  name: string;
  count: number;
  data: unknown[];
}

interface DatabaseInfo {
  name: string;
  version: number;
  objectStores: ObjectStoreInfo[];
}

@Component({
  selector: 'app-test-idb',
  standalone: true,
  imports: [CommonModule, KENDO_BUTTONS, KENDO_ICONS, KENDO_INDICATORS, GridModule, TreeViewModule],
  templateUrl: './test-idb.component.html',
})
export class TestIdbComponent {
  authStore = inject(AuthStore);
  
  // Signals for database state
  authDbInfo = signal<DatabaseInfo | null>(null);
  userDbInfo = signal<DatabaseInfo | null>(null);
  currentUser = signal<unknown>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Computed values
  authState = computed(() => ({
    isAuthenticated: this.authStore.isAuthenticated(),
    isAdmin: this.authStore.isAdmin(),
    user: this.authStore.user(),
    userId: this.authStore.userId(),
  }));

  constructor() {
    this.loadDatabaseInfo();
  }

  async loadDatabaseInfo() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      // Load Auth DB info
      await this.loadAuthDbInfo();
      
      // Load User DB info if authenticated
      if (this.authStore.isAuthenticated()) {
        await this.loadUserDbInfo();
      } else {
        this.userDbInfo.set(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load database information';
      this.error.set(message);
      console.error('Error loading database info:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async loadAuthDbInfo() {
    try {
      await authDB.init();
      const db = authDB.getDB();
      if (!db) {
        this.authDbInfo.set(null);
        return;
      }
      
      const version = db.version;
      
      // Get current user
      const user = await authDB.getCurrentUser();
      this.currentUser.set(user);
      
      // Get all data from currentUser store
      const tx = db.transaction(['currentUser'], 'readonly');
      const store = tx.objectStore('currentUser');
      const allData = await store.getAll();
      
      this.authDbInfo.set({
        name: 'DevilsOffline-Auth',
        version,
        objectStores: [
          {
            name: 'currentUser',
            count: allData.length,
            data: allData
          }
        ]
      });
    } catch (err) {
      console.error('Error loading Auth DB:', err);
      this.authDbInfo.set(null);
    }
  }

  async loadUserDbInfo() {
    try {
      const userId = this.authStore.userId();
      if (!userId) {
        this.userDbInfo.set(null);
        return;
      }

      const db = devilsOfflineDB.getDB();
      if (!db) {
        this.userDbInfo.set(null);
        return;
      }

      const version = db.version;
      const objectStoreNames = Array.from(db.objectStoreNames);
      
      const objectStores: ObjectStoreInfo[] = [];
      
      // Get data from each object store
      for (const storeName of objectStoreNames) {
        try {
          const tx = db.transaction([storeName], 'readonly');
          const store = tx.objectStore(storeName);
          const allData = await store.getAll();
          
          objectStores.push({
            name: storeName,
            count: allData.length,
            data: allData.slice(0, 10) // Limit to first 10 items
          });
        } catch (err) {
          console.error(`Error reading store ${storeName}:`, err);
          objectStores.push({
            name: storeName,
            count: 0,
            data: []
          });
        }
      }
      
      this.userDbInfo.set({
        name: `DevilsOfflineDB-${userId}`,
        version,
        objectStores
      });
    } catch (err) {
      console.error('Error loading User DB:', err);
      this.userDbInfo.set(null);
    }
  }

  refresh() {
    this.loadDatabaseInfo();
  }

  formatJson(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
  }

  // Suggested styles (commented out - trying Kendo Material theme first):
  // .store-section { margin-bottom: 1rem; }
  // .muted-text { margin-top: 0.5rem; }

  /**
   * Convert JSON data to TreeView node structure
   */
  jsonToTreeView(data: unknown): TreeViewNode[] {
    if (!data) return [];
    
    const buildNode = (key: string, value: unknown): TreeViewNode => {
      if (value === null || value === undefined) {
        return { text: `${key}: null`, items: [] };
      }
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        return {
          text: key,
          items: Object.entries(value).map(([k, v]) => buildNode(k, v))
        };
      }
      
      if (Array.isArray(value)) {
        return {
          text: `${key} [${value.length}]`,
          items: value.map((item, idx) => buildNode(`[${idx}]`, item))
        };
      }
      
      return { text: `${key}: ${value}`, items: [] };
    };

    if (Array.isArray(data)) {
      return data.map((item, idx) => buildNode(`[${idx}]`, item));
    }
    
    return Object.entries(data).map(([key, value]) => buildNode(key, value));
  }

  /**
   * Check if data is tabular (array of flat objects)
   */
  isTabularData(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    const first = data[0];
    return typeof first === 'object' && first !== null && !Array.isArray(first);
  }

  /**
   * Get column names from first object in array
   */
  getColumns(obj: unknown): string[] {
    if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj);
    }
    return [];
  }
}

