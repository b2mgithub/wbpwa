import { Injectable } from '@angular/core';

import { EntityAdapter } from '@devils-offline/idb';

import { User } from './user.model';

@Injectable({ providedIn: 'root' })
export class IDBUsersAdapter extends EntityAdapter<User> {
  constructor() {
    super({ storeName: 'users', idField: 'UserId' });
  }

  // Override DataService methods to ensure 'id' field is set correctly
  override async load(_filter: Record<string, never>): Promise<User[]> {
    void _filter;
    const users = await this.readAll();
    return users.map(u => ({ ...u, id: u.UserId }));
  }

  override async loadById(id: string | number): Promise<User> {
    const user = await this.read(String(id));
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    return { ...user, id: user.UserId };
  }

  override async create(entity: User): Promise<User> {
    const user = { ...entity, UserId: entity.id };
    await this.persist(user);
    return user;
  }

  override async update(entity: User): Promise<User> {
    const user = { ...entity, UserId: entity.id };
    await this.persist(user);
    return user;
  }

  override async updateAll(entities: User[]): Promise<User[]> {
    const users = entities.map(e => ({ ...e, UserId: e.id }));
    await this.persistMany(users);
    return users;
  }

  override async delete(entity: User): Promise<void> {
    await this.remove(entity.UserId);
  }
}

export const usersAdapter = new IDBUsersAdapter();
