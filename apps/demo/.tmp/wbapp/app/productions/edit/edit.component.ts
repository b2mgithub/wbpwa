import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { FormGroup, FormBuilder } from '@angular/forms';
import { Production } from '../store/productions.model';

@Component({
  selector: "wbapp-edit-component",
  templateUrl: "./edit.component.html"
})
export class EditComponent implements OnInit {
  editForm: FormGroup;
  updateDisabled = false;
  backDisabled = false;

  @Input() selectedProduction: Production;
  @Input() placeHolders: any;
  @Input() userId: string | number;

  @Output() handleSubmit = new EventEmitter<Production>();
  @Output() handleBack = new EventEmitter<void>();

  public customLayout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'Backspace'],
  ];
  public catTypeLayout = [
    ['527:1.5', 'D6:1.5'],
    ['D7:1.5', 'D8:1.5'],
    ['Backspace:3'],
  ];
  public hoeTypeLayout = [
    ['320:1.5', '250:1.5'],
    ['290:1.5', '350:1.5'],
    ['Backspace:3'],
  ];
  
  constructor(
    private fb: FormBuilder,
  ){}

  ngOnInit() {
    this.formBuilderInit();
    this.editForm.patchValue(this.selectedProduction);
    console.log("this.userId", this.userId);
  }

  onSubmit() {
    this.updateDisabled = true;
    this.backDisabled = true;
    this.handleSubmit.emit(this.editForm.value);
  }

  back() {
    this.updateDisabled = true;
    this.backDisabled = true;
    this.handleBack.emit();
  }
  
  public onTabSelect(e) {
    console.log(e);
  }

  private formBuilderInit(): void {
    this.editForm = this.fb.group({
      UProductionId: [""],      
      UserId:  [this.userId],
      UBlockId:  [""],
      Block:  [""],
      Description:  [""],
      Division:  [""],
      StartDate:  [""],
      EndDate:  [""],
      Date:  [""],
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
