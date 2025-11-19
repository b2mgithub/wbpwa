import { Injectable } from '@angular/core';

import { EntityAdapter } from '@devils-offline/idb';

import { Block } from './blocks.model';

@Injectable({ providedIn: 'root' })
export class IDBBlocksAdapter extends EntityAdapter<Block> {
  constructor() {
    super({ storeName: 'blocks', idField: 'BlockId' });
  }

  override async load(_filter: Record<string, never>): Promise<Block[]> {
    void _filter;
    const blocks = await this.readAll();
    return blocks.map(b => ({ ...b, id: b.BlockId }));
  }

  override async loadById(id: string | number): Promise<Block> {
    const block = await this.read(String(id));
    if (!block) {
      throw new Error(`Block not found: ${id}`);
    }
    return { ...block, id: block.BlockId };
  }

  override async create(entity: Block): Promise<Block> {
    const block = { ...entity, BlockId: entity.id };
    await this.persist(block);
    return block;
  }

  override async update(entity: Block): Promise<Block> {
    const block = { ...entity, BlockId: entity.id };
    await this.persist(block);
    return block;
  }

  override async updateAll(entities: Block[]): Promise<Block[]> {
    const blocks = entities.map(e => ({ ...e, BlockId: e.id }));
    await this.persistMany(blocks);
    return blocks;
  }

  override async delete(entity: Block): Promise<void> {
    await this.remove(entity.BlockId);
  }
}
