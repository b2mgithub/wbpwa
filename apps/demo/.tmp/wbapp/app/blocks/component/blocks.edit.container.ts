import { Component, OnInit } from '@angular/core';
import { Block } from '../store/blocks.model';
import { Store, select } from '@ngrx/store';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Guid } from 'guid-typescript';
import { selectEditItem } from '../store/blocks.selectors';
import { BlocksEntityService } from '../store/blocks.entity-service';
import { formatDate } from '@angular/common';
import { dateFromISOString } from '@b2m/date';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'productions-blocks-edit-container',
  styles: ['input[type=text] { width: 100%; }'],
  template: `
  <kendo-dialog *ngIf="editDataItem$ | async" [width]="300" [height]="'90%'" (close)="closeForm()">
    <kendo-dialog-titlebar>
      {{ isNew ? 'Add New Block' : 'Edit Block' }}
    </kendo-dialog-titlebar>

    <form novalidate [formGroup]="editForm">
      <div class="form-group">
        <label for="Block" class="control-label">Block</label>
        <input type="text" class="k-textbox" formControlName="Block" />
      </div>
      <div class="form-group">
        <label for="Description" class="control-label">Description</label>
        <input type="text" class="k-textbox" formControlName="Description" />
      </div>
      <div class="form-group">
        <label for="Division" class="control-label">Division</label>
        <kendo-dropdownlist 
          [data]="divisions" 
          formControlName="Division"
          style="width: 100%">
        </kendo-dropdownlist> 
      </div>
      <div class="form-group">
        <label for="BlockVolume" class="control-label">Block Volume</label>
        <input type="number" class="k-textbox" formControlName="BlockVolume" />
      </div>
      <div class="form-group">
        <label for="StartDate" class="control-label">Start Date</label>
        <kendo-datepicker formControlName="StartDate"></kendo-datepicker>
      </div>
      <div class="form-group">
        <label for="EndDate" class="control-label">End Date</label>
        <kendo-datepicker formControlName="EndDate"></kendo-datepicker>
      </div>
      <div class="form-group">
        <label for="Bunching" class="control-label">Bunching</label>
        <input type="number" class="k-textbox" formControlName="Bunching" />
      </div>
      <div class="form-group">
        <label for="Skidding" class="control-label">Skidding</label>
        <input type="number" class="k-textbox" formControlName="Skidding" />
      </div>
      <div class="form-group">
        <label for="Decking" class="control-label">Decking</label>
        <input type="number" class="k-textbox" formControlName="Decking" />
      </div>
      <div class="form-group">
        <label for="Processing" class="control-label">Processing</label>
        <input type="number" class="k-textbox" formControlName="Processing" />
      </div>
      <div class="form-group">
        <label for="Loading" class="control-label">Loading</label>
        <input type="number" class="k-textbox" formControlName="Loading" />
      </div>
      <div class="form-group">
        <label for="RoadConstructionKm" class="control-label">Road Construction Km</label>
        <input type="number" class="k-textbox" formControlName="RoadConstructionKm" />
      </div>
      <div class="form-group">
        <label for="RoadConstruction" class="control-label">Road Construction Budget</label>
        <kendo-numerictextbox formControlName="RoadConstruction" [format]="'c'" style="width: 100%"></kendo-numerictextbox>
      </div>
      <div class="form-group">
        <label for="GravelingKm" class="control-label">Graveling Km</label>
        <input type="number" class="k-textbox" formControlName="GravelingKm" />
      </div>
      <div class="form-group">
        <label for="Graveling" class="control-label">Graveling Budget</label>
        <kendo-numerictextbox formControlName="Graveling" [format]="'c'" style="width: 100%"></kendo-numerictextbox>
      </div>
    </form>

    <kendo-dialog-actions>
        <button class="k-button" (click)="onCancel($event)">Cancel</button>
        <button class="k-button k-primary" [disabled]="!editForm.valid" 
            (click)="onSave($event)">Save</button>
    </kendo-dialog-actions>
  </kendo-dialog>`
})
export class BlocksGridEditFormContainer implements OnInit {
  public editDataItem$: Observable<Block>;
  public removeDataItem: Block;
  public isNew: boolean;
  public loading$: Observable<boolean>;


  constructor(
    private store: Store<any>,
    private router: Router,
    private blocksEntityService: BlocksEntityService,
  ) {}

  public ngOnInit(): void {

    if (this.router.url.endsWith('/add')) {
      this.isNew = true;

      const newBlock = new Block();
      newBlock.UBlockId = Guid.create().toString();
      console.log("adding:", newBlock);
      this.editDataItem$ = of(newBlock);


    } else if (this.router.url.match('/edit/')) {
      this.isNew = false;
      this.editDataItem$ = this.store.pipe(select(selectEditItem));

    } else {
      this.editDataItem$ = of(undefined);
    }

    this.editDataItem$.subscribe(i => this.model = i);
  }

  public saveHandler(block: Block) {

    if(this.isNew){
      console.log('Block dispatched to add(Block) Service', block);
      this.blocksEntityService.add(block);
    } else {
      console.log('Block dispatched to update(Block) Service', block);
      this.blocksEntityService.update(block);
    }
    window.history.back();
  }

  public cancelHandler() {
    window.history.back();
  }

  closeForm(): void {
    window.history.back();
  }




  public editForm: FormGroup = new FormGroup({
    'UBlockId': new FormControl(),
    'Block': new FormControl(),
    'Description': new FormControl(),
    'Division': new FormControl(),
    'BlockVolume': new FormControl(),
    'StartDate': new FormControl(),
    'EndDate': new FormControl(),
    'Bunching': new FormControl(),
    'Skidding': new FormControl(),
    'Decking': new FormControl(),
    'Processing': new FormControl(),
    'Loading': new FormControl(),
    'RoadConstructionKm': new FormControl(),
    'RoadConstruction': new FormControl(),
    'GravelingKm': new FormControl(),
    'Graveling': new FormControl(),
    'TimeStamp': new FormControl(),
  });

  public divisions = ['Houston', 'Prince George', 'All'];

  public set model(block: Block) {
    /**
     * the date modification in the component instead of the containter
     * because means that we pass real Blocks instead of weird datefilled blocks.
     * we need dates because of the form and this doesn't add state; so this 
     * justifies that this is in the realm of components instead of components. 
     * */
    if (block) {
      const fixedDates = {
        ...block,
        "StartDate": block.StartDate ? dateFromISOString(block.StartDate) : undefined,
        "EndDate": block.EndDate ? dateFromISOString(block.EndDate) : undefined,
      };
      console.log('blocks fixedDates after', JSON.stringify(fixedDates));
      this.editForm.reset(fixedDates);
    } else {
      this.editForm.reset(block);
    }

  }

  public onSave(e): void {
    e.preventDefault();

    /**
     * the date modification in the component instead of the containter
     * because means that we pass real Blocks instead of weird datefilled blocks.
     * we need dates because of the form and this doesn't add state; so this 
     * justifies that this is in the realm of components instead of components. 
     * */
    const pseudoblock = this.editForm.value;

    pseudoblock.TimeStamp = new Date();
    pseudoblock.StartDate = formatDate(pseudoblock.StartDate, 'yyyy-MM-dd', 'en-US');
    pseudoblock.EndDate = formatDate(pseudoblock.EndDate, 'yyyy-MM-dd', 'en-US');

    this.saveHandler(pseudoblock as Block);
  }

  onCancel(e): void {
    e.preventDefault();
    this.closeForm();
  }
}