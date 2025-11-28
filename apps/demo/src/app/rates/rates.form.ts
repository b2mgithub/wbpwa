import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { FormFieldModule } from '@progress/kendo-angular-inputs';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule } from '@progress/kendo-angular-label';
import { KENDO_LABEL } from '@progress/kendo-angular-label';

import { generateGuid, getDeviceId } from '@wbpwa/guid';

import { Rate } from './rates.model';
import { RatesStore } from './rates.state';

@Component({
  selector: 'app-rates-form',
  standalone: true,
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
      <h2>{{ isCreateMode ? 'Create Rate' : 'Update Rate' }}</h2>
      <form [formGroup]="form" (ngSubmit)="save()" autocomplete="off">
        <div class="outline-div">
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Type">
              <kendo-textbox
                formControlName="Type"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Sub Type">
              <kendo-textbox
                formControlName="SubType"
                fillMode="outline"
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Rate Value">
              <kendo-numerictextbox
                formControlName="RateValue"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
                [format]="'c'"
                required
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
export class RatesForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public store = inject(RatesStore);

  rateId: string | null = null;
  isCreateMode = true;

  form = new FormGroup({
    Type: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    SubType: new FormControl('', { nonNullable: true }),
    RateValue: new FormControl(0, { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      this.isCreateMode = false;
      this.rateId = id;
      const rate = this.store.entities().find(r => r.RateId === id);
      
      if (rate) {
        // Use patchValue - floating labels will animate automatically
        this.form.patchValue({
          Type: rate.Type,
          SubType: rate.SubType,
          RateValue: rate.RateValue
        });
        this.form.markAsPristine();
      } else {
        this.router.navigate(['/rates']);
      }
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const submitTimestamp = new Date().toISOString();
    const deviceId = getDeviceId();

    if (this.isCreateMode) {
      const newId = generateGuid();
      const newRate: Rate = {
        id: newId,
        RateId: newId,
        Type: formValue.Type,
        SubType: formValue.SubType,
        RateValue: formValue.RateValue,
        BranchTimestamp: submitTimestamp,
        SubmitTimestamp: submitTimestamp,
        DeviceId: deviceId
      };
      await this.store['create'](newRate);
      this.store['createToServer'](newRate);
    } else if (this.rateId) {
      const existingRate = this.store.entities().find(r => r.RateId === this.rateId);
      const updatedRate: Rate = {
        id: this.rateId,
        RateId: this.rateId,
        Type: formValue.Type,
        SubType: formValue.SubType,
        RateValue: formValue.RateValue,
        BranchTimestamp: existingRate?.BranchTimestamp || submitTimestamp,
        SubmitTimestamp: submitTimestamp,
        DeviceId: deviceId
      };
      await this.store['update'](updatedRate);
      this.store['updateToServer'](this.rateId, updatedRate);
    }
    
    this.router.navigate(['/rates']);
  }

  cancel(): void {
    this.router.navigate(['/rates']);
  }
}