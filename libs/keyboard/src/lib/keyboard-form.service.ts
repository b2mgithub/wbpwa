import { inject, Injectable } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';
import { KeyboardConfig } from './keyboard.store';
import { KeyboardUtilService } from './keyboard-util.service';

@Injectable({ providedIn: 'root' })
export class KeyboardFormService {
  private readonly util = inject(KeyboardUtilService);

  form: FormGroup | null = null;
  keyboardOpen = false;
  keyboardConfig: KeyboardConfig = { type: 'numeric', title: '', initialValue: '' };
  currentField: string | null = null;
  firstKeyPress = false;

  /**
   * Resolve a control by dot notation path (e.g., 'Harvesting.HBunchingH')
   */
  private getControl(path: string): AbstractControl | null {
    if (!this.form) return null;
    if (!path.includes('.')) return this.form.get(path);
    const segments = path.split('.');
    let ctrl: AbstractControl | null = this.form;
    for (const seg of segments) {
      if (!ctrl) return null;
      if ((ctrl as FormGroup).get) {
        ctrl = (ctrl as FormGroup).get(seg);
      } else {
        return null;
      }
    }
    return ctrl;
  }

  setForm(form: FormGroup) {
    this.form = form;
  }

  openNumeric(field: string, title: string, allowDecimal: boolean) {
    if (!this.form) return;
    this.currentField = field;
    this.firstKeyPress = false;
    const ctrl = this.getControl(field);
    this.keyboardConfig = this.util.getNumericConfig(
      field,
      title,
      ctrl?.value ?? '',
      allowDecimal
    );
    this.keyboardOpen = true;
    setTimeout(() => {
      if (ctrl && !ctrl.value) {
        this.firstKeyPress = true;
        const allInputs = Array.from(document.querySelectorAll('input[readonly]')) as HTMLInputElement[];
        const match = allInputs.find(input => input.getAttribute('formcontrolname') === field.split('.').pop());
        if (match) {
          match.focus();
          match.dispatchEvent(new Event('focus', { bubbles: true }));
        }
      } else {
        this.firstKeyPress = false;
      }
    }, 50);
  }

  openEquipment(field: string, title: string, options: string[]) {
    if (!this.form) return;
    this.currentField = field;
    const ctrl = this.getControl(field);
    this.keyboardConfig = this.util.getEquipmentConfig(
      field,
      title,
      ctrl?.value ?? '',
      options
    );
    this.keyboardOpen = true;
  }

  handleValueChange(value: string, cdr?: { detectChanges: () => void }) {
    if (!this.form) return;
    const field = this.currentField;
    if (field) {
      const ctrl = this.getControl(field);
      const emptyValue = value ?? '';
      ctrl?.setValue(emptyValue);
      if (emptyValue === '') {
        ctrl?.markAsPristine();
        ctrl?.markAsUntouched();
      } else {
        ctrl?.markAsDirty();
        ctrl?.markAsTouched();
      }
      cdr?.detectChanges();
      setTimeout(() => {
        const allInputs = Array.from(document.querySelectorAll('input[readonly]')) as HTMLInputElement[];
        const match = allInputs.find(input => input.getAttribute('formcontrolname') === field.split('.').pop());
        if (match) {
          if (this.firstKeyPress && emptyValue) {
            match.focus();
            match.dispatchEvent(new Event('focus', { bubbles: true }));
            this.firstKeyPress = false;
          }
          match.value = emptyValue;
          match.dispatchEvent(new Event('input', { bubbles: true }));
          match.dispatchEvent(new Event('change', { bubbles: true }));
          if (emptyValue === '') {
            match.blur();
            setTimeout(() => {
              match.dispatchEvent(new Event('focusout', { bubbles: true }));
              if (!match.value && document.activeElement !== match) {
                const container = match.closest('.k-floating-label-container');
                if (container) {
                  container.classList.remove('k-label-floating');
                  container.classList.remove('k-floating-label-container-focused');
                }
              }
            }, 10);
          }
        } else {
          allInputs.forEach(input => {
            input.blur();
            setTimeout(() => {
              input.dispatchEvent(new Event('focusout', { bubbles: true }));
              if (!input.value && document.activeElement !== input) {
                const container = input.closest('.k-floating-label-container');
                if (container) {
                  container.classList.remove('k-label-floating');
                  container.classList.remove('k-floating-label-container-focused');
                }
              }
            }, 10);
          });
        }
      }, 50);
    }
  }

  handleKeyboardClose() {
    this.keyboardOpen = false;
    setTimeout(() => {
      const allInputs = Array.from(document.querySelectorAll('input[readonly]')) as HTMLInputElement[];
      allInputs.forEach(input => input.blur());
    }, 50);
    this.currentField = null;
  }
}
