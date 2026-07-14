import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default variant "primary" and size "md"', () => {
    expect(component.variant()).toBe('primary');
    expect(component.size()).toBe('md');
    
    const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    // Memeriksa keberadaan kelas dari varian primary
    expect(buttonElement.className).toContain('bg-primary-600');
    expect(buttonElement.className).toContain('px-4'); // size md
  });

  it('should update classes when inputs change via Signals (setInput)', () => {
    // Menggunakan setInput sesuai standar Angular Signals
    fixture.componentRef.setInput('variant', 'danger');
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();

    const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    
    expect(buttonElement.className).toContain('bg-rose-600'); // danger
    expect(buttonElement.className).toContain('px-5'); // lg
    expect(buttonElement.className).toContain('w-full'); // fullWidth
  });

  it('should display loading spinner when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const spinnerIcon = fixture.nativeElement.querySelector('.bx-loader-alt');

    expect(buttonElement.disabled).toBe(true);
    expect(spinnerIcon).toBeTruthy();
  });
});
