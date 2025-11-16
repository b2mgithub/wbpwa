import { Injectable } from '@angular/core';

import { EntityAdapter } from '@devils-offline/idb';

import { Product } from './products.model';

@Injectable({ providedIn: 'root' })
export class IDBProductsAdapter extends EntityAdapter<Product> {
  constructor() {
    super({ storeName: 'products', idField: 'ProductId' });
  }

  // Override DataService methods to ensure 'id' field is set correctly
  override async load(_filter: Record<string, never>): Promise<Product[]> {
    // _filter is part of the signature for compatibility with the EntityAdapter
    // API. Mark it as used to satisfy the linter when not required.
    void _filter;
    const products = await this.readAll();
    return products.map(p => ({ ...p, id: p.ProductId }));
  }

  override async loadById(id: string | number): Promise<Product> {
    const product = await this.read(String(id));
    if (!product) {
      throw new Error(`Product not found: ${id}`);
    }
    return { ...product, id: product.ProductId };
  }

  override async create(entity: Product): Promise<Product> {
    const product = { ...entity, ProductId: entity.id };
    await this.persist(product);
    return product;
  }

  override async update(entity: Product): Promise<Product> {
    const product = { ...entity, ProductId: entity.id };
    await this.persist(product);
    return product;
  }

  override async updateAll(entities: Product[]): Promise<Product[]> {
    const products = entities.map(e => ({ ...e, ProductId: e.id }));
    await this.persistMany(products);
    return products;
  }

  override async delete(entity: Product): Promise<void> {
    await this.remove(entity.ProductId);
  }

  // Backward compatibility aliases
  public async readAllProducts(): Promise<Product[]> {
    return this.readAll();
  }

  public async readProduct(id: string): Promise<Product | undefined> {
    return this.read(id);
  }

  public async persistProduct(product: Product): Promise<void> {
    return this.persist(product);
  }

  public async persistProducts(products: Product[]): Promise<void> {
    return this.persistMany(products);
  }

  public async removeProduct(id: string): Promise<void> {
    return this.remove(id);
  }

  public async removeAllProducts(): Promise<void> {
    return this.removeAll();
  }

  public async countProducts(): Promise<number> {
    return this.count();
  }
}

export const productsAdapter = new IDBProductsAdapter();
