import { Component, input, computed, ChangeDetectionStrategy, signal, ElementRef, HostListener, inject, OnDestroy, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-select',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-select.component.html'
})
export class AdminSelectComponent implements OnDestroy {
  readonly control = input.required<FormControl>();
  readonly options = input.required<{ value: unknown; label: string }[]>();
  readonly id = input<string>('admin-select-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly customClass = input<string>('', { alias: 'class' });

  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly controlValue = signal<unknown>(null);

  private valueSub?: Subscription;

  constructor() {
    // Setup effect to sync subscription when control input changes
    effect(() => {
      const ctrl = this.control();
      this.valueSub?.unsubscribe();
      // takeUntilDestroyed() tanpa argumen hanya sah di injection context.
      // effect() bukan injection context, jadi DestroyRef diambil dari field di atas.
      this.valueSub = ctrl.valueChanges
        .pipe(startWith(ctrl.value), takeUntilDestroyed(this.destroyRef))
        .subscribe(val => {
          this.controlValue.set(val);
        });
    });
  }

  ngOnDestroy() {
    this.valueSub?.unsubscribe();
  }

  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const opts = this.options();
    if (!query) {
      return opts;
    }
    return opts.filter(opt => opt.label.toLowerCase().includes(query));
  });

  readonly selectedLabel = computed(() => {
    const val = this.controlValue();
    const opts = this.options();
    const match = opts.find(opt => opt.value === val);
    return match ? match.label : '';
  });

  readonly selectClass = computed(() => {
    const base = 'block w-full border rounded-xl py-2.5 pl-3 pr-9 text-sm focus:outline-none focus:ring-1 text-slate-800 bg-white appearance-none cursor-pointer';
    const isError = this.control().invalid && (this.control().dirty || this.control().touched);
    const border = isError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-300 focus:border-slate-500 focus:ring-slate-500';

    return `${base} ${border} ${this.customClass()}`;
  });

  toggleDropdown() {
    if (this.control().disabled) return;
    this.isOpen.update(o => !o);
    if (!this.isOpen()) {
      this.searchQuery.set('');
    }
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
  }

  selectOption(opt: { value: unknown; label: string }) {
    this.control().setValue(opt.value);
    this.control().markAsDirty();
    this.control().markAsTouched();
    this.control().updateValueAndValidity();
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.searchQuery.set('');
    }
  }
}

