import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { katalogCheckoutAbandonGuard } from './core/guards/katalog-checkout-abandon.guard';

export const routes: Routes = [

  // Admin layout dashboard management routes
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(c => c.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./core/components/login-redirect.component').then(c => c.LoginRedirectComponent),
        canActivate: [adminGuard]
      },
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      { path: 'categories', loadComponent: () => import('./features/admin/categories/list/categories-list.component').then(c => c.CategoriesListComponent) },
      { path: 'uoms', loadComponent: () => import('./features/admin/uoms/list/uom-groups-list.component').then(c => c.UomGroupsListComponent) },
      { path: 'uoms/new', loadComponent: () => import('./features/admin/uoms/form-page/uom-groups-form-page.component').then(c => c.UomGroupsFormPageComponent) },
      { path: 'uoms/edit/:id', loadComponent: () => import('./features/admin/uoms/form-page/uom-groups-form-page.component').then(c => c.UomGroupsFormPageComponent) },
      { path: 'warehouses', loadComponent: () => import('./features/admin/warehouses/list/warehouses-list.component').then(c => c.WarehousesListComponent) },
      { path: 'items', loadComponent: () => import('./features/admin/items/list/items-list.component').then(c => c.ItemsListComponent) },
      { path: 'items/new', loadComponent: () => import('./features/admin/items/form-page/items-form-page.component').then(c => c.ItemsFormPageComponent) },
      { path: 'items/edit/:id', loadComponent: () => import('./features/admin/items/form-page/items-form-page.component').then(c => c.ItemsFormPageComponent) },
      { path: 'items/detail/:id', loadComponent: () => import('./features/admin/items/detail/items-detail.component').then(c => c.ItemsDetailComponent) },
      // TODO(warehouse-stocks): dinonaktifkan sementara — backend belum menyediakan
      // WarehouseStocksController (endpoint /admin|public/WarehouseStocks => 404). Aktifkan
      // kembali route ini + link nav di admin-layout.component.html setelah API tersedia.
      // { path: 'stocks', loadComponent: () => import('./features/admin/stocks/list/stocks-list.component').then(c => c.StocksListComponent) },
      { path: 'pricings', loadComponent: () => import('./features/admin/pricings/list/pricings-list.component').then(c => c.PricingsListComponent) },
      { path: 'pricings/new', loadComponent: () => import('./features/admin/pricings/form-page/pricings-form-page.component').then(c => c.PricingsFormPageComponent) },
      { path: 'pricings/edit/:id', loadComponent: () => import('./features/admin/pricings/form-page/pricings-form-page.component').then(c => c.PricingsFormPageComponent) },
      { path: 'inventory-movements', loadComponent: () => import('./features/admin/inventory-movements/inventory-movements.component').then(c => c.InventoryMovementsComponent) },
      { path: 'payment-methods', loadComponent: () => import('./features/admin/payment-methods/list/payment-methods-list.component').then(c => c.PaymentMethodsListComponent) },
      { path: 'authors', loadComponent: () => import('./features/admin/authors/list/authors-list.component').then(c => c.AuthorsListComponent) },
      { path: 'promotion-banners', loadComponent: () => import('./features/admin/promotion-banners/list/promotion-banners-list.component').then(c => c.PromotionBannersListComponent) },
      { path: 'home-addresses', loadComponent: () => import('./features/admin/home-addresses/list/home-addresses-list.component').then(c => c.HomeAddressesListComponent) },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/list/orders-list.component').then(c => c.OrdersListComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/list/users-list.component').then(c => c.UsersListComponent)
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
        loadComponent: () => import('./features/home/home.component').then(c => c.HomeComponent),
        data: { preload: true }
      },
      {
        path: 'mardika-kopi',
        loadComponent: () => import('./features/mardika-kopi/mardika-kopi.component').then(c => c.MardikaKopiComponent)
      }
    ]
  },



  // Inner page layout (without bottom nav, with back button)
  {
    path: '',
    loadComponent: () => import('./layouts/inner-page-layout/inner-page-layout.component').then(c => c.InnerPageLayoutComponent),
    children: [
      {
        path: 'product',
        loadComponent: () => import('./features/product/product-list/product-list.component').then(c => c.ProductListComponent),
        data: { hideHeader: true, preload: true }
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./features/product/product-detail/product-detail.component').then(c => c.ProductDetailComponent),
        data: { hideHeader: true, preload: true }
      },
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
            path: 'login',
            loadComponent: () => import('./core/components/login-redirect.component').then(c => c.LoginRedirectComponent),
            canActivate: [authGuard]
          },
          {
            path: 'welcome',
            loadComponent: () => import('./features/auth/welcome/welcome.component').then(c => c.WelcomeComponent),
            data: { title: 'Welcome', hideHeader: true }
          },
          {
            path: 'callback',
            loadComponent: () => import('./features/auth/callback/callback.component').then(c => c.CallbackComponent),
            data: { title: 'Authenticating...', hideHeader: true }
          },
          {
            path: 'register',
            loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent),
            data: { title: 'Register' }
          },
          {
            path: 'forgot-password',
            loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
            data: { title: 'Lupa Password' }
          }
        ]
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.component').then(c => c.CartComponent),
        data: { title: 'Keranjang Belanja', preload: true }
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
        data: { title: 'Riwayat Pesanan' }
      },
      {
        path: 'detail-shipment/:id',
        loadComponent: () => import('./features/order/detail-shipment/detail-shipment.component').then(c => c.DetailShipmentComponent),
        canActivate: [authGuard],
        data: { title: 'Detail Shipment' }
      },
      {
        path: 'complaints',
        loadComponent: () => import('./features/complaint/complaint.component').then(c => c.ComplaintComponent),
        canActivate: [authGuard],
        data: { title: 'Komplain Saya' }
      },
      {
        path: 'profile/addresses',
        loadComponent: () => import('./features/profile/my-addresses/my-addresses.component').then(c => c.MyAddressesComponent),
        canActivate: [authGuard],
        data: { title: 'Alamat Saya' }
      },
      {
        path: '404',
        loadComponent: () => import('./features/not-found/not-found.component').then(c => c.NotFoundComponent),
        data: { title: 'Halaman Tidak Ditemukan' }
      }
    ]
  },

  // B2C Katalog (Belanja Offline - Flow copy sj-pos-katalog)
  {
    path: 'katalog',
    loadComponent: () => import('./layouts/katalog-layout/katalog-layout.component').then(c => c.KatalogLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/katalog/katalog-home/katalog-home.component').then(c => c.KatalogHomeComponent) },
      { path: 'product/:id', loadComponent: () => import('./features/katalog/katalog-product-detail/katalog-product-detail.component').then(c => c.KatalogProductDetailComponent) },
      { path: 'search', loadComponent: () => import('./features/katalog/katalog-search/katalog-search.component').then(c => c.KatalogSearchComponent) },
      { path: 'cart', loadComponent: () => import('./features/katalog/katalog-cart/katalog-cart.component').then(c => c.KatalogCartComponent) },
      {
        path: 'checkout',
        loadComponent: () => import('./features/katalog/katalog-checkout/katalog-checkout.component').then(c => c.KatalogCheckoutComponent),
        canDeactivate: [katalogCheckoutAbandonGuard]
      }
    ]
  },

  // Catch-all route to 404 page
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];


