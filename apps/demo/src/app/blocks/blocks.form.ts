import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_DATEINPUTS } from '@progress/kendo-angular-dateinputs';
import { FormFieldModule, KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule, KENDO_LABEL } from '@progress/kendo-angular-label';

import { generateGuid } from '@devils-offline/guid';

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
            <kendo-floatinglabel class="outline" text="Block">
              <kendo-textbox
                formControlName="block"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Division">
              <kendo-textbox
                formControlName="division"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Description">
              <kendo-textbox
                formControlName="description"
                fillMode="outline"
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Block Volume">
              <kendo-numerictextbox
                formControlName="blockVolume"
                fillMode="outline"
                [min]="0"
                [decimals]="2"
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
    block: new FormControl('', { nonNullable: true }),
    division: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    blockVolume: new FormControl(0, { nonNullable: true }),
    startDate: new FormControl<Date | null>(null),
    endDate: new FormControl<Date | null>(null),
    bunching: new FormControl(0, { nonNullable: true }),
    skidding: new FormControl(0, { nonNullable: true }),
    decking: new FormControl(0, { nonNullable: true }),
    processing: new FormControl(0, { nonNullable: true }),
    loading: new FormControl(0, { nonNullable: true }),
    roadConstructionKm: new FormControl(0, { nonNullable: true }),
    roadConstruction: new FormControl(0, { nonNullable: true }),
    gravelingKm: new FormControl(0, { nonNullable: true }),
    graveling: new FormControl(0, { nonNullable: true })
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
          block: block.Block,
          division: block.Division,
          description: block.Description,
          blockVolume: block.BlockVolume,
          startDate: block.StartDate ? new Date(block.StartDate) : null,
          endDate: block.EndDate ? new Date(block.EndDate) : null,
          bunching: block.Bunching,
          skidding: block.Skidding,
          decking: block.Decking,
          processing: block.Processing,
          loading: block.Loading,
          roadConstructionKm: block.RoadConstructionKm,
          roadConstruction: block.RoadConstruction,
          gravelingKm: block.GravelingKm,
          graveling: block.Graveling
        });
        this.form.markAsPristine();
      } else {
        this.router.navigate(['/blocks']);
      }
    }
  }

  async save(): Promise<void> {
    const formValue = this.form.getRawValue();

    if (!formValue.block || !formValue.division) {
      console.warn('Block and Division are required');
      return;
    }

    const now = new Date().toISOString();

    if (this.isCreateMode) {
      const newId = generateGuid();
      const newBlock: Block = {
        id: newId,
        BlockId: newId,
        Block: formValue.block,
        Division: formValue.division,
        Description: formValue.description,
        BlockVolume: formValue.blockVolume,
        StartDate: formValue.startDate?.toISOString() || '',
        EndDate: formValue.endDate?.toISOString() || '',
        Bunching: formValue.bunching,
        Skidding: formValue.skidding,
        Decking: formValue.decking,
        Processing: formValue.processing,
        Loading: formValue.loading,
        RoadConstructionKm: formValue.roadConstructionKm,
        RoadConstruction: formValue.roadConstruction,
        GravelingKm: formValue.gravelingKm,
        Graveling: formValue.graveling,
        TimeStamp: now
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
        Block: formValue.block,
        Division: formValue.division,
        Description: formValue.description,
        BlockVolume: formValue.blockVolume,
        StartDate: formValue.startDate?.toISOString() || '',
        EndDate: formValue.endDate?.toISOString() || '',
        Bunching: formValue.bunching,
        Skidding: formValue.skidding,
        Decking: formValue.decking,
        Processing: formValue.processing,
        Loading: formValue.loading,
        RoadConstructionKm: formValue.roadConstructionKm,
        RoadConstruction: formValue.roadConstruction,
        GravelingKm: formValue.gravelingKm,
        Graveling: formValue.graveling,
        TimeStamp: now
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
