import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { FormControl } from '@angular/forms';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;
  let control: FormControl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    
    // Setup required input 'control'
    control = new FormControl('');
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default type "text"', () => {
    expect(component.type()).toBe('text');
  });

  it('should update classes on error state', () => {
    const errorControl = new FormControl('', { validators: () => ({ required: true }) });
    errorControl.markAsTouched();
    fixture.componentRef.setInput('control', errorControl);
    fixture.detectChanges();

    const classString = component.inputClass();
    expect(classString).toContain('border-rose-300'); // Error styling
  });

  it('should apply padding if icon is present', () => {
    fixture.componentRef.setInput('icon', 'bx-user');
    fixture.detectChanges();

    const classString = component.inputClass();
    expect(classString).toContain('pl-10 pr-4');
  });
});
