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
  });

  it('should compute badgeClass with default variant and size', () => {
    expect(component.badgeClass()).toContain('bg-slate-100');
    expect(component.badgeClass()).toContain('text-xs');
  });
});
