import { Component, input, model, computed } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.css'
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
