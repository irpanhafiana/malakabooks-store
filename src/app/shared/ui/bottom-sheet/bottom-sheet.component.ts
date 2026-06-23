import { Component, input, output, effect, signal, ChangeDetectionStrategy, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bottom-sheet',
  standalone: true,
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.css'
})
export class BottomSheetComponent implements OnDestroy {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  readonly fullHeight = input<boolean>(false);
  
  readonly closed = output<void>();

  renderComponent = signal<boolean>(false);
  isAnimating = signal<boolean>(false);
  
  // Gesture states
  isDragging = signal<boolean>(false);
  dragOffset = signal<number>(0);
  lazyRenderContent = signal<boolean>(false);
  
  private startY = 0;
  private openTimerId: any = null;
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        if (this.openTimerId) {
          clearTimeout(this.openTimerId);
          this.openTimerId = null;
        }
        this.renderComponent.set(true);
        this.lazyRenderContent.set(false);
        this.dragOffset.set(0);
        // Force evaluation in next macro-task to allow DOM to render before animating
        setTimeout(() => {
          this.isAnimating.set(true);
          this.cdr.markForCheck();
        }, 20);

        // Defer instantiation until entry transition is complete
        this.openTimerId = setTimeout(() => {
          this.lazyRenderContent.set(true);
          this.cdr.markForCheck();
          this.openTimerId = null;
        }, 420);
      } else {
        if (this.openTimerId) {
          clearTimeout(this.openTimerId);
          this.openTimerId = null;
        }
        this.isAnimating.set(false);
        this.lazyRenderContent.set(false);
        this.cdr.markForCheck();
        setTimeout(() => {
          this.renderComponent.set(false);
          this.cdr.markForCheck();
        }, 280);
      }
    });
  }

  closeSheet() {
    this.closed.emit();
  }

  // Drag Gesture Start
  onDragStart(event: TouchEvent | MouseEvent) {
    if (event instanceof MouseEvent && event.button !== 0) return;

    const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    this.startY = clientY;
    this.isDragging.set(true);
    this.dragOffset.set(0);

    if (event instanceof MouseEvent) {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
    } else {
      document.addEventListener('touchmove', this.onTouchMove, { passive: false });
      document.addEventListener('touchend', this.onTouchEnd);
    }
    this.cdr.markForCheck();
  }

  private readonly onMouseMove = (event: MouseEvent) => {
    if (!this.isDragging()) return;
    const deltaY = event.clientY - this.startY;
    if (deltaY > 0) {
      this.dragOffset.set(deltaY);
    } else {
      // Rubber band dragging up
      this.dragOffset.set(deltaY * 0.15);
    }
    this.cdr.markForCheck();
  };

  private readonly onTouchMove = (event: TouchEvent) => {
    if (!this.isDragging()) return;
    const deltaY = event.touches[0].clientY - this.startY;
    if (deltaY > 0) {
      this.dragOffset.set(deltaY);
      if (event.cancelable) {
        event.preventDefault();
      }
    } else {
      this.dragOffset.set(deltaY * 0.15);
    }
    this.cdr.markForCheck();
  };

  private readonly onMouseUp = () => {
    this.endDrag();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  private readonly onTouchEnd = () => {
    this.endDrag();
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  };

  private endDrag() {
    if (!this.isDragging()) return;
    this.isDragging.set(false);

    const finalOffset = this.dragOffset();
    const threshold = 120; // 120px drag down to close

    if (finalOffset > threshold) {
      this.isAnimating.set(false);
      this.lazyRenderContent.set(false);
      this.dragOffset.set(0);
      this.closeSheet();
    } else {
      this.dragOffset.set(0);
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    if (this.openTimerId) {
      clearTimeout(this.openTimerId);
    }
    // Clean up document event listeners to avoid leaks
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  }
}
