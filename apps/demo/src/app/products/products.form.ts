import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule, KENDO_LABEL } from '@progress/kendo-angular-label';

import { generateGuid, getDeviceId } from '@wbpwa/guid';

import { Product } from './products.model';
import { ProductsStore } from './products.state';

@Component({
  selector: 'app-products-form',
  imports: [
    KENDO_BUTTONS,
    KENDO_INPUTS,
    KENDO_LABEL,
    FloatingLabelModule
  ],
  template: `
    <div class="outline-form">
      <h2>{{ isCreateMode() ? 'Create Product' : 'Update Product' }}</h2>
      <form (ngSubmit)="save()" autocomplete="off">
        <div class="outline-div">
          <kendo-floatinglabel class="outline" text="Product Name">
            <kendo-textbox
              [value]="productName()"
              (valueChange)="productName.set($event)"
              fillMode="outline"
              required
            ></kendo-textbox>
          </kendo-floatinglabel>

          <kendo-floatinglabel class="outline" text="Category">
            <kendo-textbox
              [value]="category()"
              (valueChange)="category.set($event)"
              fillMode="outline"
              required
            ></kendo-textbox>
          </kendo-floatinglabel>

          <kendo-floatinglabel class="outline" text="Unit Price">
            <kendo-numerictextbox
              [value]="unitPrice()"
              (valueChange)="unitPrice.set($event ?? 0)"
              fillMode="outline"
              [min]="0"
              [decimals]="2"
              [format]="'c'"
            ></kendo-numerictextbox>
          </kendo-floatinglabel>

          <kendo-floatinglabel class="outline" text="Units In Stock">
            <kendo-numerictextbox
              [value]="unitsInStock()"
              (valueChange)="unitsInStock.set($event ?? 0)"
              fillMode="outline"
              [min]="0"
              [decimals]="0"
            ></kendo-numerictextbox>
          </kendo-floatinglabel>
        </div>
        <div class="button-group">
          <button kendoButton themeColor="primary" type="submit">
            Save
          </button>
          <button kendoButton type="button" (click)="cancel()">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `
})
export class ProductsForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public store = inject(ProductsStore);

  productId: string | null = null;
  isCreateMode = signal(true);

  // Signal-based form fields
  productName = signal('');
  category = signal('');
  unitPrice = signal(0);
  unitsInStock = signal(0);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      this.isCreateMode.set(false);
      this.productId = id;
      const product = this.store['entities']().find((p: Product) => p.ProductId === id);

      if (product) {
        this.productName.set(product.ProductName);
        this.category.set(product.Category);
        this.unitPrice.set(product.UnitPrice);
        this.unitsInStock.set(product.UnitsInStock);
      } else {
        this.router.navigate(['/products']);
      }
    }
  }

  async save(): Promise<void> {
    console.log('💾 SAVE CLICKED!');
    alert('Save clicked! Check console.');
    
    const productNameValue = this.productName();
    const categoryValue = this.category();
    const unitPriceValue = this.unitPrice();
    const unitsInStockValue = this.unitsInStock();

    console.log('📝 Form values:', { productNameValue, categoryValue, unitPriceValue, unitsInStockValue });

    if (!productNameValue || !categoryValue) {
      console.warn('⚠️ Validation failed');
      alert('⚠️ Please fill in Product Name and Category');
      return;
    }

    try {
      if (this.isCreateMode()) {
        console.log('✨ CREATE mode');
        const newId = generateGuid();
        const submitTimestamp = new Date().toISOString();
        const newProduct: Product = {
          id: newId,
          ProductId: newId,
          ProductName: productNameValue,
          Category: categoryValue,
          UnitPrice: unitPriceValue,
          UnitsInStock: unitsInStockValue,
          Discontinued: false,
          BranchTimestamp: submitTimestamp,
          SubmitTimestamp: submitTimestamp,
          DeviceId: getDeviceId()
        };
        console.log('📦 Product:', newProduct);
        console.log('🔍 Calling store.create...');
        await this.store['create'](newProduct);
        console.log('✅ store.create done');
        this.store['createToServer'](newProduct);
        console.log('✅ store.createToServer done');
      } else if (this.productId) {
        console.log('✏️ EDIT mode:', this.productId);
        const existingProduct = this.store['entities']().find((p: Product) => p.ProductId === this.productId);
        if (!existingProduct) {
          console.error('❌ Product not found');
          return;
        }

        const submitTimestamp = new Date().toISOString();
        const updatedProduct: Product = {
          ...existingProduct,
          ProductName: productNameValue,
          Category: categoryValue,
          UnitPrice: unitPriceValue,
          UnitsInStock: unitsInStockValue,
          BranchTimestamp: existingProduct.BranchTimestamp || submitTimestamp,
          SubmitTimestamp: submitTimestamp,
          DeviceId: getDeviceId()
        };
        console.log('📦 Updated:', updatedProduct);
        await this.store['update'](updatedProduct);
        console.log('✅ store.update done');
        this.store['updateToServer'](this.productId, updatedProduct);
        console.log('✅ store.updateToServer done');
      }

      console.log('✅ SAVE COMPLETED - staying on page');
      alert('✅ Save completed! Check console for details.');
      // Navigation DISABLED for debugging:
      // this.router.navigate(['/products']);
    } catch (error) {
      console.error('💥 ERROR:', error);
      alert('❌ Error! Check console.');
    }
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}