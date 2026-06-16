import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-inner-page-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './inner-page-layout.component.html',
  styleUrl: './inner-page-layout.component.css'
})
export class InnerPageLayoutComponent {
  @ViewChild('routeContainer') routeContainer!: ElementRef;

  onRouteActivate() {
    if (this.routeContainer) {
      const el = this.routeContainer.nativeElement;
      el.classList.remove('animate-page-fade');
      // Trigger reflow to restart CSS animation
      void el.offsetWidth;
      el.classList.add('animate-page-fade');
    }
  }
  protected readonly toastService = inject(ToastService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  pageTitle = signal<string>('');

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      this.pageTitle.set(data['title'] || '');
    });
  }

  goBack() {
    // If the history state has a navigation id > 1, we can go back.
    // Otherwise, navigate to home as fallback.
    const state = this.location.getState() as { navigationId?: number };
    if (state && state.navigationId && state.navigationId > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  toastClass(type: string): string {
    const borderType = {
      success: 'border-l-4 border-l-emerald-500',
      error: 'border-l-4 border-l-rose-500',
      info: 'border-l-4 border-l-blue-500',
      warning: 'border-l-4 border-l-amber-500'
    };
    return borderType[type as keyof typeof borderType] || 'border-l-4 border-l-blue-500';
  }
}
