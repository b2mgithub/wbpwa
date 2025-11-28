import { Production } from './productions.model';
import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_DATEINPUTS } from '@progress/kendo-angular-dateinputs';
import { KENDO_DROPDOWNS } from '@progress/kendo-angular-dropdowns';
import { FormFieldModule, NumericTextBoxModule, TextBoxModule } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule } from '@progress/kendo-angular-label';
import { KENDO_LAYOUT } from '@progress/kendo-angular-layout';

import { toPacificDateTimeOffset } from '@wbpwa/datetime-offset';
import { generateGuid, getDeviceId } from '@wbpwa/guid';


import { ProductionsStore } from './productions.state';
import { KeyboardComponent, KeyboardFormService } from '@wbpwa/keyboard';

@Component({
  selector: 'app-productions-form',
  imports: [
    CommonModule,
    KENDO_BUTTONS,
    KENDO_DATEINPUTS,
    KENDO_DROPDOWNS,
    FormFieldModule,
    FloatingLabelModule,
    NumericTextBoxModule,
    TextBoxModule,
    KENDO_LAYOUT,
    ReactiveFormsModule,
    KeyboardComponent
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
<div class="production-detail-container">
  <h2>{{ isCreateMode ? 'Create Production' : 'Update Production' }}</h2>
  
  <form [formGroup]="form" (ngSubmit)="save()">
    <div class="date-field">
      <label class="k-label outline">Date</label>
      <kendo-datepicker
        [value]="dateValue"
        (valueChange)="onDateChange($event)"
        style="width: 100%;"
      ></kendo-datepicker>
    </div>

    <kendo-tabstrip>
      <kendo-tabstrip-tab [title]="'Harvesting'" [selected]="true">
        <ng-template kendoTabContent>
          <div class="outline-div">
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Bunching Hrs">
                <kendo-textbox formControlName="HBunchingH" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HBunchingH', 'Bunching Hrs')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Bunching %">
                <kendo-textbox formControlName="HBunchingP" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HBunchingP', 'Bunching %')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Skidding Hrs">
                <kendo-textbox formControlName="HSkiddingH" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HSkiddingH', 'Skidding Hrs')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Skidding %">
                <kendo-textbox formControlName="HSkiddingP" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HSkiddingP', 'Skidding %')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Decking Hrs">
                <kendo-textbox formControlName="HDeckingH" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HDeckingH', 'Decking Hrs')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Decking %">
                <kendo-textbox formControlName="HDeckingP" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HDeckingP', 'Decking %')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Processing Hrs">
                <kendo-textbox formControlName="HProcessingH" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HProcessingH', 'Processing Hrs')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Processing %">
                <kendo-textbox formControlName="HProcessingP" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HProcessingP', 'Processing %')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Loading Hrs">
                <kendo-textbox formControlName="HLoadingH" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HLoadingH', 'Loading Hrs')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Loading %">
                <kendo-textbox formControlName="HLoadingP" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('HLoadingP', 'Loading %')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
          </div>
        </ng-template>
      </kendo-tabstrip-tab>

      <kendo-tabstrip-tab [title]="'Road Construction'">
        <ng-template kendoTabContent>
          <div class="outline-div">
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Cat 1 Type">
                <kendo-textbox formControlName="RCat1Type" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openCatKeyboard('RCat1Type', 'Cat 1 Type')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Cat 1">
                <kendo-textbox formControlName="RCat1" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RCat1', 'Cat 1')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Cat 2 Type">
                <kendo-textbox formControlName="RCat2Type" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openCatKeyboard('RCat2Type', 'Cat 2 Type')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Cat 2">
                <kendo-textbox formControlName="RCat2" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RCat2', 'Cat 2')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Hoe 1 Type">
                <kendo-textbox formControlName="RHoe1Type" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openHoeKeyboard('RHoe1Type', 'Hoe 1 Type')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Hoe 1">
                <kendo-textbox formControlName="RHoe1" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RHoe1', 'Hoe 1')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Hoe 2 Type">
                <kendo-textbox formControlName="RHoe2Type" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openHoeKeyboard('RHoe2Type', 'Hoe 2 Type')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Hoe 2">
                <kendo-textbox formControlName="RHoe2" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RHoe2', 'Hoe 2')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Rock Truck">
                <kendo-textbox formControlName="RRockTruck" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RRockTruck', 'Rock Truck')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Grader">
                <kendo-textbox formControlName="RGrader" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RGrader', 'Grader')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Packer">
                <kendo-textbox formControlName="RPacker" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RPacker', 'Packer')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Labour Hrs">
                <kendo-textbox formControlName="RLabour" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RLabour', 'Labour Hrs')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Labour %">
                <kendo-textbox formControlName="RLabour" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RLabour', 'Labour %')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="%">
                <kendo-textbox formControlName="RPercent" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('RPercent', '%')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
          </div>
        </ng-template>
      </kendo-tabstrip-tab>

      <kendo-tabstrip-tab [title]="'Graveling'">
        <ng-template kendoTabContent>
          <div class="outline-div">
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Cat 1 Type">
                <kendo-textbox formControlName="GCat1Type" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openCatKeyboard('GCat1Type', 'Cat 1 Type')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Cat 1">
                <kendo-textbox formControlName="GCat1" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GCat1', 'Cat 1')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Cat 2 Type">
                <kendo-textbox formControlName="GCat2Type" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openCatKeyboard('GCat2Type', 'Cat 2 Type')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Cat 2">
                <kendo-textbox formControlName="GCat2" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GCat2', 'Cat 2')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Hoe 1 Type">
                <kendo-textbox formControlName="GHoe1Type" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openHoeKeyboard('GHoe1Type', 'Hoe 1 Type')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Hoe 1">
                <kendo-textbox formControlName="GHoe1" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GHoe1', 'Hoe 1')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Hoe 2 Type">
                <kendo-textbox formControlName="GHoe2Type" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openHoeKeyboard('GHoe2Type', 'Hoe 2 Type')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Hoe 2">
                <kendo-textbox formControlName="GHoe2" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GHoe2', 'Hoe 2')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Rock Truck">
                <kendo-textbox formControlName="GRockTruck" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GRockTruck', 'Rock Truck')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Grader">
                <kendo-textbox formControlName="GGrader" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GGrader', 'Grader')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Packer">
                <kendo-textbox formControlName="GPacker" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GPacker', 'Packer')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Labour Hrs">
                <kendo-textbox formControlName="GLabour" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GLabour', 'Labour Hrs')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="Labour %">
                <kendo-textbox formControlName="GLabour" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GLabour', 'Labour %')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
            <kendo-formfield>
              <kendo-floatinglabel class="outline" text="%">
                <kendo-textbox formControlName="GPercent" fillMode="outline" [placeholder]="''" [readonly]="true" (click)="openNumericKeyboard('GPercent', '%')"></kendo-textbox>
              </kendo-floatinglabel>
            </kendo-formfield>
          </div>
        </ng-template>
      </kendo-tabstrip-tab>
    </kendo-tabstrip>

    <div class="button-group">
      <button kendoButton [themeColor]="'primary'" type="submit" [disabled]="!form.valid">Save</button>
      <button kendoButton type="button" (click)="cancel()">Cancel</button>
    </div>
  </form>
</div>

<!-- Custom keyboard component -->
<lib-keyboard
  *ngIf="keyboardForm.keyboardOpen"
  [isOpen]="keyboardForm.keyboardOpen"
  [config]="keyboardForm.keyboardConfig"
  (valueChange)="onKeyboardValueChange($event)"
  (close)="onKeyboardClose()"
></lib-keyboard>
  `
})
export class ProductionsForm implements OnInit {
  public get dateValue(): Date | null {
    const val = this.form.controls.Date.value;
    return val ? new Date(val) : null;
  }
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(ProductionsStore);
  protected keyboardForm = inject(KeyboardFormService);

  protected isCreateMode = false;
  private productionId: string | null = null;
  // Simple flat form matching the flattened model
  public form = new FormGroup<{
    ProductionId: FormControl<string>;
    BlockId: FormControl<string>;
    UserId: FormControl<string>;
    Date: FormControl<string>;
    BranchTimestamp: FormControl<string>;
    SubmitTimestamp: FormControl<string>;
    DeviceId: FormControl<string>;
    HBunchingH: FormControl<number>;
    HBunchingP: FormControl<number>;
    HSkiddingH: FormControl<number>;
    HSkiddingP: FormControl<number>;
    HDeckingH: FormControl<number>;
    HDeckingP: FormControl<number>;
    HProcessingH: FormControl<number>;
    HProcessingP: FormControl<number>;
    HLoadingH: FormControl<number>;
    HLoadingP: FormControl<number>;
    RCat1Type: FormControl<string>;
    RCat1: FormControl<number>;
    RCat2Type: FormControl<string>;
    RCat2: FormControl<number>;
    RHoe1Type: FormControl<string>;
    RHoe1: FormControl<number>;
    RHoe2Type: FormControl<string>;
    RHoe2: FormControl<number>;
    RRockTruck: FormControl<number>;
    RGrader: FormControl<number>;
    RPacker: FormControl<number>;
    RLabour: FormControl<number>;
    RPercent: FormControl<number>;
    GCat1Type: FormControl<string>;
    GCat1: FormControl<number>;
    GCat2Type: FormControl<string>;
    GCat2: FormControl<number>;
    GHoe1Type: FormControl<string>;
    GHoe1: FormControl<number>;
    GHoe2Type: FormControl<string>;
    GHoe2: FormControl<number>;
    GRockTruck: FormControl<number>;
    GGrader: FormControl<number>;
    GPacker: FormControl<number>;
    GLabour: FormControl<number>;
    GPercent: FormControl<number>;
  }>({
    ProductionId: new FormControl<string>('', { nonNullable: true }),
    BlockId: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    UserId: new FormControl<string>('', { nonNullable: true }),
    Date: new FormControl<string>('', { nonNullable: true }),
    BranchTimestamp: new FormControl<string>('', { nonNullable: true }),
    SubmitTimestamp: new FormControl<string>('', { nonNullable: true }),
    DeviceId: new FormControl<string>('', { nonNullable: true }),
    HBunchingH: new FormControl<number>(0, { nonNullable: true }),
    HBunchingP: new FormControl<number>(0, { nonNullable: true }),
    HSkiddingH: new FormControl<number>(0, { nonNullable: true }),
    HSkiddingP: new FormControl<number>(0, { nonNullable: true }),
    HDeckingH: new FormControl<number>(0, { nonNullable: true }),
    HDeckingP: new FormControl<number>(0, { nonNullable: true }),
    HProcessingH: new FormControl<number>(0, { nonNullable: true }),
    HProcessingP: new FormControl<number>(0, { nonNullable: true }),
    HLoadingH: new FormControl<number>(0, { nonNullable: true }),
    HLoadingP: new FormControl<number>(0, { nonNullable: true }),
    RCat1Type: new FormControl<string>('', { nonNullable: true }),
    RCat1: new FormControl<number>(0, { nonNullable: true }),
    RCat2Type: new FormControl<string>('', { nonNullable: true }),
    RCat2: new FormControl<number>(0, { nonNullable: true }),
    RHoe1Type: new FormControl<string>('', { nonNullable: true }),
    RHoe1: new FormControl<number>(0, { nonNullable: true }),
    RHoe2Type: new FormControl<string>('', { nonNullable: true }),
    RHoe2: new FormControl<number>(0, { nonNullable: true }),
    RRockTruck: new FormControl<number>(0, { nonNullable: true }),
    RGrader: new FormControl<number>(0, { nonNullable: true }),
    RPacker: new FormControl<number>(0, { nonNullable: true }),
    RLabour: new FormControl<number>(0, { nonNullable: true }),
    RPercent: new FormControl<number>(0, { nonNullable: true }),
    GCat1Type: new FormControl<string>('', { nonNullable: true }),
    GCat1: new FormControl<number>(0, { nonNullable: true }),
    GCat2Type: new FormControl<string>('', { nonNullable: true }),
    GCat2: new FormControl<number>(0, { nonNullable: true }),
    GHoe1Type: new FormControl<string>('', { nonNullable: true }),
    GHoe1: new FormControl<number>(0, { nonNullable: true }),
    GHoe2Type: new FormControl<string>('', { nonNullable: true }),
    GHoe2: new FormControl<number>(0, { nonNullable: true }),
    GRockTruck: new FormControl<number>(0, { nonNullable: true }),
    GGrader: new FormControl<number>(0, { nonNullable: true }),
    GPacker: new FormControl<number>(0, { nonNullable: true }),
    GLabour: new FormControl<number>(0, { nonNullable: true }),
    GPercent: new FormControl<number>(0, { nonNullable: true })
  });

  public onDateChange(date: Date | null): void {
    this.form.controls.Date.setValue(date ? date.toISOString() : '');
    this.form.controls.Date.markAsDirty();
  }

  constructor() {
    this.keyboardForm.setForm(this.form);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new') {
      this.isCreateMode = true;
      // Set default date
      this.form.controls.Date.setValue(new Date().toISOString());
    } else {
      this.isCreateMode = false;
      this.productionId = id;
      const production = this.store.entities().find(p => p.ProductionId === id);
      if (production) {
        // Direct patch - form matches model 1:1!
        this.form.patchValue(production);
        this.form.markAsPristine();
      } else {
        console.warn('Production not found:', id);
        this.router.navigate(['/productions']);
      }
    }
  }

  async save(): Promise<void> {
    if (!this.form.valid) {
      console.warn('Form is invalid');
      return;
    }

    // Set event sourcing metadata
    const submitTimestamp = toPacificDateTimeOffset(new Date());
    this.form.controls.SubmitTimestamp.setValue(submitTimestamp);
    this.form.controls.DeviceId.setValue(getDeviceId());
    
    // Set BranchTimestamp only on create, preserve on update
    if (this.isCreateMode || !this.form.controls.BranchTimestamp.value) {
      this.form.controls.BranchTimestamp.setValue(submitTimestamp);
    }

    // Get full form value with proper typing
    const formValue = this.form.getRawValue();

    if (this.isCreateMode) {
      const newId = generateGuid();
      const newProduction: Production = {
        ...formValue,
        id: newId,
        ProductionId: newId,
      };
      console.log('✨ [API PAYLOAD] Creating production:', JSON.stringify(newProduction, null, 2));
      await this.store['create'](newProduction);
      this.store['createToServer'](newProduction);
    } else {
      if (!this.productionId) {
        console.warn('No productionId for update');
        return;
      }
      const updatedProduction: Production = {
        ...formValue,
        id: this.productionId,
        ProductionId: this.productionId,
      };
      console.log('🔄 [API PAYLOAD] Updating production:', JSON.stringify(updatedProduction, null, 2));
      await this.store['update'](updatedProduction);
      this.store['updateToServer'](this.productionId, updatedProduction);
    }

    this.router.navigate(['/productions']);
  }

  public openNumericKeyboard(field: string, title: string): void {
    this.keyboardForm.openNumeric(field, title, true);
  }

  public openCatKeyboard(field: string, title: string): void {
    this.keyboardForm.openEquipment(field, title, ['D6', 'D7', 'D8', '527']);
  }

  public openHoeKeyboard(field: string, title: string): void {
    this.keyboardForm.openEquipment(field, title, ['250', '290', '320', '350']);
  }

  public onKeyboardValueChange(value: string): void {
    this.keyboardForm.handleValueChange(value);
  }

  public onKeyboardClose(): void {
    this.keyboardForm.handleKeyboardClose();
  }

  public cancel(): void {
    this.router.navigate(['/productions']);
  }
}