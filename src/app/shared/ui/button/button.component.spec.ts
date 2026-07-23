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
    expect(buttonElement.className).toContain('bg-primary-600');
    expect(buttonElement.className).toContain('px-4');
  });

  it('should compute buttonClass with primary variant', () => {
    expect(component.buttonClass()).toContain('bg-primary-600');
  });
});
