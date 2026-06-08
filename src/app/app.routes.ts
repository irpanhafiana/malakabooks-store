import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Auth layout viewport routes
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(c => c.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // Admin layout dashboard management routes
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(c => c.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(c => c.AdminDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/admin/products/products-crud.component').then(c => c.ProductsCrudComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/categories/categories-crud.component').then(c => c.CategoriesCrudComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/orders-crud.component').then(c => c.OrdersCrudComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/users-crud.component').then(c => c.UsersCrudComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/reports/reports.component').then(c => c.ReportsComponent)
      }
    ]
  },

  // Customer facing layout website routes
  {
    path: '',
    loadComponent: () => import('./layouts/customer-layout/customer-layout.component').then(c => c.CustomerLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(c => c.HomeComponent)
      },
      {
        path: 'product',
        loadComponent: () => import('./features/product/product-list/product-list.component').then(c => c.ProductListComponent)
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./features/product/product-detail/product-detail.component').then(c => c.ProductDetailComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.component').then(c => c.CartComponent)
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/wishlist/wishlist.component').then(c => c.WishlistComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout.component').then(c => c.CheckoutComponent),
        canActivate: [authGuard]
      },
      {
        path: 'order-success',
        loadComponent: () => import('./features/order/order-success/order-success.component').then(c => c.OrderSuccessComponent),
        canActivate: [authGuard]
      },
      {
        path: 'order-history',
        loadComponent: () => import('./features/order/order-history/order-history.component').then(c => c.OrderHistoryComponent),
        canActivate: [authGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent),
        canActivate: [authGuard]
      }
    ]
  },

  // Catch-all redirection to store home page
  { path: '**', redirectTo: '' }
];
