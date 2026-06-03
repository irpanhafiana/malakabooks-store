import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { CustomerLayout } from './layouts/customer-layout/customer-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/public/home/home').then((m) => m.HomePage)
      },
      {
        path: 'catalog',
        loadComponent: () => import('./pages/public/catalog/catalog').then((m) => m.CatalogPage)
      },
      {
        path: 'book/:id',
        loadComponent: () => import('./pages/public/book-detail/book-detail').then((m) => m.BookDetailPage)
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/public/login/login').then((m) => m.LoginPage),
        canActivate: [guestGuard]
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/public/register/register').then((m) => m.RegisterPage),
        canActivate: [guestGuard]
      }
    ]
  },
  // Customer routes
  {
    path: 'account',
    component: CustomerLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () => import('./pages/customer/profile/profile').then((m) => m.ProfilePage)
      },
      {
        path: 'addresses',
        loadComponent: () => import('./pages/customer/addresses/addresses').then((m) => m.AddressesPage)
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/customer/cart/cart').then((m) => m.CartPage)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./pages/customer/checkout/checkout').then((m) => m.CheckoutPage)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/customer/orders/orders').then((m) => m.OrdersPage)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/customer/order-detail/order-detail').then((m) => m.OrderDetailPage)
      },
      {
        path: 'reviews/write/:orderId/:bookId',
        loadComponent: () => import('./pages/customer/write-review/write-review').then((m) => m.WriteReviewPage)
      },
      {
        path: 'complaints',
        loadComponent: () => import('./pages/customer/complaints/complaints').then((m) => m.ComplaintsPage)
      }
    ]
  },
  // Admin routes
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard').then((m) => m.DashboardPage)
      },
      {
        path: 'books',
        loadComponent: () => import('./pages/admin/books-management/books-management').then((m) => m.BooksManagementPage)
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/admin/categories-management/categories-management').then((m) => m.CategoriesManagementPage)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/admin/orders-management/orders-management').then((m) => m.OrdersManagementPage)
      },
      {
        path: 'complaints',
        loadComponent: () => import('./pages/admin/complaints-management/complaints-management').then((m) => m.ComplaintsManagementPage)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/users-management/users-management').then((m) => m.UsersManagementPage)
      }
    ]
  },
  // Fallback
  { path: '**', redirectTo: '' }
];

