import { Component, input, model, computed } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-hidden">
        <!-- Backdrop panel -->
        <div
          class="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity animate-fade-in"
          (click)="close()"
        ></div>

        <!-- Drawer Content body -->
        <div [class]="drawerClass()">
          <!-- Header -->
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-display font-bold text-slate-800 text-base">{{ title() }}</h3>
            <button
              type="button"
              (click)="close()"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer active:scale-90"
            >
              <app-icon name="x" size="18"></app-icon>
            </button>
          </div>

          <!-- Scroll viewport -->
          <div class="flex-grow overflow-y-auto p-5">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slide-left {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-left {
      animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class DrawerComponent {
  readonly isOpen = model<boolean>(false);
  readonly title = input<string>('');
  readonly position = input<'bottom' | 'right'>('right');

  readonly drawerClass = computed(() => {
    const base = 'fixed bg-white shadow-2xl flex flex-col transition-transform duration-300 z-10';
    
    if (this.position() === 'bottom') {
      // Bottom slide-up sheet (mobile standard)
      return `${base} bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border-t border-slate-100 animate-slide-up w-full`;
    } else {
      // Right slide-in drawer
      return `${base} top-0 right-0 bottom-0 w-full sm:w-[420px] border-l border-slate-100 animate-slide-left h-full`;
    }
  });

  close() {
    this.isOpen.set(false);
  }
}
