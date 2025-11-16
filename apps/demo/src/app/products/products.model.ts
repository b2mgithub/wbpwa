// Product entity model
// NOTE: 'id' field added for DataService compatibility (aliases ProductId)
export interface Product {
  id: string;          // Required by DataService interface (same as ProductId)
  ProductId: string;   // Primary key in IDB
  ProductName: string;
  UnitPrice: number;
  UnitsInStock: number;
  Discontinued: boolean;
  Category: string;
}

// Default blank product for create forms
export const createBlankProduct = (): Omit<Product, 'ProductId' | 'id'> => ({
  ProductName: '',
  UnitPrice: 0,
  UnitsInStock: 0,
  Discontinued: false,
  Category: '',
});
