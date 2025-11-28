import { Component, inject } from '@angular/core';
import { ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule } from '@progress/kendo-angular-label';
import { KeyboardComponent, KeyboardFormService } from '@wbpwa/keyboard';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-keyboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonsModule,
    InputsModule,
    FloatingLabelModule,
    KeyboardComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './test-keyboard.component.html'
})
export class TestKeyboardComponent {
    private firstKeyPress = false;
  @ViewChildren('readonlyInput', { read: ElementRef }) readonlyInputs!: QueryList<ElementRef<HTMLInputElement>>;
  
  form: FormGroup;
  fb = inject(FormBuilder);
  cdr = inject(ChangeDetectorRef);
  keyboardForm = inject(KeyboardFormService);

  constructor() {
    this.form = this.fb.group({
      bunchingHrs: ['12.5'],
      skiddingHrs: [''],
      deckingHrs: ['8.75'],
      cat1Type: ['D7'],
      hoe1Type: ['320'],
      cat2Type: ['527'],
      hoe2Type: [''],
    });
    this.keyboardForm.setForm(this.form);
  }

  get keyboardOpen() { return this.keyboardForm.keyboardOpen; }
  get keyboardConfig() { return this.keyboardForm.keyboardConfig; }

  openNumeric(field: string, title: string, allowDecimal: boolean) {
    this.keyboardForm.openNumeric(field, title, allowDecimal);
  }

  openEquipment(field: string, title: string, options: string[]) {
    this.keyboardForm.openEquipment(field, title, options);
  }

  onValueChange(value: string) {
    this.keyboardForm.handleValueChange(value, this.cdr);
  }

  onKeyboardClose() {
    this.keyboardForm.handleKeyboardClose();
  }

  submitForm() {
    console.log('Form submitted:', this.form.value);
  }

  cancelForm() {
    console.log('Form cancelled');
  }
}
