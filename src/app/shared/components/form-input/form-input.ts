import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ]
})
export class FormInputComponent implements ControlValueAccessor {
  @Input({ required: true }) id!: string;
  @Input() label = '';
  @Input() type: 'text' | 'password' | 'email' | 'number' | 'tel' | 'textarea' | 'select' = 'text';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() rows = 3;
  @Input() options: { label: string; value: any }[] = [];
  @Input() error = '';

  value: any = '';
  disabled = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onModelChange(val: any) {
    this.value = val;
    this.onChange(val);
    this.onTouched();
  }
}
