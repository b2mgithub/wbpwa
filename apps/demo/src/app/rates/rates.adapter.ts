import { Injectable } from '@angular/core';

import { EntityAdapter } from '@devils-offline/idb';

import { Rate } from './rates.model';

@Injectable({ providedIn: 'root' })
export class IDBRatesAdapter extends EntityAdapter<Rate> {
  constructor() {
    super({ storeName: 'rates', idField: 'RateId' });
  }

  // Override DataService methods to ensure 'id' field is set correctly
  override async load(_filter: Record<string, never>): Promise<Rate[]> {
    // _filter is part of the signature for compatibility with the EntityAdapter
    // API. Mark it as used to satisfy the linter when not required.
    void _filter;
    const rates = await this.readAll();
    return rates.map(r => ({ ...r, id: r.RateId }));
  }

  override async loadById(id: string | number): Promise<Rate> {
    const rate = await this.read(String(id));
    if (!rate) {
      throw new Error(`Rate not found: ${id}`);
    }
    return { ...rate, id: rate.RateId };
  }

  override async create(entity: Rate): Promise<Rate> {
    const rate = { ...entity, RateId: entity.id };
    await this.persist(rate);
    return rate;
  }

  override async update(entity: Rate): Promise<Rate> {
    const rate = { ...entity, RateId: entity.id };
    await this.persist(rate);
    return rate;
  }

  override async updateAll(entities: Rate[]): Promise<Rate[]> {
    const rates = entities.map(e => ({ ...e, RateId: e.id }));
    await this.persistMany(rates);
    return rates;
  }

  override async delete(entity: Rate): Promise<void> {
    await this.remove(entity.RateId);
  }

  // Backward compatibility aliases
  public async readAllRates(): Promise<Rate[]> {
    return this.readAll();
  }

  public async readRate(id: string): Promise<Rate | undefined> {
    return this.read(id);
  }

  public async persistRate(rate: Rate): Promise<void> {
    return this.persist(rate);
  }

  public async persistRates(rates: Rate[]): Promise<void> {
    return this.persistMany(rates);
  }

  public async removeRate(id: string): Promise<void> {
    return this.remove(id);
  }

  public async removeAllRates(): Promise<void> {
    return this.removeAll();
  }

  public async countRates(): Promise<number> {
    return this.count();
  }
}

export const ratesAdapter = new IDBRatesAdapter();

