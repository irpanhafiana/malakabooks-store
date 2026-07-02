import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { routeTransitionAnimations } from './core/animations/route.animations';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [routeTransitionAnimations]
})
export class App {
  protected readonly title = signal('malakabooks');
  private router = inject(Router);

  getRouteAnimationData() {
    return this.router.url;
  }
}
