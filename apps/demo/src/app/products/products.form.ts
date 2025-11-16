import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { KENDO_LABEL } from '@progress/kendo-angular-label';

import { generateGuid } from '@devils-offline/guid';

import { Product, createBlankProduct } from './products.model';
import { ProductsStore } from './products.state';

@Component({
  selector: 'app-products-form',
  imports: [KENDO_BUTTONS, KENDO_INPUTS, KENDO_LABEL, ReactiveFormsModule],
  template: `
    <div class="product-detail-container">
      <h2>{{ isCreateMode ? 'Create Product' : 'Update Product' }}</h2>
      
      <form [formGroup]="formGroup" (ngSubmit)="save()">
        <kendo-formfield>
          <kendo-label text="Product Name"></kendo-label>
          <kendo-textbox formControlName="ProductName" [required]="true"></kendo-textbox>
        </kendo-formfield>

        <kendo-formfield>
          <kendo-label text="Unit Price"></kendo-label>
          <kendo-numerictextbox formControlName="UnitPrice" [min]="0" [decimals]="2" [format]="'c'"></kendo-numerictextbox>
        </kendo-formfield>

        <kendo-formfield>
          <kendo-label text="Units In Stock"></kendo-label>
          <kendo-numerictextbox formControlName="UnitsInStock" [min]="0" [decimals]="0"></kendo-numerictextbox>
        </kendo-formfield>

        <kendo-formfield>
          <kendo-label text="Category"></kendo-label>
          <kendo-textbox formControlName="Category" [required]="true"></kendo-textbox>
        </kendo-formfield>

        <kendo-formfield>
          <kendo-label text="Discontinued"></kendo-label>
          <input type="checkbox" formControlName="Discontinued" kendoCheckBox />
        </kendo-formfield>

        <div class="button-group">
          <button kendoButton [themeColor]="'primary'" [disabled]="formGroup.invalid" type="submit">
            Save
          </button>
          <button kendoButton type="button" (click)="cancel()">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .product-detail-container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
    }

    h2 {
      margin-bottom: 20px;
    }

    kendo-formfield {
      display: block;
      margin-bottom: 15px;
    }

    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
  `],
})
export class ProductsForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public store = inject(ProductsStore);

  public formGroup: FormGroup;
  public isCreateMode = false;
  private productId: string | null = null;

  constructor() {
    this.formGroup = this.formBuilder.group({
      ProductId: [''],
      ProductName: ['', Validators.required],
      UnitPrice: [0],
      UnitsInStock: [0],
      Discontinued: [false],
      Category: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Check URL segments: /products/new or /products/:id
    const segments = this.route.snapshot.url;
    const lastSegment = segments[segments.length - 1]?.path;
    
    if (lastSegment === 'new') {
      this.isCreateMode = true;
      // Form already has default values
    } else {
      this.isCreateMode = false;
      const id = this.route.snapshot.paramMap.get('id');
      this.productId = id;
      
      // Find product in store (using bracket notation for withDataService-generated property)
      const product = this.store['entities']().find((p: Product) => p.ProductId === id);
      
      if (product) {
        this.formGroup.patchValue(product);
      } else {
        console.warn('Product not found:', id);
        // Navigate back to grid if product doesn't exist
        this.router.navigate(['/products']);
      }
    }
  }

  async save(): Promise<void> {
    if (this.formGroup.invalid) {
      return;
    }

    const formData = this.formGroup.value;

    try {
      if (this.isCreateMode) {
        // Generate ProductId for new product
        const productId = generateGuid();
        
        // Merge form data with defaults to handle partial input
        const defaults = createBlankProduct();
        const newProduct: Product = {
          ...defaults,
          ...formData,
          ProductId: productId,
          id: productId, // DataService requires 'id' field
        };
        
        console.log('Creating new product:', newProduct);
        
        // Create new product using withDataService-generated method
        await this.store['create'](newProduct);
        
        // Sync to server (fire-and-forget with retry on failure)
        this.store['createToServer'](newProduct); // Don't await - fire and forget
      } else {
        // Update existing product - merge form data with existing product to preserve all fields
        const existingProduct = this.store['entities']().find((p: Product) => p.ProductId === formData.ProductId);
        
        if (!existingProduct) {
          console.error('Cannot update - product not found:', formData.ProductId);
          return;
        }
        
        const updatedProduct: Product = {
          ...existingProduct,
          ...formData,
          id: formData.ProductId, // Ensure id field is set
        };
        
        console.log('Updating product:', updatedProduct);
        
        await this.store['update'](updatedProduct);
        
        // Update dirty fields on server (only changed fields)
        const dirtyFields = this.collectDirtyFields();
        this.store['updateToServer'](formData.ProductId, dirtyFields); // Don't await - fire and forget
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      // Always navigate back to grid, regardless of success/failure
      this.router.navigate(['/products']);
    }
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }

  private collectDirtyFields(): Partial<Product> {
    const dirty: Record<string, unknown> = {};
    const formValue = this.formGroup.value;

    // Always include ID fields (fields ending in 'Id' that look like GUIDs)
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (key.endsWith('Id') && typeof value === 'string' && value.length > 0) {
        dirty[key] = value;
      }
    });

    // Include dirty fields
    Object.keys(this.formGroup.controls).forEach(key => {
      const control = this.formGroup.get(key);
      if (control?.dirty) {
        dirty[key] = formValue[key];
      }
    });

    return dirty as Partial<Product>;
  }
}
