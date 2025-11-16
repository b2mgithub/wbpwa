import { Injectable } from '@angular/core';
import { EntityAdapter } from '@devils-offline/idb';
import { Production } from './productions.model';

@Injectable({ providedIn: 'root' })
export class IDBProductionsAdapter extends EntityAdapter<Production> {
  constructor() {
    super({ storeName: 'productions', idField: 'ProductionId' });
  }

  // Override DataService methods to ensure 'id' field is set correctly
  override async load(_filter: Record<string, never>): Promise<Production[]> {
    void _filter;
    const productions = await this.readAll();
    return productions.map(p => ({ ...p, id: p.ProductionId }));
  }

  override async loadById(id: string | number): Promise<Production> {
    const production = await this.read(String(id));
    if (!production) {
      throw new Error(`Production not found: ${id}`);
    }
    return { ...production, id: production.ProductionId };
  }

  override async create(entity: Production): Promise<Production> {
    const production = { ...entity, ProductionId: entity.id };
    await this.persist(production);
    return production;
  }

  override async update(entity: Production): Promise<Production> {
    const production = { ...entity, ProductionId: entity.id };
    await this.persist(production);
    return production;
  }

  override async updateAll(entities: Production[]): Promise<Production[]> {
    const productions = entities.map(e => ({ ...e, ProductionId: e.id }));
    await this.persistMany(productions);
    return productions;
  }

  override async delete(entity: Production): Promise<void> {
    await this.remove(entity.ProductionId);
  }
}

export const productionsAdapter = new IDBProductionsAdapter();