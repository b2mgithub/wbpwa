import { Injectable, Signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

export interface EntityFormConfig<T> {
  entityName: string;           // e.g., 'product', 'production', 'rate'
  idField: keyof T;             // e.g., 'ProductId'
  basePath: string;             // e.g., '/products'
}

export interface EntityStore<T> {
  entities: Signal<T[]>;
  createProduct?: (entity: Omit<T, string>) => Promise<T>;
  createProduction?: (entity: Omit<T, string>) => Promise<T>;
  createRate?: (entity: Omit<T, string>) => Promise<T>;
  updateProduct?: (entity: T) => Promise<void>;
  updateProduction?: (entity: T) => Promise<void>;
  updateRate?: (entity: T) => Promise<void>;
  createProductToServer?: (entity: T) => Promise<void>;
  createProductionToServer?: (entity: T) => Promise<void>;
  createRateToServer?: (entity: T) => Promise<void>;
  updateProductToServer?: (id: string, fields: Partial<T>) => Promise<void>;
  updateProductionToServer?: (id: string, fields: Partial<T>) => Promise<void>;
  updateRateToServer?: (payload: { RateId: string; dirtyFields: Partial<T> }) => Promise<void>;
}

@Injectable()
export class EntityFormService<T extends Record<string, unknown>> {
  public isCreateMode = false;
  private entityId: string | null = null;

  constructor(
    private config: EntityFormConfig<T>,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  /**
   * Initialize form from route params and store
   */
  public initForm(formGroup: FormGroup, store: EntityStore<T>): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id === 'new') {
      this.isCreateMode = true;
      this.entityId = null;
    } else {
      this.isCreateMode = false;
      this.entityId = id;

      const entity = store.entities().find(
        (e) => e[this.config.idField] === id
      ) as T | undefined;

      if (entity) {
        formGroup.patchValue(entity as Record<string, unknown>);
      } else {
        console.warn(`${this.config.entityName} not found:`, id);
        this.router.navigate([this.config.basePath]);
      }
    }
  }

  /**
   * Save form data (create or update)
   */
  public async save(
    formGroup: FormGroup,
    store: EntityStore<T>,
    createMethod: (entity: Partial<T>) => Promise<T>,
    updateMethod: (entity: T) => Promise<void>,
    createToServerMethod: (entity: T) => Promise<void>,
    updateToServerMethod: (id: string, fields: Partial<T>) => Promise<void> | Promise<{ RateId: string; dirtyFields: Partial<T> }>
  ): Promise<void> {
    if (formGroup.invalid) {
      return;
    }

    const formData = formGroup.value as T;

    if (this.isCreateMode) {
      // Create new entity
      // Build a Partial<T> without the id field to pass to createMethod.
      const entityData: Partial<T> = { ...(formData as Partial<T>) };
      delete (entityData as Record<string, unknown>)[this.config.idField as string];
      const newEntity = await createMethod(entityData);
      await createToServerMethod(newEntity);
    } else {
      // Update existing entity
      await updateMethod(formData);

      const dirtyFields = this.collectDirtyFields(formGroup, formData);
      const id = formData[this.config.idField] as string;
      
      await updateToServerMethod(id, dirtyFields);
    }

    this.navigateToGrid();
  }

  /**
   * Collect dirty fields from form
   */
  public collectDirtyFields(formGroup: FormGroup, formData: T): Partial<T> {
    const dirty: Partial<T> = {
      [this.config.idField]: formData[this.config.idField],
    } as Partial<T>;

    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control?.dirty) {
        dirty[key as keyof T] = formData[key as keyof T];
      }
    });

    return dirty;
  }

  /**
   * Cancel and navigate back to grid
   */
  public cancel(): void {
    this.navigateToGrid();
  }

  /**
   * Navigate back to grid
   */
  private navigateToGrid(): void {
    this.router.navigate([this.config.basePath]);
  }

  /**
   * Get entity ID (null if create mode)
   */
  public getEntityId(): string | null {
    return this.entityId;
  }
}
