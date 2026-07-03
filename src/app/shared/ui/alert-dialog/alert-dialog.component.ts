import { Component, input, model, inject, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.css'
})
export class AlertDialogComponent implements OnInit, OnDestroy {
  readonly isOpen = model<boolean>(false);
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly type = input<'success' | 'error' | 'info' | 'warning'>('success');

  private readonly el = inject(ElementRef);

  protected readonly iconMap: Record<string, string> = {
    'success': 'check',
    'error': 'x',
    'info': 'alert-circle',
    'warning': 'shield'
  };

  ngOnInit() {
    document.body.appendChild(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.el.nativeElement.remove();
  }

  close() {
    this.isOpen.set(false);
  }
}
