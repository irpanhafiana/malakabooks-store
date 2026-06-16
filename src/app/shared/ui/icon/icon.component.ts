import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css'
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input<number | string>(24);
  readonly customClass = input<string>('', { alias: 'class' });

  // Map containing Lucide names to Boxicons classes
  private readonly iconMap: Record<string, string> = {
    'home': 'bx-home-alt',
    'shopping-cart': 'bx-cart',
    'user': 'bx-user',
    'heart': 'bx-heart',
    'heart-filled': 'bxs-heart',
    'cog': 'bx-cog',
    'search': 'bx-search',
    'dashboard': 'bx-grid-alt',
    'book-open': 'bx-book-open',
    'cpu': 'bx-chip',
    'pen-tool': 'bx-edit',
    'edit': 'bx-edit-alt',
    'headphones': 'bx-headphones',
    'tablet': 'bx-tablet',
    'eye': 'bx-show',
    'eye-off': 'bx-hide',
    'chevron-right': 'bx-chevron-right',
    'chevron-left': 'bx-chevron-left',
    'chevron-down': 'bx-chevron-down',
    'plus': 'bx-plus',
    'minus': 'bx-minus',
    'trash': 'bx-trash',
    'log-out': 'bx-log-out',
    'menu': 'bx-menu',
    'check': 'bx-check',
    'alert-circle': 'bx-error-circle',
    'credit-card': 'bx-credit-card',
    'landmark': 'bx-landmark',
    'wallet': 'bx-wallet',
    'truck': 'bx-truck',
    'star': 'bx-star',
    'x': 'bx-x',
    'shield': 'bx-shield',
    'bar-chart': 'bx-bar-chart-alt-2',
    'users': 'bx-group',
    'shopping-bag': 'bx-shopping-bag',
    'filter': 'bx-filter',
    'arrow-up-down': 'bx-transfer-alt',
    'clock': 'bx-clock',
    'map-pin': 'bx-map'
  };

  readonly fontSize = computed(() => {
    const s = this.size();
    return typeof s === 'number' || /^\d+$/.test(String(s)) ? `${s}px` : String(s);
  });

  readonly boxiconClass = computed(() => {
    const name = this.name();
    let classes = this.customClass();
    
    let bxName = this.iconMap[name] || `bx-${name}`;
    
    if (name === 'star' || name === 'star-half') {
      if (classes.includes('fill-amber-400') || classes.includes('text-amber-400')) {
        bxName = name === 'star' ? 'bxs-star' : 'bxs-star-half';
        classes = classes.replace('fill-amber-400', 'text-amber-400');
      } else {
        bxName = name === 'star' ? 'bx-star' : 'bx-star-half';
      }
    }
    
    return `bx ${bxName} ${classes}`;
  });
}
