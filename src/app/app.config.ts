import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { posAuthInterceptor } from './core/interceptors/pos-auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { SelectivePreloadingStrategy } from './core/strategies/selective-preloading-strategy';

import { GlobalErrorHandler } from './core/errors/global-error-handler';
import { ErrorHandler } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // Only preload routes marked with data: { preload: true } in app.routes.ts.
    // Admin chunks (dashboard, products, orders, ...) are excluded — they are
    // loaded on-demand only when the user navigates to /admin/*.
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    // errorInterceptor terluar: catchError-nya berjalan setelah authInterceptor
    // menangani 401, sehingga hanya menampilkan toast untuk error yang tersisa.
    // posAuthInterceptor terpisah dari authInterceptor: gateway POS (SAP) punya
    // token & alur 401 sendiri. Keduanya saling melewatkan lewat isPosApiUrl().
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor, posAuthInterceptor, authInterceptor, loadingInterceptor])
    ),
    provideAnimationsAsync()
  ]
};

