import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be hoverable by default', () => {
    expect(component.hoverable()).toBe(false);
    expect(component.cardClass()).not.toContain('hover:-translate-y-0.5');
  });

  it('should add hover classes when hoverable is true', () => {
    fixture.componentRef.setInput('hoverable', true);
    fixture.detectChanges();

    expect(component.cardClass()).toContain('hover:-translate-y-0.5');
  });

  it('should append custom class', () => {
    fixture.componentRef.setInput('class', 'my-custom-class');
    fixture.detectChanges();

    expect(component.cardClass()).toContain('my-custom-class');
  });
});
