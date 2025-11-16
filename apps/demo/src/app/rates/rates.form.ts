
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { KENDO_LABEL } from '@progress/kendo-angular-label';
import { FloatingLabelModule } from '@progress/kendo-angular-label';
import { FormFieldModule } from '@progress/kendo-angular-inputs';
import { form, Validators } from '@angular/forms/signals';
import { generateGuid } from '@devils-offline/guid';
import { Rate, createBlankRate } from './rates.model';
import { RatesStore } from './rates.state';

@Component({
  selector: 'app-rates-form',
  standalone: true,
  imports: [KENDO_BUTTONS, KENDO_INPUTS, KENDO_LABEL, FloatingLabelModule, FormFieldModule],
  template: `
    <div class="form-div">
      <form (ngSubmit)="save()" autocomplete="off">
        <div class="outline-div">
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Type">
              <kendo-textbox
                [value]="form().type().value()"
                (valueChange)="form().type().value.set($event)"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Sub Type">
              <kendo-textbox
                [value]="form().subType().value()"
                (valueChange)="form().subType().value.set($event)"
                fillMode="outline"
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Rate">
              <kendo-numerictextbox
                [value]="form().rate().value()"
                (valueChange)="form().rate().value.set($event)"
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
          <button kendoButton themeColor="primary" type="submit">Save</button>
          <button kendoButton type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </div>
  `
})
export class RatesForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public store = inject(RatesStore);

  // Signal Form state
  form = form({
    type: ['', Validators.required],
    subType: [''],
    rate: [0, Validators.required],
  });
  rateId: string | null = null;
  isCreateMode = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isCreateMode = false;
      this.rateId = id;
      const rate = this.store.entities().find(r => r.RateId === id);
      if (rate) {
        this.form().type().value.set(rate.Type);
        this.form().subType().value.set(rate.SubType);
        this.form().rate().value.set(rate.Rate);
      } else {
        this.router.navigate(['/rates']);
      }
    }
  }

  async save(): Promise<void> {
    if (!this.form().type().value() || this.form().rate().value() == null) return;
    const now = new Date().toISOString();
    if (this.isCreateMode) {
      const newId = generateGuid();
      const newRate: Rate = {
        id: newId,
        RateId: newId,
        Type: this.form().type().value(),
        SubType: this.form().subType().value(),
        Rate: this.form().rate().value(),
        TimeStamp: now
      };
      await this.store['create'](newRate);
      this.store['createToServer'](newRate);
    } else if (this.rateId) {
      const updatedRate: Rate = {
        id: this.rateId,
        RateId: this.rateId,
        Type: this.form().type().value(),
        SubType: this.form().subType().value(),
        Rate: this.form().rate().value(),
        TimeStamp: now
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
