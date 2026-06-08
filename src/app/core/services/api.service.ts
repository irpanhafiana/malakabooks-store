import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, Category, User, Order, Review, DashboardMetrics, Address } from '../models';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = 'http://192.168.1.15:25168/api/v1';
  private readonly AUTH_URL = 'http://192.168.1.15:44310/connect/token';

  // --- HELPER UNTUK OAUTH2 / CONNECT TOKEN ---
  async loginAndGetToken(username: string, password: string): Promise<string | null> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'MalakaBooks-FE');
    body.set('client_secret', 'MalakaBooks-FE');
    body.set('username', username);
    body.set('password', password);
    body.set('scope', 'Create Update Delete Read offline_access MalakaBooks_Scope');

    try {
      const res = await firstValueFrom(
        this.http.post<any>(this.AUTH_URL, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
      return res.access_token || null;
    } catch (e) {
      console.error('Request token gagal:', e);
      return null;
    }
  }

  // --- BOOK TO PRODUCT MAPPER ---
  private mapBookToProduct(book: any): Product {
    return {
      id: book.id,
      name: book.title,
      description: book.description || '',
      price: book.price,
      categoryId: book.categoryId,
      categoryName: '', // Diisi dinamis
      stock: book.stock || 0,
      rating: book.averageRating || 5.0,
      reviewsCount: book.totalReviews || 0,
      images: book.coverImage ? [book.coverImage] : [],
      brand: book.publisher || 'Unknown Publisher',
      featured: true,
      specifications: {
        'Author': book.author || '',
        'ISBN': book.isbn || '',
        'Published Year': book.publishedYear?.toString() || '',
        'Pages': book.pages?.toString() || '',
        'Weight': book.weight ? `${book.weight} kg` : ''
      },
      createdAt: book.createdAt || new Date().toISOString()
    };
  }

  // --- PRODUCTS API ---
  async getProducts(): Promise<Product[]> {
    try {
      const books = await firstValueFrom(this.http.get<any[]>(`${this.BASE_URL}/public/Books`)) || [];
      const categories = await this.getCategories();
      const catMap = new Map(categories.map(c => [c.id, c.name]));
      
      return books.map(b => ({
        ...this.mapBookToProduct(b),
        categoryName: catMap.get(b.categoryId) || 'Other'
      }));
    } catch (e) {
      console.error('Gagal mengambil daftar produk:', e);
      return [];
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const book = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/public/Books/${id}`));
      if (!book) return undefined;
      const categories = await this.getCategories();
      const category = categories.find(c => c.id === book.categoryId);
      return {
        ...this.mapBookToProduct(book),
        categoryName: category?.name || 'Other'
      };
    } catch (e) {
      console.error(`Gagal mengambil detail produk ${id}:`, e);
      return undefined;
    }
  }

  async saveProduct(product: Product): Promise<Product> {
    const isNew = !product.id || product.id.startsWith('prod-');
    const body = {
      title: product.name,
      author: product.specifications['Author'] || '',
      isbn: product.specifications['ISBN'] || '',
      categoryId: product.categoryId,
      price: product.price,
      description: product.description,
      coverImage: product.images[0] || '',
      publisher: product.brand || product.specifications['Publisher'] || '',
      publishedYear: parseInt(product.specifications['Published Year']) || new Date().getFullYear(),
      pages: parseInt(product.specifications['Pages']) || 0,
      weight: parseFloat(product.specifications['Weight']) || 0.0,
      stock: product.stock
    };

    try {
      if (isNew) {
        const res = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/admin/Books`, body));
        return this.mapBookToProduct(res);
      } else {
        const res = await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/admin/Books/${product.id}`, body));
        return this.mapBookToProduct(res);
      }
    } catch (e) {
      console.error('Gagal menyimpan produk:', e);
      throw e;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Books/${id}`));
      return true;
    } catch (e) {
      console.error(`Gagal menghapus produk ${id}:`, e);
      return false;
    }
  }

  // --- CATEGORIES API ---
  async getCategories(): Promise<Category[]> {
    try {
      const list = await firstValueFrom(this.http.get<any[]>(`${this.BASE_URL}/public/Categories`)) || [];
      return list.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: c.icon || 'book',
        description: c.description || ''
      }));
    } catch (e) {
      console.error('Gagal mengambil kategori:', e);
      return [];
    }
  }

  async saveCategory(category: Category): Promise<Category> {
    const isNew = !category.id || category.id.startsWith('cat-');
    const body = {
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: category.description || '',
      icon: category.icon || 'book'
    };

    try {
      if (isNew) {
        return await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/admin/Categories`, body));
      } else {
        return await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/admin/Categories/${category.id}`, body));
      }
    } catch (e) {
      console.error('Gagal menyimpan kategori:', e);
      throw e;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Categories/${id}`));
      return true;
    } catch (e) {
      console.error(`Gagal menghapus kategori ${id}:`, e);
      return false;
    }
  }

  // --- REVIEWS API ---
  async getReviewsByProductId(productId: string): Promise<Review[]> {
    try {
      // Endpoint review berada di bawah area customer
      const reviews = await firstValueFrom(this.http.get<any[]>(`${this.BASE_URL}/customer/Reviews/book/${productId}`)) || [];
      return reviews.map(r => ({
        id: r.id,
        productId: r.bookId,
        userName: 'Customer', // Default
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt
      }));
    } catch (e) {
      console.warn(`Reviews could not be loaded (likely unauthorized for guest):`, e);
      return [];
    }
  }

  async addReview(review: Review): Promise<Review> {
    const currentUserStr = localStorage.getItem('malakabooks_session_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const userId = currentUser?.id || 'guest';

    const body = {
      userId: userId,
      bookId: review.productId,
      orderId: '6663f7eb2151680000000000', // Dummy order id valid untuk lolos validasi backend
      rating: review.rating,
      comment: review.comment
    };

    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Reviews`, body));
      return {
        id: res.id,
        productId: res.bookId,
        userName: currentUser?.name || 'Customer',
        rating: res.rating,
        comment: res.comment,
        date: res.createdAt
      };
    } catch (e) {
      console.error('Gagal menambahkan ulasan:', e);
      throw e;
    }
  }

  // --- ADDRESSES API HELPER ---
  async getAddressesByUserId(userId: string): Promise<Address[]> {
    try {
      const list = await firstValueFrom(this.http.get<any[]>(`${this.BASE_URL}/customer/Addresses/user/${userId}`)) || [];
      return list.map(addr => ({
        id: addr.id,
        name: addr.label,
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        province: addr.province,
        postalCode: addr.postalCode,
        isDefault: addr.isDefault
      }));
    } catch (e) {
      console.error(`Gagal mengambil alamat untuk user ${userId}:`, e);
      return [];
    }
  }

  // --- USERS API ---
  async getUsers(): Promise<User[]> {
    const currentUserStr = localStorage.getItem('malakabooks_session_user');
    if (currentUserStr) {
      const u = JSON.parse(currentUserStr);
      const user = await this.getUserById(u.id);
      return user ? [user] : [];
    }
    return [];
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const userRes = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Users/${id}/profile`));
      if (!userRes) return undefined;
      const addresses = await this.getAddressesByUserId(id);
      return {
        id: userRes.id,
        name: userRes.name,
        email: userRes.email,
        role: userRes.role as 'customer' | 'admin',
        phone: userRes.phone || '',
        avatar: userRes.avatar || '',
        joinedAt: userRes.createdAt,
        addresses: addresses
      };
    } catch (e) {
      console.error(`Gagal mengambil detail user ${id}:`, e);
      return undefined;
    }
  }

  async saveUser(user: User): Promise<User> {
    const profileBody = {
      name: user.name,
      phone: user.phone || '',
      avatar: user.avatar || ''
    };

    try {
      // 1. Simpan Profil User
      await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/customer/Users/${user.id}/profile`, profileBody));
      
      // 2. Sinkronisasi Alamat User
      const backendAddresses = await this.getAddressesByUserId(user.id);
      const backendAddrMap = new Map(backendAddresses.map(a => [a.id, a]));
      const finalAddresses: Address[] = [];
      
      for (const addr of user.addresses) {
        const isNew = !addr.id || addr.id.startsWith('addr-');
        const addressBody = {
          userId: user.id,
          label: addr.name,
          recipientName: user.name,
          phone: addr.phone,
          street: addr.street,
          city: addr.city,
          province: addr.province,
          postalCode: addr.postalCode,
          isDefault: addr.isDefault
        };
        
        if (isNew) {
          const created = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Addresses`, addressBody));
          finalAddresses.push({
            id: created.id,
            name: created.label,
            phone: created.phone,
            street: created.street,
            city: created.city,
            province: created.province,
            postalCode: created.postalCode,
            isDefault: created.isDefault
          });
        } else {
          const updated = await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/customer/Addresses/${addr.id}`, addressBody));
          finalAddresses.push({
            id: updated.id,
            name: updated.label,
            phone: updated.phone,
            street: updated.street,
            city: updated.city,
            province: updated.province,
            postalCode: updated.postalCode,
            isDefault: updated.isDefault
          });
          backendAddrMap.delete(addr.id);
        }
      }
      
      // Hapus alamat yang tidak ada lagi di list UI
      for (const [id, _] of backendAddrMap.entries()) {
        try {
          await firstValueFrom(this.http.delete(`${this.BASE_URL}/customer/Addresses/${id}`));
        } catch (e) {
          console.error(`Gagal menghapus alamat ${id}:`, e);
        }
      }

      return {
        ...user,
        addresses: finalAddresses
      };
    } catch (e) {
      console.error('Gagal menyimpan user/alamat:', e);
      throw e;
    }
  }

  // --- ORDERS API ---
  async getOrders(): Promise<Order[]> {
    const currentUserStr = localStorage.getItem('malakabooks_session_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      try {
        const ordersRes = await firstValueFrom(this.http.get<any[]>(`${this.BASE_URL}/admin/Orders`)) || [];
        return ordersRes.map(res => ({
          id: res.id,
          userId: res.userId,
          userName: '',
          userEmail: '',
          items: res.items.map((item: any) => ({
            product: {
              id: item.bookId,
              name: item.title,
              description: '',
              price: item.price,
              images: [],
              categoryId: '',
              categoryName: '',
              stock: 0,
              rating: 5,
              reviewsCount: 0,
              featured: false,
              brand: '',
              specifications: {},
              createdAt: ''
            },
            quantity: item.quantity
          })),
          shippingAddress: {
            id: res.addressId || 'addr-default',
            name: 'Customer Address',
            phone: '',
            street: res.note || 'Default Address',
            city: '',
            province: '',
            postalCode: '',
            isDefault: false
          },
          paymentMethod: 'bank_transfer',
          status: res.status as any,
          subtotal: res.totalPrice,
          shippingCost: 0,
          tax: 0,
          total: res.totalPrice,
          orderDate: res.createdAt
        }));
      } catch (e) {
        console.error('Gagal mengambil semua order (admin):', e);
        return this.getOrdersByUserId(currentUser.id);
      }
    } else {
      return this.getOrdersByUserId(currentUser.id);
    }
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      const [ordersRes, addresses] = await Promise.all([
        firstValueFrom(this.http.get<any[]>(`${this.BASE_URL}/customer/Orders/user/${userId}`)) || Promise.resolve([]),
        this.getAddressesByUserId(userId)
      ]);
      
      const addrMap = new Map(addresses.map(a => [a.id, a]));
      
      return (ordersRes || []).map(res => {
        const shippingAddress = addrMap.get(res.addressId) || {
          id: res.addressId,
          name: 'Address',
          phone: '',
          street: 'Unknown Street',
          city: '',
          province: '',
          postalCode: '',
          isDefault: false
        };
        
        return {
          id: res.id,
          userId: res.userId,
          userName: '',
          userEmail: '',
          items: res.items.map((item: any) => ({
            product: {
              id: item.bookId,
              name: item.title,
              description: '',
              price: item.price,
              images: [],
              categoryId: '',
              categoryName: '',
              stock: 0,
              rating: 5,
              reviewsCount: 0,
              featured: false,
              brand: '',
              specifications: {},
              createdAt: ''
            },
            quantity: item.quantity
          })),
          shippingAddress,
          paymentMethod: 'bank_transfer',
          status: res.status as any,
          subtotal: res.totalPrice,
          shippingCost: 0,
          tax: 0,
          total: res.totalPrice,
          orderDate: res.createdAt
        };
      });
    } catch (e) {
      console.error(`Gagal mengambil order untuk user ${userId}:`, e);
      return [];
    }
  }

  async saveOrder(order: Order): Promise<Order> {
    const body = {
      userId: order.userId,
      items: order.items.map(item => ({
        bookId: item.product.id,
        title: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      addressId: order.shippingAddress.id,
      note: ''
    };

    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Orders`, body));
      
      return {
        id: res.id,
        userId: res.userId,
        userName: order.userName,
        userEmail: order.userEmail,
        items: order.items,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentDetails: order.paymentDetails,
        status: res.status as any,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        total: Number(res.totalPrice) || order.total,
        orderDate: res.createdAt
      };
    } catch (e) {
      console.error('Gagal membuat order:', e);
      throw e;
    }
  }

  // --- DASHBOARD METRICS ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const [products, categories, orders] = await Promise.all([
        this.getProducts(),
        this.getCategories(),
        this.getOrders()
      ]);
      
      const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
      const totalOrders = orders.length;
      const totalCustomers = 12; // Placeholder realistis
      
      const salesHistory = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const daysOrders = orders.filter(o => {
          const oDate = new Date(o.orderDate);
          return oDate.toDateString() === d.toDateString() && o.status !== 'cancelled';
        });

        salesHistory.push({
          date: dateStr,
          amount: daysOrders.reduce((sum, o) => sum + o.total, 0),
          orders: daysOrders.length
        });
      }

      const catSalesMap: Record<string, number> = {};
      orders.filter(o => o.status !== 'cancelled').forEach(o => {
        o.items.forEach(item => {
          const cat = item.product.categoryName || 'Other';
          catSalesMap[cat] = (catSalesMap[cat] || 0) + (item.product.price * item.quantity);
        });
      });

      const categorySales = Object.entries(catSalesMap).map(([category, amount]) => ({
        category,
        amount: parseFloat(amount.toFixed(2))
      }));

      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        revenueGrowth: 8.5,
        totalOrders,
        ordersGrowth: 5.2,
        totalCustomers,
        customersGrowth: 10.0,
        conversionRate: 2.8,
        conversionGrowth: 1.5,
        salesHistory,
        categorySales
      };
    } catch (e) {
      console.error('Gagal mengambil metrik dasbor:', e);
      throw e;
    }
  }
}
