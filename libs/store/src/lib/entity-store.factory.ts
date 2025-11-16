/**
 * Entity Store Factory
 * 
 * NOTE: This is a conceptual placeholder for future store factory patterns.
 * The current NgRx SignalStore pattern with withState/withComputed/withMethods/withHooks
 * doesn't easily support runtime factory functions due to:
 * 
 * 1. Type inference limitations - generics don't flow through signalStore() properly
 * 2. Method name conflicts - each entity has unique method names (createProduct vs createRate)
 * 3. Hook complexity - initialization logic varies significantly per entity
 * 4. DevTools integration - requires string literal store names
 * 
 * Current Approach (Recommended):
 * - Keep entity-specific stores (products.state.ts, productions.state.ts, rates.state.ts)
 * - Use EntityAdapter for data layer (already implemented - 80% code reduction)
 * - Extract common patterns into helper functions below
 * 
 * Future Improvements:
 * - Code generation tool (nx generator) to scaffold new entity stores
 * - Shared helper functions for common operations
 * - Type-safe store base class (if NgRx adds support)
 */

/**
 * Generic entity interface - all entities must have an ID field
 */
export interface Entity {
  [key: string]: unknown;
}

/**
 * Standard entity state shape
 */
export interface EntityState<T> {
  entities: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Helper: Create standard computed properties for entity count
 */
export function createEntityComputeds<T>(entitiesSignal: () => T[]) {
  const computed = (fn: () => unknown) => fn;
  return {
    entitiesCount: computed(() => entitiesSignal().length),
    hasEntities: computed(() => entitiesSignal().length > 0),
  };
}

/**
 * Helper: Update entities array immutably
 */
export function updateEntity<T extends Entity>(
  entities: T[],
  idField: keyof T,
  id: string,
  updates: Partial<T>
): T[] {
  return entities.map((entity) =>
    entity[idField] === id ? { ...entity, ...updates } : entity
  );
}

/**
 * Helper: Remove entity from array immutably
 */
export function removeEntity<T extends Entity>(
  entities: T[],
  idField: keyof T,
  id: string
): T[] {
  return entities.filter((entity) => entity[idField] !== id);
}

/**
 * Helper: Add entity to array immutably
 */
export function addEntity<T>(entities: T[], entity: T): T[] {
  return [...entities, entity];
}

/**
 * Helper: Standard HTTP error handler
 */
export function handleHttpError(error: unknown, operation: string): void {
  console.error(`🔴 ${operation}: Error`, error);
}

/**
 * Helper: Standard HTTP success logger
 */
export function logHttpSuccess(operation: string, response?: unknown): void {
  console.log(`🟢 ${operation}: Success`, response || '');
}

/**
 * Helper: Standard operation logger
 */
export function logOperation(operation: string, ...args: unknown[]): void {
  console.log(`🔵 ${operation}:`, ...args);
}

/**
 * Example usage in entity stores:
 * 
 * export const ProductsStore = signalStore(
 *   { providedIn: 'root' },
 *   withDevtools('Products'),
 *   withState({ products: [], loading: false, error: null }),
 *   withComputed(({ products }) => ({
 *     ...createEntityComputeds(products),
 *     entities: computed(() => products()), // Backward compat alias
 *   })),
 *   withMethods((store) => {
 *     const http = inject(HttpClient);
 *     return {
 *       async createProduct(product: Omit<Product, 'ProductId'>): Promise<Product> {
 *         const newProduct = { ...product, ProductId: generateGuid() };
 *         patchState(store, { products: addEntity(store.products(), newProduct) });
 *         await productsAdapter.persistProduct(newProduct);
 *         return newProduct;
 *       },
 *       async updateProduct(product: Product): Promise<void> {
 *         patchState(store, { 
 *           products: updateEntity(store.products(), 'ProductId', product.ProductId, product) 
 *         });
 *         await productsAdapter.persistProduct(product);
 *       },
 *       async removeProduct(id: string): Promise<void> {
 *         patchState(store, { products: removeEntity(store.products(), 'ProductId', id) });
 *         await productsAdapter.removeProduct(id);
 *       },
 *     };
 *   })
 * );
 */
