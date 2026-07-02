import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AnimationStateService {
  direction: 'forward' | 'backward' | 'fade' = 'forward';
  private requestedFade = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (event.navigationTrigger === 'popstate') {
          this.direction = 'backward';
          this.requestedFade = false;
        } else {
          this.direction = this.requestedFade ? 'fade' : 'forward';
          this.requestedFade = false;
        }
      }
    });
  }

  setNextAnimationFade() {
    this.requestedFade = true;
  }
}
