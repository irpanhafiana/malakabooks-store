import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeTransitionAnimations = trigger('routeAnimations', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 })
    ], { optional: true }),
    query(':leave', [
      style({ opacity: 1 })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        animate('200ms ease-out', style({ opacity: 1 }))
      ], { optional: true })
    ])
  ])
]);
