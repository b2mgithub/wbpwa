import { Component, Input, Output, EventEmitter } from '@angular/core';
import {  FormGroup, FormControl } from '@angular/forms';
import { Rate } from './store/rate.model';


@Component({
  selector: 'wbapp-rates-edit',
  styles: ['input[type=text] { width: 100%; }'],
  template: `
  <kendo-dialog *ngIf="active" [width]="300" [height]="200" (close)="closeForm()">
    <kendo-dialog-titlebar>Edit {{editForm.value.Type}} Hourly Rate</kendo-dialog-titlebar>
    <form novalidate [formGroup]="editForm">
      <div class="form-group">
        <label for="Rate" class="control-label">Rate</label>
        <kendo-numerictextbox formControlName="Rate" [format]="'c'" style="width: 100%"></kendo-numerictextbox>
      </div>
    </form>
    <kendo-dialog-actions>
        <button class="k-button" (click)="onCancel($event)">Cancel</button>
        <button class="k-button k-primary" [disabled]="!editForm.valid" (click)="onSave($event)">Save</button>
    </kendo-dialog-actions>
  </kendo-dialog>`
})
export class RatesGridEditFormComponent {
    public active = false;
    public editForm: FormGroup = new FormGroup({
        'URateId': new FormControl(),
        'Type': new FormControl(),
        'SubType': new FormControl(),
        'Rate': new FormControl(),
        'TimeStamp': new FormControl()
    });

    @Input() public set model(rate: Rate) {
        this.editForm.reset(rate);
        this.active = rate !== undefined;
    }

    @Output() cancel: EventEmitter<any> = new EventEmitter();
    @Output() save: EventEmitter<Rate> = new EventEmitter<Rate>();

    public onSave(e): void {
        e.preventDefault();
        this.save.emit(this.editForm.value);
        this.active = false;
    }

    onCancel(e): void {
        e.preventDefault();
        this.closeForm();
    }

    closeForm(): void {
        this.active = false;
        this.cancel.emit();
    }
}
