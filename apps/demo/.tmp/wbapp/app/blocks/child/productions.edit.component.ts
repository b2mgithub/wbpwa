import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, FormBuilder } from '@angular/forms';

import { Production } from '../../productions/store/productions.model';

@Component({
    selector: 'wbapp-productions-child-edit',
    styles: ['input[type=text] { width: 100%; }'],
    template: `
    <kendo-dialog *ngIf="active" [width]="600" [height]="'90%'" (close)="closeForm()">
      <kendo-dialog-titlebar>
        {{ isNew ? 'Add new production' : 'Edit production' }}
      </kendo-dialog-titlebar>

      <form class="card-header" novalidate [formGroup]="editForm">                
        <div fxLayout="row wrap">
          <table width="100%">     
            <tr>
              <td style="text-align:center; padding:8px;font-size:1.3em;">
                <b>{{ editForm.get("Block").value }}</b>
              </td>
              <td style="text-align:center; padding:8px;font-size:1.3em;">
                <b>{{ editForm.get("Date").value | date:'EE, MMM d' }}</b>
              </td>
            </tr>
          </table>
        </div>
        <kendo-tabstrip (tabSelect)="onTabSelect($event)">                    
          <kendo-tabstrip-tab [title]="'HARVESTING'" [selected]="true">
            <ng-template kendoTabContent>
                <div id="formwrapper">
                  <form formGroupName="Harvesting">
                    <div fxLayout="row wrap">
                      <mat-form-field appearance="outline">
                        <mat-label>Bunching Hrs</mat-label>
                        <input formControlName="HBunchingH" placeholder="Bunching Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Bunching %</mat-label>
                        <input formControlName="HBunchingP" placeholder="Bunching %" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Skidding Hrs</mat-label>
                        <input formControlName="HSkiddingH" placeholder="Skidding Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Skidding %</mat-label>
                        <input formControlName="HSkiddingP" placeholder="Skidding %" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field  appearance="outline">
                        <mat-label>Decking Hrs</mat-label>
                        <input formControlName="HDeckingH" placeholder="Decking Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout"/>
                      </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Decking %</mat-label>
                          <input formControlName="HDeckingP" placeholder="Decking %" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Processing Hrs</mat-label>
                          <input formControlName="HProcessingH" placeholder="Processing Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Processing %</mat-label>
                          <input formControlName="HProcessingP" placeholder="Processing %" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                        </mat-form-field>
                        <mat-form-field  appearance="outline">
                          <mat-label>Loading Hrs</mat-label>
                          <input formControlName="HLoadingH" placeholder="Loading Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Loading %</mat-label>
                          <input formControlName="HLoadingP" placeholder="Loading %" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                        </mat-form-field>
                    </div>
                  </form>
                </div>
                <br><br>
                <br><br><br>
            </ng-template>
        </kendo-tabstrip-tab>
        <kendo-tabstrip-tab [title]="'ROADS'">
          <ng-template kendoTabContent>
            <div id="formwrapper">
              <form formGroupName="RoadConstruction">
                  <div fxLayout="row wrap" fxLayoutAlign="space-around center">
                    <mat-form-field  appearance="outline">
                      <mat-label>Cat 1 Type</mat-label>
                      <input formControlName="RCat1Type" placeholder="Cat 1 Type" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="catTypeLayout" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Cat 1 Hrs</mat-label>
                      <input formControlName="RCat1" placeholder="Cat 1 Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                    </mat-form-field>
                    <mat-form-field  appearance="outline">
                      <mat-label>Cat 2 Type</mat-label>
                      <input formControlName="RCat2Type" placeholder="Cat 2 Type" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="catTypeLayout" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Cat 2 Hrs</mat-label>
                      <input formControlName="RCat2" placeholder="Cat 2 Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Hoe 1 Type</mat-label>
                      <input formControlName="RHoe1Type" placeholder="Hoe 1 Type" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="hoeTypeLayout" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Hoe 1 Hrs</mat-label>
                      <input formControlName="RHoe1" placeholder="Hoe 1 Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Hoe 2 Type</mat-label>
                      <input formControlName="RHoe2Type" placeholder="Hoe 2 Type" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="hoeTypeLayout" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Hoe 2 Hrs</mat-label>
                      <input formControlName="RHoe2" placeholder="Hoe 2 Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Rock Truck Hrs</mat-label>
                      <input formControlName="RRockTruck" placeholder="Rock Truck Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout"/>
                    </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Grader Hrs</mat-label>
                        <input formControlName="RGrader" placeholder="Grader Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Packer Hrs</mat-label>
                        <input formControlName="RPacker" placeholder="Packer Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Labour Hrs</mat-label>
                        <input formControlName="RLabour" placeholder="Labour Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field  appearance="outline">
                        <mat-label>Road Construction %</mat-label>
                        <input formControlName="RPercent" placeholder="Road Const %" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field> 
                      <br>
                        <br><br><br>
                      <br><br>   
                  </div>
              </form>
            </div>
          </ng-template>
        </kendo-tabstrip-tab>
        <kendo-tabstrip-tab [title]="'GRAVEL'">
          <ng-template kendoTabContent> 
              <div id="formwrapper">           
                <form formGroupName="Graveling">
                    <div fxLayout="row wrap" fxLayoutAlign="space-around center">
                      <mat-form-field appearance="outline">
                        <mat-label>Cat 1 Type</mat-label>
                        <input formControlName="GCat1Type" placeholder="Cat 1 Type" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="catTypeLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Cat 1 Hrs</mat-label>
                        <input formControlName="GCat1" placeholder="Cat 1 Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Cat 2 Type</mat-label>
                        <input formControlName="GCat2Type" placeholder="Cat 2 Type" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="catTypeLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Cat 2 Hrs</mat-label>
                        <input formControlName="GCat2" placeholder="Cat 2 Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Hoe 1 Type</mat-label>
                        <input formControlName="GHoe1Type" placeholder="Hoe 1 Type" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="hoeTypeLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Hoe 1 Hrs</mat-label>
                        <input formControlName="GHoe1" placeholder="Hoe 1 Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Hoe 2 Type</mat-label>
                        <input formControlName="GHoe2Type" placeholder="Hoe 2 Type" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="hoeTypeLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Hoe 2 Hrs</mat-label>
                        <input formControlName="GHoe2" placeholder="Hoe 2 Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Rock Truck Hrs</mat-label>
                        <input formControlName="GRockTruck" placeholder="Rock Truck Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout"/>
                      </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Grader Hrs</mat-label>
                          <input formControlName="GGrader" placeholder="Grader Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Packer Hrs</mat-label>
                          <input formControlName="GPacker" placeholder="Packer Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Labour Hrs</mat-label>
                          <input formControlName="GLabour" placeholder="Labour Hrs" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Graveling %</mat-label>
                          <input formControlName="GPercent" placeholder="Graveling %" matInput ng-virtual-keyboard [ng-virtual-keyboard-layout]="customLayout" />
                        </mat-form-field>    
                        <br>
                        <br><br><br>
                      <br><br>                  
                    </div>
                </form>
              </div>
          </ng-template>
        </kendo-tabstrip-tab>
      </kendo-tabstrip>
    </form>



      <kendo-dialog-actions>
          <button class="k-button" (click)="onCancel($event)">Cancel</button>
          <button class="k-button k-primary" [disabled]="!editForm.valid" (click)="onSave($event)">Save</button>
      </kendo-dialog-actions>
    </kendo-dialog>`
})
export class ProductionsGridEditFormComponent implements OnInit {
    active = false;
    editForm: FormGroup = this.fb.group({
      UProductionId:  [""],
      UserId:  [""],
      UBlockId:  [""],
      Block:  [""],
      Description:  [""],
      Division:  [""],
      StartDate:  [""],
      EndDate:  [""],
      Date:  [""],
      CDate:  [""],
      Type:  [""],
      Harvesting: this.fb.group({
        HBunchingH: [""],
        HBunchingP: [""],
        HSkiddingH: [""],
        HSkiddingP: [""],
        HDeckingH: [""],
        HDeckingP: [""],
        HProcessingH: [""],
        HProcessingP: [""],
        HLoadingH: [""],
        HLoadingP: [""]
      }),
      RoadConstruction: this.fb.group({
        RCat1Type: [""],
        RCat1: [""],
        RCat2Type: [""],
        RCat2: [""],
        RHoe1Type: [""],
        RHoe1: [""],
        RHoe2Type: [""],
        RHoe2: [""],
        RRockTruck: [""],
        RGrader: [""],
        RPacker: [""],
        RLabour: [""],
        RPercent: [""]
      }),
      Graveling: this.fb.group({
        GCat1Type: [""],
        GCat1: [""],
        GCat2Type: [""],
        GCat2: [""],
        GHoe1Type: [""],
        GHoe1: [""],
        GHoe2Type: [""],
        GHoe2: [""],
        GRockTruck: [""],
        GGrader: [""],
        GPacker: [""],
        GLabour: [""],
        GPercent: [""]
      }),
      TimeStamp: [""],
    });

    @Input() public isNew = false;

    @Input() public set model(production: Production) {
      console.log('production', production);
      this.editForm.reset(production);
      this.active = production !== undefined;
    }

    @Output() cancel: EventEmitter<any> = new EventEmitter();
    @Output() save: EventEmitter<Production> = new EventEmitter();

    constructor(private fb: FormBuilder) {}

    public customLayout = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['.', '0', 'Backspace'],
    ];
    public catTypeLayout = [
      ['D6:1.5', 'D7:1.5'],
      ['D8:1.5', '527:1.5'],
      ['Backspace:3'],
    ];
    public hoeTypeLayout = [
      ['320:1.5', '250:1.5'],
      ['290:1.5', '350:1.5'],
      ['Backspace:3'],
    ];

    ngOnInit(): void { 
      //this.formBuilderInit();
    }

    public onSave(e): void {
        e.preventDefault();
        this.save.emit(this.editForm.value);
        this.active = false;
    }

    public onCancel(e): void {
        e.preventDefault();
        this.closeForm();
    }

    public closeForm(): void {
        this.active = false;
        this.cancel.emit();
    }

    public onTabSelect(e) {
      console.log(e);
    }

    private formBuilderInit(): void {
      this.editForm = this.fb.group({
        UProductionId:  [""],
        UserId:  [""],
        UBlockId:  [""],
        Block:  [""],
        Description:  [""],
        Division:  [""],
        StartDate:  [""],
        EndDate:  [""],
        Date:  [""],
        CDate:  [""],
        Type:  [""],
        Harvesting: this.fb.group({
          HBunchingH: [""],
          HBunchingP: [""],
          HSkiddingH: [""],
          HSkiddingP: [""],
          HDeckingH: [""],
          HDeckingP: [""],
          HProcessingH: [""],
          HProcessingP: [""],
          HLoadingH: [""],
          HLoadingP: [""]
        }),
        RoadConstruction: this.fb.group({
          RCat1Type: [""],
          RCat1: [""],
          RCat2Type: [""],
          RCat2: [""],
          RHoe1Type: [""],
          RHoe1: [""],
          RHoe2Type: [""],
          RHoe2: [""],
          RRockTruck: [""],
          RGrader: [""],
          RPacker: [""],
          RLabour: [""],
          RPercent: [""]
        }),
        Graveling: this.fb.group({
          GCat1Type: [""],
          GCat1: [""],
          GCat2Type: [""],
          GCat2: [""],
          GHoe1Type: [""],
          GHoe1: [""],
          GHoe2Type: [""],
          GHoe2: [""],
          GRockTruck: [""],
          GGrader: [""],
          GPacker: [""],
          GLabour: [""],
          GPercent: [""]
        }),
        TimeStamp: [""],
      });
    }
}
