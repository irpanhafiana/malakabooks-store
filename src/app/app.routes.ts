import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Auth layout viewport routes for Admin Login
  {
    path: 'admin/login',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(c => c.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/login/admin-login.component').then(c => c.AdminLoginComponent)
      }
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
        loadComponent: () => import('./features/admin/products/list/products-list.component').then(c => c.ProductsListComponent)
      },
      { path: 'categories', loadComponent: () => import('./features/admin/categories/list/categories-list.component').then(m => m.CategoriesListComponent) },
      { path: 'home-addresses', loadComponent: () => import('./features/admin/home-addresses/list/home-addresses-list.component').then(m => m.HomeAddressesListComponent) },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/list/orders-list.component').then(c => c.OrdersListComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/users-crud.component').then(c => c.UsersCrudComponent)
      },
      {
        path: 'complaints',
        loadComponent: () => import('./features/admin/complaints/list/complaints-list.component').then(c => c.ComplaintsListComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/reports/reports.component').then(c => c.ReportsComponent)
      }
    ]
  },

  // Customer facing layout website routes (with bottom navbar)
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
        path: 'wishlist',
        loadComponent: () => import('./features/wishlist/wishlist.component').then(c => c.WishlistComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent),
        canActivate: [authGuard]
      },
      {
        path: 'auth/login',
        loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
      }
    ]
  },

  // Inner page layout (without bottom nav, with back button)
  {
    path: '',
    loadComponent: () => import('./layouts/inner-page-layout/inner-page-layout.component').then(c => c.InnerPageLayoutComponent),
    children: [
      {
        path: 'auth',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent)
          },
          {
            path: 'forgot-password',
            loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent)
          }
        ]
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.component').then(c => c.CartComponent),
        data: { title: 'Shopping Cart' }
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout.component').then(c => c.CheckoutComponent),
        canActivate: [authGuard],
        data: { title: 'Checkout' }
      },
      {
        path: 'order-success',
        loadComponent: () => import('./features/order/order-success/order-success.component').then(c => c.OrderSuccessComponent),
        canActivate: [authGuard],
        data: { title: 'Order Status' }
      },
      {
        path: 'order-history',
        loadComponent: () => import('./features/order/order-history/order-history.component').then(c => c.OrderHistoryComponent),
        canActivate: [authGuard],
        data: { title: 'Order History' }
      },
      {
        path: 'complaints',
        loadComponent: () => import('./features/complaint/complaint.component').then(c => c.ComplaintComponent),
        canActivate: [authGuard],
        data: { title: 'Komplain Saya' }
      }
    ]
  },

  // Catch-all redirection to store home page
  { path: '**', redirectTo: '' }
];
