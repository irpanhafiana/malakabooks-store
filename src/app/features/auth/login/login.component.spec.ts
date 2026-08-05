import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';

import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const mockRouter = {
    navigate: vi.fn()
  };

  const mockActivatedRoute = {
    snapshot: {
      queryParamMap: {
        get: vi.fn()
      }
    }
  };

  const mockAuthStore = {
    login: vi.fn(),
    isAdmin: vi.fn().mockReturnValue(false)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form on init', () => {
    expect(component.loginForm.invalid).toBe(true);
  });

  it('should fill demo credentials', () => {
    component.fillDemoCredentials();
    expect(component.usernameControl.value).toBe('customer@ssonlineshop.local');
    expect(component.passwordControl.value).toBe('ChangeMe123!');
    expect(component.loginForm.valid).toBe(true);
  });

  it('should call authStore.login when form is valid and submitted', async () => {
    component.fillDemoCredentials();
    mockAuthStore.login.mockResolvedValue(true);

    await component.onSubmit();

    expect(mockAuthStore.login).toHaveBeenCalledWith('customer@ssonlineshop.local', 'ChangeMe123!');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });
});
