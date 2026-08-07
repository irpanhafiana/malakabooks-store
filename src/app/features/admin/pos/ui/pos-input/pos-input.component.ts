import { Component, forwardRef, input, signal, output, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Input POS. API identik dengan `app-input` sj-pos (termasuk alias output
 * `focus`/`blur` yang dipakai sub-komponen untuk delayed-blur dropdown).
 * Warna fokus mengikuti tema malakabooks.
 */
@Component({
  selector: 'app-pos-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PosInputComponent),
      multi: true
    }
  ]
})
export class PosInputComponent implements ControlValueAccessor {
  label = input<string>('');
  type = input<'text' | 'password' | 'number' | 'email' | 'date'>('text');
  placeholder = input<string>('');
  icon = input<string>('');
  inputId = input<string>('');
  required = input<boolean>(false);
  disabledInput = input<boolean>(false);
  size = input<'sm' | 'md'>('md');
  customClass = input<string>('');
  iconClass = input<string>('text-slate-400 text-xl');

  inputClasses = computed(() => {
    const sizeCls = this.size() === 'sm'
      ? 'px-3 py-2 text-xs rounded-lg'
      : 'px-4 py-2.5 text-sm rounded-xl';

    const baseCls = 'appearance-none relative block w-full font-normal focus:outline-none transition-all border-2 z-0 disabled:opacity-50 disabled:cursor-not-allowed';

    const themeCls = this.customClass()
      ? this.customClass()
      : 'border-slate-200 bg-slate-50 placeholder-slate-400 text-slate-900 focus:border-primary-600 focus:bg-white';

    const paddingLeftCls = this.icon()
      ? (this.size() === 'sm' ? 'pl-9' : 'pl-12')
      : '';

    const paddingRightCls = this.type() === 'password'
      ? (this.size() === 'sm' ? 'pr-9' : 'pr-12')
      : '';

    return `${baseCls} ${sizeCls} ${themeCls} ${paddingLeftCls} ${paddingRightCls}`.trim();
  });

  focusEvent = output<FocusEvent>({ alias: 'focus' });
  blurEvent = output<FocusEvent>({ alias: 'blur' });

  value = signal<any>('');
  isDisabled = signal<boolean>(false);
  isPasswordVisible = signal<boolean>(false);

  onChange: any = () => { };
  onTouched: any = () => { };

  writeValue(value: any): void {
    this.value.set(value !== undefined && value !== null ? value : '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
    this.onTouched();
  }

  onFocus(event: FocusEvent): void {
    this.focusEvent.emit(event);
  }

  onBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurEvent.emit(event);
  }

  togglePasswordVisibility(): void {
    if (this.type() === 'password' && !this.isDisabled() && !this.disabledInput()) {
      this.isPasswordVisible.set(!this.isPasswordVisible());
    }
  }
}
