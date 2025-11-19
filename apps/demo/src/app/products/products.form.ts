import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_INPUTS, FormFieldModule } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule, KENDO_LABEL } from '@progress/kendo-angular-label';

import { generateGuid } from '@devils-offline/guid';

import { Product, createBlankProduct } from './products.model';
import { ProductsStore } from './products.state';

@Component({
  selector: 'app-products-form',
  imports: [
    ReactiveFormsModule,
    KENDO_BUTTONS,
    KENDO_INPUTS,
    KENDO_LABEL,
    FloatingLabelModule,
    FormFieldModule
  ],
  template: `
    <div class="outline-form">
      <h2>{{ isCreateMode ? 'Create Product' : 'Update Product' }}</h2>
      <form [formGroup]="form" (ngSubmit)="save()" autocomplete="off">
        <div class="outline-div">
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Product Name">
              <kendo-textbox
                formControlName="productName"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Category">
              <kendo-textbox
                formControlName="category"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Unit Price">
              <kendo-numerictextbox
                formControlName="unitPrice"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
                [format]="'c'"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Units In Stock">
              <kendo-numerictextbox
                formControlName="unitsInStock"
                fillMode="outline"
                [min]="0"
                [decimals]="0"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
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
  isCreateMode = true;

  form = new FormGroup({
    productName: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
    unitPrice: new FormControl(0, { nonNullable: true }),
    unitsInStock: new FormControl(0, { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      this.isCreateMode = false;
      this.productId = id;
      const product = this.store['entities']().find((p: Product) => p.ProductId === id);

      if (product) {
        this.form.patchValue({
          productName: product.ProductName,
          category: product.Category,
          unitPrice: product.UnitPrice,
          unitsInStock: product.UnitsInStock
        });
        this.form.markAsPristine();
      } else {
        this.router.navigate(['/products']);
      }
    }
  }

  async save(): Promise<void> {
    const formValue = this.form.getRawValue();

    if (!formValue.productName || !formValue.category) {
      console.warn('Product Name and Category are required');
      return;
    }

    const now = new Date().toISOString();

    if (this.isCreateMode) {
      const newId = generateGuid();
      const newProduct: Product = {
        id: newId,
        ProductId: newId,
        ProductName: formValue.productName,
        Category: formValue.category,
        UnitPrice: formValue.unitPrice,
        UnitsInStock: formValue.unitsInStock,
        Discontinued: false
      };
      await this.store['create'](newProduct);
      this.store['createToServer'](newProduct);
    } else if (this.productId) {
      const existingProduct = this.store['entities']().find((p: Product) => p.ProductId === this.productId);
      if (!existingProduct) {
        return;
      }

      const updatedProduct: Product = {
        ...existingProduct,
        ProductName: formValue.productName,
        Category: formValue.category,
        UnitPrice: formValue.unitPrice,
        UnitsInStock: formValue.unitsInStock
      };
      await this.store['update'](updatedProduct);
      this.store['updateToServer'](this.productId, updatedProduct);
    }

    this.router.navigate(['/products']);
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}