import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { SelectivePreloadingStrategy } from './core/strategies/selective-preloading-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    // Only preload routes marked with data: { preload: true } in app.routes.ts.
    // Admin chunks (dashboard, products, orders, ...) are excluded — they are
    // loaded on-demand only when the user navigates to /admin/*.
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
    provideAnimationsAsync()
  ]
};

