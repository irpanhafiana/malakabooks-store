import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';

/**
 * Custom preloading strategy that only preloads routes marked with
 * `data: { preload: true }`. Routes without this flag (e.g. the entire
 * `/admin` subtree) are skipped, saving bandwidth for guest visitors.
 *
 * Previously `PreloadAllModules` eagerly downloaded every lazy chunk
 * (including the 50+ kB admin dashboard) after first paint — even for
 * customer-only sessions.
 *
 * Usage in route config:
 *   { path: 'checkout', ..., data: { preload: true } }
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] && route.path && route.path !== 'admin') {
      // Stagger preload by 1s after route match so critical first-paint
      // resources get priority in the browser's network queue.
      return timer(1000).pipe(() => load());
    }
    return of(null);
  }
}
