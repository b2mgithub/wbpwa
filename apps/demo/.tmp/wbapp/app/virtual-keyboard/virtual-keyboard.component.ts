import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { keyboardCapsLockLayout, KeyboardLayout } from './layouts';

@Component({
  selector: 'virtual-keyboard',
  template: `
    <div class="container">
      <div fxLayout="column">
        <mat-form-field>
          <button class="close" color="primary" mat-button mat-mini-fab
            (click)="close($event)"
          >
            <mat-icon>check</mat-icon>
          </button>
    
          <input type="{{type}}"
            matInput
            (focus)= "unfocus($event)"
            (click)= "unfocus($event)"
            #keyboardInput
            [(ngModel)]="inputElement.nativeElement.value" placeholder="{{ placeholder }}"
            [maxLength]="maxLength"
          />
        </mat-form-field>
    
        <div fxLayout="row" fxLayoutAlign="center center"
          *ngFor="let row of layout; let rowIndex = index"
          [attr.data-index]="rowIndex"
        >
          <virtual-keyboard-key
            *ngFor="let key of row; let keyIndex = index"
            [key]="key"
            [disabled]="disabled"
            [attr.data-index]="keyIndex"
            (keyPress)="keyPress($event)"
          ></virtual-keyboard-key>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .close {
      position: relative;
      float: right;
      top: -16px;
      right: 0;
      margin-bottom: -40px;
    }
  
    .mat-input-container {
      margin: -16px 0;
      font-size: 32px;
    }
  
    .mat-input-element:disabled {
      color: currentColor;
    }

    :host /deep/ .mat-input-placeholder {
      top: 10px !important;
      font-size: 24px !important;
    }
  `]
})

export class VirtualKeyboardComponent implements OnInit, OnDestroy {
  @ViewChild('keyboardInput') keyboardInput: ElementRef;

  public inputElement: ElementRef;
  public layout: KeyboardLayout;
  public placeholder: string;
  public type: string;
  public disabled: boolean;
  public maxLength: number|string;

  /**
   * Constructor of the class.
   *
   * @param {MatDialogRef<VirtualKeyboardComponent>} dialogRef
   * @param {VirtualKeyboardService}                 virtualKeyboardService
   */
  public constructor(
    public dialogRef: MatDialogRef<VirtualKeyboardComponent>
  ) { }

  /**
   * On init life cycle hook, this will do following:
   *  1) Set focus to virtual keyboard input field
   *  2) Subscribe to following
   *    2.1) Shift key, this is needed in keyboard event dispatches
   *    2.2) CapsLock key, this will change keyboard layout
   *    2.3) Caret position in virtual keyboard input
   *  3) Reset of possible previously tracked caret position
   */
  public ngOnInit(): void {
    this.maxLength = this.inputElement.nativeElement.maxLength > 0 ? this.inputElement.nativeElement.maxLength : '';

    this.checkDisabled();
  }

  /**
   * On destroy life cycle hook, in this we want to reset virtual keyboard service states on following:
   *  - Shift
   *  - CapsLock
   */
  public ngOnDestroy(): void {
 
  }

  /**
   * Method to close virtual keyboard dialog
   */
  public close(e : Event): void {
    let value = this.inputElement.nativeElement.value;
    
    // console.log('placeholder', this.placeholder);
    
    e.preventDefault();
    e.stopPropagation();

    // if (this.placeholder.includes('Type')) {
    //   console.log('placeholder includes type', this.placeholder);
    // }
    // else {
    //   console.log('placeholder not my type', this.placeholder);
    // }
    if (!isNaN(value) || this.placeholder.includes('Type')) {
      this.dialogRef.close();
    }
    else {
      alert('Please enter a number or decimal.');
    }
  }  

  public unfocus(e: any) {
    if (e.target) e.target.blur();
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Method to handle actual "key" press from virtual keyboard.
   *  1) Key is "Special", process special key event
   *  2) Key is "Normal"
   *    - Append this key value to input
   *    - Dispatch DOM events to input element
   *    - Toggle Shift key if it's pressed
   *
   * @param {KeyPressInterface} event
   */
  public keyPress(event: any): void {
    if (event.special) {
      this.handleSpecialKey(event);
    } else {
      this.handleNormalKey(event.keyValue);

      this.dispatchEvents(event);

    }

    this.checkDisabled();
  }

  /**
   * Method to check is virtual keyboard input is disabled.
   */
  private checkDisabled(): void {
    const maxLength = this.inputElement.nativeElement.maxLength;
    const valueLength = this.inputElement.nativeElement.value.length;

    this.disabled = maxLength > 0 && valueLength >= maxLength;
  }

  /**
   * Method to handle "normal" key press event, this will add specified character to input value.
   *
   * @param {string}  keyValue
   */
  private handleNormalKey(keyValue: string): void {
    let value = `${this.inputElement.nativeElement.value}${keyValue}`;

    // And finally set new value to input
    this.inputElement.nativeElement.value = value;
  }

  /**
   * Method to handle "Special" key press events.
   *  1) Enter
   *  2) Escape, close virtual keyboard
   *  3) Backspace, remove last character from input value
   *  4) CapsLock, toggle current layout state
   *  6) Shift, toggle current layout state
   *  5) SpaceBar
   */
  private handleSpecialKey(event: any): void {
    switch (event.keyValue) {
      case 'D6':
        console.log('D6');
        this.inputElement.nativeElement.value = "D6";
        this.dispatchEvents(event);
        break;
      case 'D7':
        console.log('D7');
        this.inputElement.nativeElement.value = "D7";
        this.dispatchEvents(event);
        break;
      case 'D8':
        console.log('D8');
        this.inputElement.nativeElement.value = "D8";
        this.dispatchEvents(event);
        break;
      case '527':
        console.log('527');
        this.inputElement.nativeElement.value = "527";
        this.dispatchEvents(event);
        break;
      case '320':
        console.log('320');
        this.inputElement.nativeElement.value = "320";
        this.dispatchEvents(event);
        break;
      case '250':
        console.log('250');
        this.inputElement.nativeElement.value = "250";
        this.dispatchEvents(event);
        break;
      case '290':
        console.log('290');
        this.inputElement.nativeElement.value = "290";
        this.dispatchEvents(event);
        break;
      case '350':
        console.log('350');
        this.inputElement.nativeElement.value = "350";
        this.dispatchEvents(event);
        break;
      case 'Enter':
        this.close(event);
        break;
      case 'Escape':
        this.close(event);
        break;
      case 'Backspace':
        const currentValue = this.inputElement.nativeElement.value;       
          this.inputElement.nativeElement.value = currentValue.substring(0, currentValue.length - 1);
          this.dispatchEvents(event);
        break;

    }
  }

  /**
   * Method to dispatch necessary keyboard events to current input element.
   *
   * @see https://w3c.github.io/uievents/tools/key-event-viewer.html
   *
   * @param {KeyPressInterface} event
   */
  private dispatchEvents(event: any) {
    const eventInit: any = {
      bubbles: true,
      cancelable: true,
      key: event.keyValue,
      code: `Key${event.keyValue.toUpperCase()}}`,
      location: 0
    };

    // Simulate all needed events on base element
    this.inputElement.nativeElement.dispatchEvent(new KeyboardEvent('keydown', eventInit));
    this.inputElement.nativeElement.dispatchEvent(new KeyboardEvent('keypress', eventInit));
    this.inputElement.nativeElement.dispatchEvent(new Event('input', {bubbles : true}));
    this.inputElement.nativeElement.dispatchEvent(new KeyboardEvent('keyup', eventInit));

  }  
}
