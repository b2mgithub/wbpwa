import { Component, computed, effect, input, output, ViewChild, ElementRef, ViewEncapsulation, inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KENDO_DIALOG } from '@progress/kendo-angular-dialog';
import { FloatingLabelModule } from '@progress/kendo-angular-label';
import { TextBoxModule, FormFieldModule } from '@progress/kendo-angular-inputs';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { SVGIcon, checkIcon } from '@progress/kendo-svg-icons';
import { KeyboardStore, KeyboardButton, KeyboardConfig } from './keyboard.store';

@Component({
  selector: 'lib-keyboard',
  standalone: true,
  providers: [KeyboardStore], // Component-level, not singleton
  imports: [
    CommonModule,
    KENDO_DIALOG,
    FloatingLabelModule,
    FormFieldModule,
    TextBoxModule,
    KENDO_BUTTONS,
    KENDO_ICONS,
    ReactiveFormsModule,
  ],
  templateUrl: './keyboard.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class KeyboardComponent {
    keyboardForm = new FormGroup({
      inputValue: new FormControl(''),
    });

    get inputControl() {
      return this.keyboardForm.get('inputValue') as FormControl;
    }
  @ViewChild('keyboardInput') keyboardInput?: ElementRef;

  // Modern signal-based inputs
  readonly isOpen = input.required<boolean>();
  readonly config = input.required<KeyboardConfig>();

  // Modern signal-based outputs
  readonly valueChange = output<string>();
  readonly closeKeyboard = output<void>();

  protected readonly store = inject(KeyboardStore);
  protected readonly checkIcon: SVGIcon = checkIcon;
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  private hasClickedButton = false;

  constructor() {
    // ...existing code...
    // Initialize store when keyboard opens
    effect(() => {
      if (this.isOpen()) {
        const cfg = this.config();
        this.store.init(cfg);
        this.hasClickedButton = false;
        this.inputControl.setValue(cfg.initialValue || '', { emitEvent: false });
        this.inputControl.markAsDirty();
        this.inputControl.markAsTouched();
        // Focus and select text after a delay
        setTimeout(() => {
          const input = this.keyboardInput?.nativeElement?.querySelector('input');
          if (input) {
            input.focus();
            if (cfg.initialValue) {
              input.select();
            }
          }
        }, 200);
      } else {
        // Reset store when closed
        this.store.reset();
        this.inputControl.setValue('', { emitEvent: false });
        this.inputControl.markAsDirty();
        this.inputControl.markAsTouched();
      }
    });
    // Sync form control changes to store
    this.inputControl.valueChanges.subscribe((val: string | null) => {
      this.store.setValue(val ?? '');
    });
  }

  protected readonly numericButtons: KeyboardButton[] = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '.', value: '.', cssClass: 'decimal-btn' },
    { label: '0', value: '0' },
    { label: '⌫', value: 'backspace', cssClass: 'backspace-btn' },
  ];

  protected readonly buttons = computed(() => {
    const config = this.store.config();
    if (!config) return [];

    switch (config.type) {
      case 'numeric':
        return this.numericButtons;
      case 'alphanumeric':
      case 'custom': {
        let btns: KeyboardButton[] = [];
        if (config.simpleButtons) {
          btns = config.simpleButtons.map((value: string) => ({
            label: value,
            value,
            cssClass: ''
          }));
        } else if (config.customButtons) {
          btns = config.customButtons;
        }
        // Always add a big delete key at the end for custom/alphanumeric
        btns.push({ label: '⌫', value: 'backspace', cssClass: 'backspace-btn' });
        return btns;
      }
      default:
        return [];
    }
  });

  protected onButtonClick(button: KeyboardButton): void {
    if (button.value === 'backspace') {
      const config = this.store.config();
      if (config?.type === 'custom') {
        // For custom keyboards (cat/hoe), clear the field and select all, and emit value
        this.inputControl.setValue('');
        this.inputControl.markAsDirty();
        this.inputControl.markAsTouched();
        setTimeout(() => {
          const input = this.keyboardInput?.nativeElement?.querySelector('input');
          if (input) {
            input.focus();
            input.select();
          }
        }, 0);
        this.valueChange.emit('');
      } else {
        // Numeric: remove last character
        const current = this.inputControl.value || '';
        this.inputControl.setValue(current.slice(0, -1));
        this.inputControl.markAsDirty();
        this.inputControl.markAsTouched();
      }
      this.hasClickedButton = true;
      return;
    }

    const config = this.store.config();

    if (config?.type === 'numeric') {
      // Numeric: first click replaces, subsequent clicks append
      if (!this.hasClickedButton) {
        this.inputControl.setValue(button.value);
        this.inputControl.markAsDirty();
        this.inputControl.markAsTouched();
        this.hasClickedButton = true;
      } else {
        this.inputControl.setValue((this.inputControl.value || '') + button.value);
        this.inputControl.markAsDirty();
        this.inputControl.markAsTouched();
      }
    } else {
      // Equipment selection: always replace
      this.inputControl.setValue(button.value);
      this.inputControl.markAsDirty();
      this.inputControl.markAsTouched();
    }
  }

  protected onConfirm(): void {
    this.valueChange.emit(this.store.value());
    this.closeKeyboard.emit();
  }

  protected onClose(): void {
    this.closeKeyboard.emit();
  }

  protected onKeydown(_event: KeyboardEvent): void {
    // Allow normal typing
  }

  protected onInputChange(_event: Event): void {
    // Allow normal input
  }
}