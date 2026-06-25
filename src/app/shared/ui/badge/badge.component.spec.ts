import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default secondary variant and md size', () => {
    expect(component.variant()).toBe('secondary');
    expect(component.size()).toBe('md');
    expect(component.badgeClass()).toContain('bg-slate-100');
    expect(component.badgeClass()).toContain('text-xs');
  });

  it('should update classes when variant changes', () => {
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();

    expect(component.badgeClass()).toContain('bg-rose-50');
    expect(component.badgeClass()).toContain('text-rose-700');
  });

  it('should update classes when size changes', () => {
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    expect(component.badgeClass()).toContain('text-[10px]');
  });
});
