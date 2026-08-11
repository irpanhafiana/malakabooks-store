import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] && route.path && route.path !== 'admin') {
      // Stagger preload by 1s after route match so critical first-paint
      // resources get priority in the browser's network queue.
      return timer(1000).pipe(switchMap(() => load()));
    }
    return of(null);
  }
}

