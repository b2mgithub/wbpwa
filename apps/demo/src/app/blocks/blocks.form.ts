import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_DATEINPUTS } from '@progress/kendo-angular-dateinputs';
import { FormFieldModule, KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule, KENDO_LABEL } from '@progress/kendo-angular-label';

import { generateGuid, getDeviceId } from '@wbpwa/guid';

import { Block } from './blocks.model';
import { BlocksStore } from './blocks.state';

@Component({
  selector: 'app-blocks-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KENDO_BUTTONS,
    KENDO_DATEINPUTS,
    KENDO_INPUTS,
    KENDO_LABEL,
    FloatingLabelModule,
    FormFieldModule
  ],
  template: `
    <div class="outline-form">
      <h2>{{ isCreateMode ? 'Create Block' : 'Update Block' }}</h2>
      
      <form [formGroup]="form" (ngSubmit)="save()" autocomplete="off">
        <div class="outline-div">
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Block Name">
              <kendo-textbox
                formControlName="BlockName"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Division">
              <kendo-textbox
                formControlName="Division"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Description">
              <kendo-textbox
                formControlName="Description"
                fillMode="outline"
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Block Volume">
              <kendo-numerictextbox
                formControlName="BlockVolume"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Start Date">
              <kendo-datepicker
                formControlName="StartDate"
                [fillMode]="'outline'"
              ></kendo-datepicker>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="End Date">
              <kendo-datepicker
                formControlName="EndDate"
                [fillMode]="'outline'"
              ></kendo-datepicker>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Bunching">
              <kendo-numerictextbox
                formControlName="Bunching"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Skidding">
              <kendo-numerictextbox
                formControlName="Skidding"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Decking">
              <kendo-numerictextbox
                formControlName="Decking"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Processing">
              <kendo-numerictextbox
                formControlName="Processing"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Loading">
              <kendo-numerictextbox
                formControlName="Loading"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Road Construction (Km)">
              <kendo-numerictextbox
                formControlName="RoadConstructionKm"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Road Construction ($)">
              <kendo-numerictextbox
                formControlName="RoadConstruction"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
                [format]="'c'"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Graveling (Km)">
              <kendo-numerictextbox
                formControlName="GravelingKm"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
              ></kendo-numerictextbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Graveling ($)">
              <kendo-numerictextbox
                formControlName="Graveling"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
                [format]="'c'"
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
export class BlocksForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public store = inject(BlocksStore);

  blockId: string | null = null;
  isCreateMode = true;

  form = new FormGroup({
    BlockName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    Division: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    Description: new FormControl('', { nonNullable: true }),
    BlockVolume: new FormControl(0, { nonNullable: true }),
    StartDate: new FormControl<Date | null>(null),
    EndDate: new FormControl<Date | null>(null),
    Bunching: new FormControl(0, { nonNullable: true }),
    Skidding: new FormControl(0, { nonNullable: true }),
    Decking: new FormControl(0, { nonNullable: true }),
    Processing: new FormControl(0, { nonNullable: true }),
    Loading: new FormControl(0, { nonNullable: true }),
    RoadConstructionKm: new FormControl(0, { nonNullable: true }),
    RoadConstruction: new FormControl(0, { nonNullable: true }),
    GravelingKm: new FormControl(0, { nonNullable: true }),
    Graveling: new FormControl(0, { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id === 'new') {
      this.isCreateMode = true;
    } else {
      this.isCreateMode = false;
      this.blockId = id;
      const block = this.store.entities().find(b => b.BlockId === id);

      if (block) {
        this.form.patchValue({
          BlockName: block.BlockName,
          Division: block.Division,
          Description: block.Description,
          BlockVolume: block.BlockVolume,
          StartDate: block.StartDate ? new Date(block.StartDate) : null,
          EndDate: block.EndDate ? new Date(block.EndDate) : null,
          Bunching: block.Bunching,
          Skidding: block.Skidding,
          Decking: block.Decking,
          Processing: block.Processing,
          Loading: block.Loading,
          RoadConstructionKm: block.RoadConstructionKm,
          RoadConstruction: block.RoadConstruction,
          GravelingKm: block.GravelingKm,
          Graveling: block.Graveling
        });
        this.form.markAsPristine();
      } else {
        this.router.navigate(['/blocks']);
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
      const newBlock: Block = {
        id: newId,
        BlockId: newId,
        BlockName: formValue.BlockName,
        Division: formValue.Division,
        Description: formValue.Description,
        BlockVolume: formValue.BlockVolume,
        StartDate: formValue.StartDate?.toISOString() || '',
        EndDate: formValue.EndDate?.toISOString() || '',
        Bunching: formValue.Bunching,
        Skidding: formValue.Skidding,
        Decking: formValue.Decking,
        Processing: formValue.Processing,
        Loading: formValue.Loading,
        RoadConstructionKm: formValue.RoadConstructionKm,
        RoadConstruction: formValue.RoadConstruction,
        GravelingKm: formValue.GravelingKm,
        Graveling: formValue.Graveling,
        BranchTimestamp: submitTimestamp,
        SubmitTimestamp: submitTimestamp,
        DeviceId: deviceId
      };
      await this.store['create'](newBlock);
      this.store['createToServer'](newBlock);
    } else if (this.blockId) {
      const existingBlock = this.store.entities().find(b => b.BlockId === this.blockId);
      if (!existingBlock) {
        return;
      }

      const updatedBlock: Block = {
        ...existingBlock,
        BlockName: formValue.BlockName,
        Division: formValue.Division,
        Description: formValue.Description,
        BlockVolume: formValue.BlockVolume,
        StartDate: formValue.StartDate?.toISOString() || '',
        EndDate: formValue.EndDate?.toISOString() || '',
        Bunching: formValue.Bunching,
        Skidding: formValue.Skidding,
        Decking: formValue.Decking,
        Processing: formValue.Processing,
        Loading: formValue.Loading,
        RoadConstructionKm: formValue.RoadConstructionKm,
        RoadConstruction: formValue.RoadConstruction,
        GravelingKm: formValue.GravelingKm,
        Graveling: formValue.Graveling,
        BranchTimestamp: existingBlock.BranchTimestamp || submitTimestamp,
        SubmitTimestamp: submitTimestamp,
        DeviceId: deviceId
      };
      await this.store['update'](updatedBlock);
      this.store['updateToServer'](this.blockId, updatedBlock);
    }

    this.router.navigate(['/blocks']);
  }

  cancel(): void {
    this.router.navigate(['/blocks']);
  }
}
