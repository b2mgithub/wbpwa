import { Component, Input, Output, EventEmitter } from '@angular/core';
import {  FormGroup, FormControl } from '@angular/forms';
import { User } from './store/users.model';


@Component({
  selector: 'wbapp-users-edit',
  styles: ['input[type=text] { width: 100%; }'],
  template: `
  <kendo-dialog *ngIf="active" [width]="300" [height]="450" (close)="closeForm()">
    <kendo-dialog-titlebar>
      Edit {{ editForm.value.FirstName + "'s" }} User Profile
    </kendo-dialog-titlebar>
    
    <form novalidate [formGroup]="editForm">
      <div class="form-group">
        <label for="Roles" class="control-label">Role</label>
        <kendo-multiselect 
          [data]="roles" 
          formControlName="Roles" 
          style="width: 100%">
        </kendo-multiselect>
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
        <label for="Email" class="control-label">E-mail</label>
        <input type="text" class="k-textbox" formControlName="Email"/>
      </div>
      <div class="form-group">
        <label for="EmailReport" class="control-label">Report</label>
        <kendo-dropdownlist
          [data]="reportOptions"
          formControlName="EmailReport" 
          style="width: 100%">
        </kendo-dropdownlist>
      </div>
    </form>
    <kendo-dialog-actions>
        <button class="k-button" (click)="onCancel($event)">Cancel</button>
        <button class="k-button k-primary" [disabled]="!editForm.valid" (click)="onSave($event)">Save</button>
    </kendo-dialog-actions>
  </kendo-dialog>`
})
export class UsersGridEditFormComponent {
    public active = false;
    public editForm: FormGroup = new FormGroup({
        'UserId': new FormControl(),
        'FirstName': new FormControl(),
        'LastName': new FormControl(),
        'UserName': new FormControl(),
        'Roles': new FormControl(),
        'Division': new FormControl(),
        'Email': new FormControl(),
        'EmailReport': new FormControl(),
        'TimeStamp': new FormControl()
    });

    public roles = ['Admin', 'User'];
    public divisions = ['Houston', 'Prince George', 'All'];
    public reportOptions = [ true, false ];

    @Input() public isNew = false;

    @Input() public set model(user: User) {
        this.editForm.reset(user);
        this.active = user !== undefined;
    }

    @Output() cancel: EventEmitter<any> = new EventEmitter();
    @Output() save: EventEmitter<User> = new EventEmitter<User>();

    onSave(e): void {
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
