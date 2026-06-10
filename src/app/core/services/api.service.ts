import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, Category, User, Order, Review, DashboardMetrics, Address, Complaint, CreateComplaintPayload, RespondComplaintPayload, RegisterPayload } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getStoredSessionUser, isAdminSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = environment.apiBaseUrl;
  private readonly AUTH_URL = environment.authUrl;

  private categoryCache: { data: import('../models').Category[]; ts: number } | null = null;
  private readonly CATEGORY_TTL_MS = 5 * 60 * 1000; // 5 menit

  // --- HELPER UNTUK OAUTH2 / CONNECT TOKEN ---
  async loginAndGetToken(username: string, password: string): Promise<string | null> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'MalakaBooks-FE');
    body.set('client_secret', 'MalakaBooks-FE');
    body.set('username', username);
    body.set('password', password);
    body.set('scope', 'Create Update Delete Read offline_access MalakaBooks_Scope General_Scope');

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

  /** Map a backend role string to the app's role union. */
  private normalizeRole(role: unknown): 'admin' | 'customer' {
    const r = typeof role === 'string' ? role.toLowerCase() : '';
    return r === 'malaka-admin' || r === 'admin' ? 'admin' : 'customer';
  }

  // --- BOOK TO PRODUCT MAPPER ---
  private mapBookToProduct(book: any): Product {
    return {
      id: book.id,
      name: book.title,
      description: book.description || '',
      price: book.price,
      categoryId: book.categoryId,
      categoryName: '',
      stock: book.stock ?? 0,
      rating: book.averageRating ?? 0,
      reviewsCount: book.totalReviews ?? 0,
      images: book.coverImage ? [book.coverImage] : [],
      brand: book.publisher || '',
      featured: false,
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
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/Books` : `${this.BASE_URL}/public/Books`;
      const envelope = await firstValueFrom(this.http.get<any>(endpoint));
      const books = envelope?.data || [];
      const categories = await this.getCategories();
      const catMap = new Map(categories.map(c => [c.id, c.name]));
      
      return books.map((b: any) => ({
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
      const endpoint = isAdminSession() ? `${this.BASE_URL}/admin/Books/${id}` : `${this.BASE_URL}/public/Books/${id}`;
      const envelope = await firstValueFrom(this.http.get<any>(endpoint));
      const book = envelope?.data;
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
        const envelope = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/admin/Books`, body));
        return this.mapBookToProduct(envelope?.data);
      } else {
        const envelope = await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/admin/Books/${product.id}`, body));
        return this.mapBookToProduct(envelope?.data);
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
    const now = Date.now();
    const isAdmin = isAdminSession();

    if (!isAdmin && this.categoryCache && now - this.categoryCache.ts < this.CATEGORY_TTL_MS) {
      return this.categoryCache.data;
    }
    try {
      const endpoint = isAdmin ? `${this.BASE_URL}/admin/Categories` : `${this.BASE_URL}/public/Categories`;
      const envelope = await firstValueFrom(this.http.get<any>(endpoint));
      const list = envelope?.data || [];
      const data = list.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: c.icon || 'book',
        description: c.description || ''
      }));
      if (!isAdmin) {
        this.categoryCache = { data, ts: now };
      }
      return data;
    } catch (e) {
      console.error('Gagal mengambil kategori:', e);
      return [];
    }
  }

  private invalidateCategoryCache() {
    this.categoryCache = null;
  }

  async saveCategory(category: Category): Promise<Category> {
    const isNew = !category.id || category.id.startsWith('cat-');
    const body: any = {
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: category.description || '',
      icon: category.icon || 'book'
    };

    try {
      let result: Category;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/admin/Categories`, body));
        result = envelope?.data;
      } else {
        body.id = category.id;
        const envelope = await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/admin/Categories/${category.id}`, body));
        result = envelope?.data;
      }
      this.invalidateCategoryCache();
      return result;
    } catch (e) {
      console.error('Gagal menyimpan kategori:', e);
      throw e;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Categories/${id}`));
      this.invalidateCategoryCache();
      return true;
    } catch (e) {
      console.error(`Gagal menghapus kategori ${id}:`, e);
      return false;
    }
  }

  // --- REVIEWS API ---
  async getReviewsByProductId(productId: string): Promise<Review[]> {
    try {
      const currentUser = getStoredSessionUser();

      const envelope = await firstValueFrom(
        this.http.get<any>(`${this.BASE_URL}/customer/Reviews/book/${productId}`)
      );
      const reviews = envelope?.data || [];

      return reviews.map((r: any) => ({
        id: r.id,
        productId: r.bookId,
        userName: currentUser?.id === r.userId ? (currentUser?.name || 'Customer') : 'Customer',
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
    const currentUser = getStoredSessionUser();
    if (!currentUser) throw new Error('User not authenticated');

    // Cari orderId nyata: ambil order user yang mengandung produk ini
    let orderId = '';
    try {
      const envelope = await firstValueFrom(
        this.http.get<any>(`${this.BASE_URL}/customer/Orders/user/${currentUser.id}`)
      );
      const orders = envelope?.data || [];
      const matchingOrder = orders.find((o: any) =>
        o.items?.some((item: any) => item.bookId === review.productId)
      );
      if (matchingOrder) orderId = matchingOrder.id;
    } catch {
      // orderId tetap kosong; backend akan menolak jika wajib
    }

    const body = {
      userId: currentUser.id,
      bookId: review.productId,
      orderId,
      rating: review.rating,
      comment: review.comment
    };

    const res = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Reviews`, body));
    const data = res?.data;
    return {
      id: data.id,
      productId: data.bookId,
      userName: currentUser.name || 'Customer',
      rating: data.rating,
      comment: data.comment,
      date: data.createdAt
    };
  }

  // --- ADDRESSES API HELPER ---
  async getAddressesByUserId(userId: string): Promise<Address[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Addresses/user/${userId}`));
      const list = envelope?.data || [];
      return list.map((addr: any) => ({
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
  async register(payload: RegisterPayload): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.BASE_URL}/customer/Users`, payload)
    );
  }

  async getUsers(): Promise<User[]> {
    const currentUser = getStoredSessionUser();
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      try {
        const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/admin/Users`));
        const list = envelope?.data || [];
        return list.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
          email: u.email || '',
          // Reflect the real backend role instead of hard-coding 'customer',
          // so the Users table shows accurate ADMIN/CUSTOMER badges.
          role: this.normalizeRole(u.role),
          phone: u.phone || '',
          avatar: u.avatar || '',
          joinedAt: u.createdAt,
          addresses: []
        }));
      } catch (e) {
        console.error('Gagal mengambil semua user (admin):', e);
        return [];
      }
    } else {
      const user = await this.getUserById(currentUser.id);
      return user ? [user] : [];
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Users/${id}/profile`));
      const userRes = envelope?.data;
      if (!userRes) return undefined;
      const addresses = await this.getAddressesByUserId(id);
      return {
        id: userRes.id,
        name: `${userRes.firstName || ''} ${userRes.lastName || ''}`.trim() || 'User',
        email: userRes.email || '',
        role: this.normalizeRole(userRes.role),
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
    const nameParts = (user.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const profileBody = {
      firstName: firstName,
      lastName: lastName,
      avatar: user.avatar || ''
    };

    try {
      // 1. Simpan Profil User
      await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/customer/Users/${user.id}/profile`, profileBody));
      
      // 2. Sinkronisasi Alamat User
      const backendAddresses = await this.getAddressesByUserId(user.id);
      const backendAddrMap = new Map(backendAddresses.map(a => [a.id, a]));
      
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
          await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Addresses`, addressBody));
        } else {
          await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/customer/Addresses/${addr.id}`, addressBody));
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

      // Ambil alamat terbaru dari backend untuk mendapatkan ID yang sebenarnya
      const updatedAddresses = await this.getAddressesByUserId(user.id);

      return {
        ...user,
        addresses: updatedAddresses
      };
    } catch (e) {
      console.error('Gagal menyimpan user/alamat:', e);
      throw e;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.put(`${this.BASE_URL}/admin/Orders/${id}/status`, { status }));
      return true;
    } catch (e) {
      console.error(`Gagal update status order ${id}:`, e);
      return false;
    }
  }

  // --- CART API ---
  async getCart(userId: string): Promise<{ bookId: string; quantity: number }[]> {
    try {
      const res = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Cart/${userId}`));
      return (res?.data?.items || []).map((item: any) => ({ bookId: item.bookId, quantity: item.quantity }));
    } catch (e) {
      console.error('Gagal mengambil cart:', e);
      return [];
    }
  }

  async addCartItem(userId: string, bookId: string, quantity: number): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BASE_URL}/customer/Cart`, { userId, bookId, quantity }));
      return true;
    } catch (e) {
      console.error('Gagal menambah item cart:', e);
      return false;
    }
  }

  async removeCartItem(userId: string, bookId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/customer/Cart/${userId}/items/${bookId}`));
      return true;
    } catch (e) {
      console.error('Gagal menghapus item cart:', e);
      return false;
    }
  }

  // --- ORDERS API ---
  async getOrders(): Promise<Order[]> {
    const currentUser = getStoredSessionUser();
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      try {
        const [ordersEnvelope, users] = await Promise.all([
          firstValueFrom(this.http.get<any>(`${this.BASE_URL}/admin/Orders`)) || Promise.resolve({ data: [] }),
          this.getUsers()
        ]);
        const ordersRes = ordersEnvelope?.data || [];
        const userMap = new Map(users.map(u => [u.id, u]));

        return ordersRes.map((res: any) => {
          const u = userMap.get(res.userId);
          return {
            id: res.id,
            userId: res.userId,
            userName: u ? u.name : 'Unknown User',
            userEmail: u ? (u.email || u.phone || 'No Contact') : '',
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
              name: u ? u.name : 'Customer Address',
              phone: u ? u.phone || '' : '',
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
          };
        });
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
      const ordersResRaw = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Orders/user/${userId}`));
      const ordersRes = ordersResRaw?.data || [];
      const addresses = await this.getAddressesByUserId(userId);
      
      const addrMap = new Map(addresses.map(a => [a.id, a]));
      
      return (ordersRes || []).map((res: any) => {
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
      const placed = res?.data;
      
      return {
        id: placed.id,
        userId: placed.userId,
        userName: order.userName,
        userEmail: order.userEmail,
        items: order.items,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentDetails: order.paymentDetails,
        status: placed.status as any,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        total: Number(placed.totalPrice) || order.total,
        orderDate: placed.createdAt
      };
    } catch (e) {
      console.error('Gagal membuat order:', e);
      throw e;
    }
  }

  // --- COMPLAINTS API ---
  private mapComplaint(c: any): Complaint {
    return {
      id: c.id,
      userId: c.userId,
      orderId: c.orderId,
      subject: c.subject,
      description: c.description,
      status: c.status,
      adminResponse: c.adminResponse || '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    };
  }

  async getComplaintsByUser(userId: string): Promise<Complaint[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Complaints/user/${userId}`));
      const list = envelope?.data || [];
      return list.map((c: any) => this.mapComplaint(c));
    } catch (e) {
      console.error('Gagal mengambil complaints user:', e);
      return [];
    }
  }

  async createComplaint(payload: CreateComplaintPayload): Promise<Complaint> {
    const res = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Complaints`, payload));
    return this.mapComplaint(res?.data);
  }

  async getAllComplaints(): Promise<Complaint[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/admin/Complaints`));
      const list = envelope?.data || [];
      return list.map((c: any) => this.mapComplaint(c));
    } catch (e) {
      console.error('Gagal mengambil semua complaints (admin):', e);
      return [];
    }
  }

  async respondComplaint(id: string, payload: RespondComplaintPayload): Promise<Complaint> {
    const res = await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/admin/Complaints/${id}/respond`, payload));
    return this.mapComplaint(res?.data);
  }

  // --- DASHBOARD METRICS ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [products, categories, orders, users] = await Promise.all([
      this.getProducts(),
      this.getCategories(),
      this.getOrders(),
      this.getUsers()
    ]);

    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalCustomers = users.length;

    // Growth: bandingkan 7 hari terakhir vs 7 hari sebelumnya
    const now = new Date();
    const msDay = 86_400_000;
    const last7 = activeOrders.filter(o => now.getTime() - new Date(o.orderDate).getTime() <= 7 * msDay);
    const prev7 = activeOrders.filter(o => {
      const diff = now.getTime() - new Date(o.orderDate).getTime();
      return diff > 7 * msDay && diff <= 14 * msDay;
    });

    const calcGrowth = (curr: number, prev: number) =>
      prev === 0 ? 0 : parseFloat(((curr - prev) / prev * 100).toFixed(1));

    const revenueGrowth = calcGrowth(
      last7.reduce((s, o) => s + o.total, 0),
      prev7.reduce((s, o) => s + o.total, 0)
    );
    const ordersGrowth = calcGrowth(last7.length, prev7.length);

    // Sales history — 7 hari terakhir
    const salesHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayOrders = activeOrders.filter(o =>
        new Date(o.orderDate).toDateString() === d.toDateString()
      );
      salesHistory.push({
        date: dateStr,
        amount: parseFloat(dayOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
        orders: dayOrders.length
      });
    }

    // Category sales
    const catSalesMap: Record<string, number> = {};
    activeOrders.forEach(o => {
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
      revenueGrowth,
      totalOrders,
      ordersGrowth,
      totalCustomers,
      customersGrowth: 0,
      conversionRate: totalOrders > 0 && products.length > 0
        ? parseFloat((totalOrders / products.length).toFixed(2))
        : 0,
      conversionGrowth: 0,
      salesHistory,
      categorySales,
      // Surface the most recent orders here so the dashboard does not have to
      // issue a second getOrders() round-trip (which re-fetches users/addresses).
      recentOrders: orders.slice(0, 4)
    };
  }
}
