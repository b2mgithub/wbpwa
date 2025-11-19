# Angular Forms Guide - Kendo UI with Reactive Forms

**Last Updated**: Angular 21.0.0-rc.1  
**Pattern**: Reactive Forms (Current Best Practice)  
**UI Library**: Kendo Angular

## Why Reactive Forms (Not Signal Forms Yet)

- **Signal Forms are experimental** in Angular 21 and lack third-party library support
- **Kendo UI components** are designed for Reactive Forms with `formControlName`
- **Floating labels work perfectly** with Reactive Forms out of the box
- **Production-proven** and stable across all Angular versions
- **Will migrate to Signal Forms** when they stabilize and Kendo adds support (likely Angular 22-23)

---

## Core Form Pattern

### 1. Component Setup

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { FormFieldModule } from '@progress/kendo-angular-inputs';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule } from '@progress/kendo-angular-label';
import { KENDO_LABEL } from '@progress/kendo-angular-label';

@Component({
  selector: 'app-example-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,  // CRITICAL: Must import this
    KENDO_BUTTONS,
    KENDO_INPUTS,
    KENDO_LABEL,
    FloatingLabelModule,
    FormFieldModule
  ],
  template: `...`
})
export class ExampleForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(ExampleStore);

  itemId: string | null = null;
  isCreateMode = true;

  // Define form with explicit typing
  // Note: Skip validators initially - add them later when forms are stable
  public form = new FormGroup<{
    name: FormControl<string>;
    description: FormControl<string>;
    amount: FormControl<number>;
  }>({
    name: new FormControl<string>('', { nonNullable: true }),
    description: new FormControl<string>('', { nonNullable: true }),
    amount: new FormControl<number>(0, { nonNullable: true })
  });

  ngOnInit(): void {
    // Load existing data if editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isCreateMode = false;
      this.itemId = id;
      const item = this.store.entities().find(i => i.id === id);
      if (item) {
        // Use patchValue to populate form
        this.form.patchValue({
          name: item.Name,
          description: item.Description,
          amount: item.Amount
        });
        this.form.markAsPristine();
      } else {
        this.router.navigate(['/items']);
      }
    }
  }

  async save(): Promise<void> {
    // Simple validation - check the values you actually care about
    if (!this.form.value.name || this.form.value.amount <= 0) {
      console.warn('Please fill required fields');
      return;
    }

    // Get typed form values
    const formValue = this.form.getRawValue();

    if (this.isCreateMode) {
      // Create logic
    } else {
      // Update logic
    }

    this.router.navigate(['/items']);
  }

  cancel(): void {
    this.router.navigate(['/items']);
  }
}
```

---

## Template Patterns

### Basic Text Input with Floating Label

```html
<kendo-formfield>
  <kendo-floatinglabel class="outline" text="Name">
    <kendo-textbox
      formControlName="name"
      fillMode="outline"
      required
    ></kendo-textbox>
  </kendo-floatinglabel>
</kendo-formfield>
```

### Numeric Input

```html
<kendo-formfield>
  <kendo-floatinglabel class="outline" text="Amount">
    <kendo-numerictextbox
      formControlName="amount"
      fillMode="outline"
      [min]="0"
      [decimals]="2"
      [format]="'c'"
      required
    ></kendo-numerictextbox>
  </kendo-floatinglabel>
</kendo-formfield>
```

### Date Picker (Special Handling)

```typescript
// Component
public get dateValue(): Date | null {
  const val = this.form.controls.date.value;
  return val ? new Date(val) : null;
}

public onDateChange(date: Date | null): void {
  this.form.controls.date.setValue(date ? date.toISOString() : '');
  this.form.controls.date.markAsDirty();
}
```

```html
<!-- Template -->
<div class="date-field">
  <label class="k-label outline">Date</label>
  <kendo-datepicker
    [value]="dateValue"
    (valueChange)="onDateChange($event)"
    style="width: 100%;"
  ></kendo-datepicker>
</div>
```

### Dropdown

```html
<kendo-formfield>
  <kendo-floatinglabel class="outline" text="Category">
    <kendo-dropdownlist
      formControlName="category"
      [data]="categories"
      textField="name"
      valueField="id"
      fillMode="outline"
    ></kendo-dropdownlist>
  </kendo-floatinglabel>
</kendo-formfield>
```

### Complete Form Template

```html
<div class="outline-form">
  <form [formGroup]="form" (ngSubmit)="save()" autocomplete="off">
    <div class="outline-div">
      <kendo-formfield>
        <kendo-floatinglabel class="outline" text="Name">
          <kendo-textbox
            formControlName="name"
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
        <kendo-floatinglabel class="outline" text="Amount">
          <kendo-numerictextbox
            formControlName="amount"
            fillMode="outline"
            [min]="0"
            [decimals]="2"
            [format]="'c'"
            required
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
```

---

## Critical Rules

### ✅ DO

- **Always use `formControlName`** - never `[value]` and `(valueChange)` with signals
- **Always import `ReactiveFormsModule`** in standalone components
- **Use explicit type definitions** for FormGroup (e.g., `FormGroup<{ name: FormControl<string> }>`)
- **Use `nonNullable: true`** in FormControl config to avoid null handling
- **Declare ID fields before the form** for logical ordering
- **Make form public** if accessing from template helpers
- **Use `form.patchValue()`** to populate forms when editing
- **Use `form.getRawValue()`** to get form data (includes disabled fields)
- **Mark form as pristine** after loading data: `this.form.markAsPristine()`
- **Validate manually in save()** - check the actual values you care about
- **Skip validators initially** - add them later when forms are stable and working

### ❌ DON'T

- **Never mix signals with Kendo inputs** using `[value]`/`(valueChange)` - floating labels will break
- **Never use `detectChanges()` hacks** - if you need this, you're doing it wrong
- **Never use `setTimeout()` to fix form issues** - switch to `formControlName` instead
- **Don't use `viewChild` to access Kendo inputs** - let reactive forms handle it
- **Don't manually sync signals to form values** - creates maintenance nightmare
- **Don't add validators early** - they're a distraction when building forms, add them later

---

## Form Validation (Optional - Add Later)

> **Note**: Skip validators when initially building forms. They're a distraction at the early stage. Get the form working first, then add validation logic later.

### Manual Validation (Recommended for Early Development)

```typescript
async save(): Promise<void> {
  // Simple, clear validation - check what you actually need
  const formValue = this.form.getRawValue();
  
  if (!formValue.name) {
    console.warn('Name is required');
    return;
  }
  
  if (formValue.amount <= 0) {
    console.warn('Amount must be greater than 0');
    return;
  }

  // Continue with save logic...
}
```

### Built-in Validators (Add When Forms Are Stable)

```typescript
public form = new FormGroup<{
  email: FormControl<string>;
  age: FormControl<number>;
  username: FormControl<string>;
}>({
  email: new FormControl<string>('', { 
    nonNullable: true,
    validators: [Validators.required, Validators.email]
  }),
  age: new FormControl<number>(0, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(18), Validators.max(120)]
  }),
  username: new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)]
  })
});
```

```typescript
async save(): Promise<void> {
  if (!this.form.valid) {
    console.warn('Form is invalid');
    return;
  }
  // Continue with save logic...
}
```

### Display Validation Errors

```html
<kendo-formfield>
  <kendo-floatinglabel class="outline" text="Email">
    <kendo-textbox
      formControlName="email"
      fillMode="outline"
      required
    ></kendo-textbox>
  </kendo-floatinglabel>
  <kendo-formerror *ngIf="form.controls.email.invalid && form.controls.email.touched">
    Email is required
  </kendo-formerror>
</kendo-formfield>
```

---

## Common Patterns

### Create vs Edit Mode

```typescript
ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');
  
  if (id === 'new') {
    this.isCreateMode = true;
    // Set defaults if needed
    this.form.controls.date.setValue(new Date().toISOString());
  } else {
    this.isCreateMode = false;
    this.itemId = id;
    const item = this.store.entities().find(i => i.id === id);
    
    if (item) {
      this.form.patchValue(item);
      this.form.markAsPristine();
    } else {
      this.router.navigate(['/items']);
    }
  }
}
```

### Save Handler

```typescript
async save(): Promise<void> {
  // Simple validation - check what matters
  const formValue = this.form.getRawValue();
  
  if (!formValue.name) {
    console.warn('Name is required');
    return;
  }

  // Update timestamp
  this.form.controls.timestamp.setValue(new Date().toISOString());

  if (this.isCreateMode) {
    const newId = generateGuid();
    const newItem = {
      ...formValue,
      id: newId,
      ItemId: newId
    };
    await this.store.create(newItem);
  } else {
    const updatedItem = {
      ...formValue,
      id: this.itemId,
      ItemId: this.itemId
    };
    await this.store.update(updatedItem);
  }

  this.router.navigate(['/items']);
}
```

### Readonly Fields with Custom Keyboard

```html
<kendo-formfield>
  <kendo-floatinglabel class="outline" text="Amount">
    <kendo-textbox
      formControlName="amount"
      fillMode="outline"
      [readonly]="true"
      (click)="openNumericKeyboard('amount', 'Amount')"
    ></kendo-textbox>
  </kendo-floatinglabel>
</kendo-formfield>
```

```typescript
constructor() {
  this.keyboardForm.setForm(this.form);
}

openNumericKeyboard(field: string, title: string): void {
  this.keyboardForm.openNumeric(field, title, true);
}
```

---

## Styling (Material Outline Style)

Your custom CSS should handle the Material outline appearance:

```scss
.outline-form {
  padding: 20px;
}

.outline-div {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

kendo-floatinglabel.outline {
  // Your Material outline styles
}
```

---

## Troubleshooting

### Problem: Floating labels don't animate when editing
**Solution**: Use `formControlName`, not `[value]`/`(valueChange)` with signals

### Problem: Form values not updating
**Solution**: Ensure `ReactiveFormsModule` is imported

### Problem: Type errors on form.getRawValue()
**Solution**: Explicitly type your FormGroup or use type assertions

### Problem: Disabled fields not included in save
**Solution**: Use `form.getRawValue()` instead of `form.value`

---

## Migration Path

When Signal Forms stabilize and Kendo adds support:

1. Wait for Kendo to officially support `[field]` directive
2. Test in a non-critical form first
3. Migrate one form at a time
4. Keep reactive forms as fallback for complex scenarios

## My Additions
All forms should have a title header like
<h2>{{ isCreateMode ? 'Create Production' : 'Update Production' }}</h2>



**Current Status**: Reactive Forms are the production-ready solution. Signal Forms are experimental.