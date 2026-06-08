import { Component, inject, signal, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { UserStore } from '../../store/user.store';
import { ProductStore } from '../../store/product.store';
import { ToastService } from '../../core/services/toast.service';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar.component';
import { ProductDetailComponent } from '../../features/product/product-detail/product-detail.component';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchBarComponent, ProductDetailComponent],
  template: `
    <!-- Desktop Background Wrapper (Plain white seamless background) -->
    <div class="h-screen h-[100dvh] w-full bg-white flex justify-center items-stretch font-sans overflow-hidden">
      
      <!-- Mobile App Frame Container (Constrained width, full viewport height, plain white, no borders or shadows) -->
      <div class="w-full max-w-[450px] h-full bg-white flex flex-col relative overflow-hidden">
        
        <!-- Mobile-style Header -->
        <header class="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs px-4 py-3 flex items-center justify-between gap-3 h-14 shrink-0">
          <!-- Left: Brand Logo -->
          <a routerLink="/" (click)="resetFilters()" class="flex items-center gap-1.5 text-slate-800 font-display font-extrabold text-sm select-none">
            <span class="px-1.5 py-0.5 rounded-md bg-primary-600 text-white text-[10px]">MB</span>
            <span class="text-xs tracking-tight">malaka</span>
          </a>

          <!-- Center: Search Input -->
          <div class="flex-grow max-w-[200px]">
            <app-search-bar [placeholder]="'Search books...'" [value]="productStore.searchQuery()" (search)="onSearch($event)"></app-search-bar>
          </div>

          <!-- Right: Cart & Profile Icons -->
          <div class="flex items-center gap-1">
            <!-- Cart Icon -->
            <a routerLink="/cart" class="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 relative cursor-pointer">
              <i class="bx bx-cart text-lg"></i>
              @if (cartStore.itemsCount() > 0) {
                <span class="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 rounded-full bg-primary-600 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                  {{ cartStore.itemsCount() }}
                </span>
              }
            </a>

            <!-- Profile / Settings / Admin Link -->
            @if (authStore.isLoggedIn()) {
              <div class="relative group">
                <button type="button" class="h-6 w-6 rounded-full bg-primary-50 text-primary-700 font-bold font-display flex items-center justify-center border border-primary-100 text-[9px] cursor-pointer">
                  {{ authStore.currentUser()?.name?.substring(0, 2)?.toUpperCase() }}
                </button>
                
                <!-- Simple hover menu for profile/logout/admin -->
                <div class="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 hidden group-hover:block z-50 text-[10px] font-semibold text-slate-700">
                  @if (authStore.isAdmin()) {
                    <a routerLink="/admin" class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50">
                      <i class="bx bx-shield"></i> Admin Panel
                    </a>
                  }
                  <a routerLink="/profile" class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50">
                    <i class="bx bx-user"></i> My Profile
                  </a>
                  <a routerLink="/order-history" class="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50">
                    <i class="bx bx-receipt"></i> Orders
                  </a>
                  <hr class="border-slate-100 my-1"/>
                  <button (click)="authStore.logout()" class="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 text-rose-600 text-left cursor-pointer font-bold">
                    <i class="bx bx-log-out"></i> Sign Out
                  </button>
                </div>
              </div>
            } @else {
              <a routerLink="/auth/login" class="text-[9px] font-bold text-primary-600 px-2 py-1 bg-primary-50 rounded-lg whitespace-nowrap">
                Sign In
              </a>
            }
          </div>
        </header>

        <!-- Scrollable Contents Area -->
        <main class="flex-grow overflow-y-auto px-4 py-4 pb-20 no-scrollbar bg-white">
          <router-outlet></router-outlet>
        </main>

        <!-- Pinned Bottom Navigation Menu -->
        <nav class="absolute bottom-0 left-0 right-0 z-[45] bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-lg flex justify-around py-2 shrink-0">
          <a
            routerLink="/"
            [routerLinkActiveOptions]="{exact: true}"
            routerLinkActive="text-primary-600"
            (click)="resetFilters()"
            class="flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-colors py-1 px-3 cursor-pointer"
          >
            <i class="bx bx-home text-lg"></i>
            <span class="text-[9px] font-bold mt-1">Home</span>
          </a>

          <a
            routerLink="/wishlist"
            routerLinkActive="text-primary-600"
            class="flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-colors py-1 px-3 relative cursor-pointer"
          >
            <i class="bx bx-heart text-lg"></i>
            @if (userStore.wishlistCount() > 0) {
              <span class="absolute top-1 right-2.5 h-3.5 min-w-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                {{ userStore.wishlistCount() }}
              </span>
            }
            <span class="text-[9px] font-bold mt-1">Wishlist</span>
          </a>

          <a
            routerLink="/order-history"
            routerLinkActive="text-primary-600"
            class="flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-colors py-1 px-3 cursor-pointer"
          >
            <i class="bx bx-receipt text-lg"></i>
            <span class="text-[9px] font-bold mt-1">Orders</span>
          </a>

          <a
            routerLink="/profile"
            routerLinkActive="text-primary-600"
            class="flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-colors py-1 px-3 cursor-pointer"
          >
            <i class="bx bx-user text-lg"></i>
            <span class="text-[9px] font-bold mt-1">Profile</span>
          </a>
        </nav>

        <!-- Global Toasts Alert Overlay (relative to phone frame) -->
        <div class="absolute top-16 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
          @for (toast of toastService.toasts(); track toast.id) {
            <div
              [class]="toastClass(toast.type)"
              class="flex items-center gap-2.5 p-3 rounded-xl shadow-md border bg-white animate-slide-down transition-all pointer-events-auto"
            >
              @if (toast.type === 'success') {
                <i class="bx bx-check text-emerald-500 text-sm"></i>
              } @else if (toast.type === 'error') {
                <i class="bx bx-error-circle text-rose-500 text-sm"></i>
              } @else {
                <i class="bx bx-info-circle text-blue-500 text-sm"></i>
              }
              <span class="text-[10px] font-semibold text-slate-800 flex-1">{{ toast.message }}</span>
              <button (click)="toastService.remove(toast.id)" class="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer">
                <i class="bx bx-x text-xs"></i>
              </button>
            </div>
          }
        </div>

        <!-- Product Detail Bottom Sheet (Height ~85%, constrained inside the mobile container) -->
        @if (isDetailOpen()) {
          <!-- Backdrop overlay -->
          <div
            class="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] z-50 transition-opacity duration-300 ease-in-out"
            [class.opacity-100]="isDetailAnimating()"
            [class.opacity-0]="!isDetailAnimating()"
            (click)="closeProductDetails()"
          ></div>

          <!-- Bottom Sheet Content Container -->
          <div
            class="absolute bottom-0 left-0 right-0 h-[85%] bg-white rounded-t-[32px] shadow-2xl z-[55] flex flex-col overflow-hidden transition-transform duration-300 ease-out transform"
            [class.translate-y-0]="isDetailAnimating()"
            [class.translate-y-full]="!isDetailAnimating()"
          >
            <!-- Drag Indicator/Header handle bar (Premium micro-interaction visual) -->
            <div class="w-full flex justify-center py-3 shrink-0 cursor-pointer" (click)="closeProductDetails()">
              <div class="w-12 h-1.5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors"></div>
            </div>

            <!-- Sticky Top Header within Sheet (Close button and Title) -->
            <div class="px-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 class="font-display font-extrabold text-slate-800 text-sm">Product Details</h3>
              <button
                type="button"
                (click)="closeProductDetails()"
                class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer active:scale-90 flex items-center justify-center border-0"
              >
                <i class="bx bx-x text-lg"></i>
              </button>
            </div>

            <!-- Content Viewport -->
            <div class="flex-grow overflow-hidden">
              <app-product-detail [productId]="selectedDetailId()"></app-product-detail>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    /* Custom scrollbar hides for standard mobile container */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class CustomerLayoutComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly productStore = inject(ProductStore);
  protected readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  isDetailOpen = signal<boolean>(false);
  isDetailAnimating = signal<boolean>(false);
  selectedDetailId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.productStore.selectedProductId();
      if (id) {
        this.selectedDetailId.set(id);
        this.isDetailOpen.set(true);
        setTimeout(() => {
          this.isDetailAnimating.set(true);
        }, 16);
      } else {
        this.isDetailAnimating.set(false);
        setTimeout(() => {
          this.isDetailOpen.set(false);
          this.selectedDetailId.set(null);
        }, 300);
      }
    });
  }

  closeProductDetails() {
    this.productStore.setSelectedProductId(null);
  }

  onSearch(query: string) {
    this.productStore.setSearchQuery(query);
    this.router.navigate(['/product']);
  }

  filterByCategory(catId: string) {
    this.productStore.setCategoryFilter(catId);
  }

  resetFilters() {
    this.productStore.setCategoryFilter(null);
    this.productStore.setSearchQuery('');
  }

  toastClass(type: string): string {
    const borderType = {
      success: 'border-l-4 border-l-emerald-500 shadow-emerald-500/5 shadow-md',
      error: 'border-l-4 border-l-rose-500 shadow-rose-500/5 shadow-md',
      info: 'border-l-4 border-l-blue-500 shadow-blue-500/5 shadow-md',
      warning: 'border-l-4 border-l-amber-500 shadow-amber-500/5 shadow-md'
    };
    return borderType[type as keyof typeof borderType] || 'border-l-4 border-l-blue-500';
  }
}
