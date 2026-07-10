import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-customer-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-alert.component.html',
  styleUrl: './customer-alert.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('250ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('fadeScale', [
      transition(':enter', [
        animate('350ms cubic-bezier(0.34, 1.56, 0.64, 1)', keyframes([
          style({ opacity: 0, transform: 'scale(0.7)', offset: 0 }),
          style({ opacity: 0.7, transform: 'scale(1.05)', offset: 0.7 }),
          style({ opacity: 1, transform: 'scale(1)', offset: 1 })
        ]))
      ]),
      transition(':leave', [
        animate('250ms ease-in', keyframes([
          style({ opacity: 1, transform: 'scale(1)', offset: 0 }),
          style({ opacity: 0.5, transform: 'scale(1.03)', offset: 0.3 }),
          style({ opacity: 0, transform: 'scale(0.7)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class CustomerAlertComponent {
  protected readonly alertService = inject(AlertService);
}
