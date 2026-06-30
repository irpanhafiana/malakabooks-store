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
      {
        path: 'products/new',
        loadComponent: () => import('./features/admin/products/form-page/products-form-page.component').then(c => c.ProductsFormPageComponent)
      },
      {
        path: 'products/edit/:id',
        loadComponent: () => import('./features/admin/products/form-page/products-form-page.component').then(c => c.ProductsFormPageComponent)
      },
      { path: 'categories', loadComponent: () => import('./features/admin/categories/list/categories-list.component').then(m => m.CategoriesListComponent) },
      { path: 'payment-methods', loadComponent: () => import('./features/admin/payment-methods/list/payment-methods-list.component').then(m => m.PaymentMethodsListComponent) },
      { path: 'authors', loadComponent: () => import('./features/admin/authors/list/authors-list.component').then(m => m.AuthorsListComponent) },
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
      }
    ]
  },

  // Search layout (without top header, just bottom nav)
  {
    path: '',
    loadComponent: () => import('./layouts/search-layout/search-layout.component').then(c => c.SearchLayoutComponent),
    children: [
      {
        path: 'product',
        loadComponent: () => import('./features/product/product-list/product-list.component').then(c => c.ProductListComponent)
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./features/product/product-detail/product-detail.component').then(c => c.ProductDetailComponent)
      }
    ]
  },

    // Inner page layout (without bottom nav, with back button)
  {
    path: '',
    loadComponent: () => import('./layouts/inner-page-layout/inner-page-layout.component').then(c => c.InnerPageLayoutComponent),
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent),
        canActivate: [authGuard],
        data: { title: 'Profile' }
      },
      {
        path: 'auth',
        children: [
          {
            path: 'welcome',
            loadComponent: () => import('./features/auth/welcome/welcome.component').then(c => c.WelcomeComponent),
            data: { title: 'Welcome', hideHeader: true }
          },
          {
            path: 'login',
            loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent),
            data: { title: 'Login', hideHeader: true }
          },
          {
            path: 'register',
            loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent),
            data: { title: 'Register', hideHeader: true }
          },
          {
            path: 'forgot-password',
            loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
            data: { title: 'Lupa Password', hideHeader: true }
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
        path: 'detail-shipment/:id',
        loadComponent: () => import('./features/order/detail-shipment/detail-shipment.component').then(c => c.DetailShipmentComponent),
        canActivate: [authGuard],
        data: { title: 'Detail Shipment' }
      },
      {
        path: 'tracking',
        loadComponent: () => import('./features/tracking/tracking.component').then(c => c.TrackingComponent),
        canActivate: [authGuard],
        data: { title: 'Tracking Pesanan' }
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
