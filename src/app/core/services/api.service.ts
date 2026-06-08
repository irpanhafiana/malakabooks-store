import { Injectable } from '@angular/core';
import { Product, Category, User, Order, Review, DashboardMetrics } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly STORAGE_KEY_PREFIX = 'malakabooks_';
  private readonly DELAY_MS = 600; // Simulates network latency

  constructor() {
    this.seedDatabase();
  }

  // --- MOCK DATABASE SEEDING ---
  private seedDatabase(): void {
    if (!localStorage.getItem(this.key('categories'))) {
      const defaultCategories: Category[] = [
        { id: 'cat-1', name: 'Literature & Fiction', slug: 'literature-fiction', icon: 'book-open' },
        { id: 'cat-2', name: 'Science & Technology', slug: 'science-tech', icon: 'cpu' },
        { id: 'cat-3', name: 'Premium Stationery', slug: 'stationery', icon: 'pen-tool' },
        { id: 'cat-4', name: 'Digital & Audiobooks', slug: 'digital-audio', icon: 'headphones' },
        { id: 'cat-5', name: 'E-Readers & Accessories', slug: 'ereaders-acc', icon: 'tablet' }
      ];
      this.setItem('categories', defaultCategories);
    }

    if (!localStorage.getItem(this.key('products'))) {
      const defaultProducts: Product[] = [
        {
          id: 'prod-1',
          name: 'The Midnight Library',
          description: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. Nora Seed finds herself faced with this decision as she travels through the Midnight Library to find what is truly fulfilling in life.',
          price: 14.99,
          originalPrice: 19.99,
          images: [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=800&q=80',
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&h=800&q=80'
          ],
          categoryId: 'cat-1',
          categoryName: 'Literature & Fiction',
          stock: 45,
          rating: 4.6,
          reviewsCount: 124,
          featured: true,
          brand: 'Canongate Books',
          specifications: {
            'Author': 'Matt Haig',
            'Format': 'Hardcover',
            'Pages': '304 pages',
            'Language': 'English',
            'ISBN-10': '0525559477'
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'prod-2',
          name: 'Designing Data-Intensive Applications',
          description: 'Data is at the center of many challenges in system design today. Difficult issues need to be figured out, such as scalability, consistency, reliability, efficiency, and maintainability. Martin Kleppmann helps you navigate this diverse landscape by examining the pros and cons of various technologies for processing and storing data.',
          price: 38.50,
          originalPrice: 49.99,
          images: [
            'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&h=800&q=80',
            'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&h=800&q=80'
          ],
          categoryId: 'cat-2',
          categoryName: 'Science & Technology',
          stock: 18,
          rating: 4.9,
          reviewsCount: 512,
          featured: true,
          brand: 'O\'Reilly Media',
          specifications: {
            'Author': 'Martin Kleppmann',
            'Format': 'Paperback',
            'Pages': '616 pages',
            'Language': 'English',
            'ISBN-10': '1449373321'
          },
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'prod-3',
          name: 'Minimalist Leather Notebook A5',
          description: 'Handcrafted premium full-grain leather notebook with acid-free cream dotted paper. Designed for thinkers, designers, and creators who value tactile feedback and timeless quality. Features an elastic closure, ribbon marker, and expandable inner pocket.',
          price: 24.00,
          images: [
            'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=600&h=800&q=80',
            'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&h=800&q=80'
          ],
          categoryId: 'cat-3',
          categoryName: 'Premium Stationery',
          stock: 80,
          rating: 4.8,
          reviewsCount: 89,
          featured: true,
          brand: 'Malaka Craft',
          specifications: {
            'Material': 'Full-grain Leather',
            'Paper Type': '120 GSM Dotted',
            'Pages': '192 pages',
            'Size': 'A5 (5.8 x 8.3 inches)'
          },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'prod-4',
          name: 'Audiobook: Dune Saga (Complete)',
          description: 'Immerse yourself in the masterpiece science fiction epic. This complete audiobook features a full dramatic cast reading, bringing the complex desert world of Arrakis and the journeys of Paul Atreides to life with rich soundscapes and professional narration.',
          price: 29.99,
          originalPrice: 45.00,
          images: [
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&h=800&q=80'
          ],
          categoryId: 'cat-4',
          categoryName: 'Digital & Audiobooks',
          stock: 999, // Digital products have high stock
          rating: 4.7,
          reviewsCount: 204,
          featured: false,
          brand: 'Macmillan Audio',
          specifications: {
            'Narrator': 'Full Cast',
            'Duration': '21 hours 12 mins',
            'Format': 'High Quality MP3 / M4B',
            'Publisher': 'Audible Studios'
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'prod-5',
          name: 'Malaka Paperwhite E-Reader 6.8"',
          description: 'A custom, glare-free 6.8-inch display e-reader with 300 ppi resolution. Features an adjustable warm light, up to 10 weeks of battery life, and 20% faster page turns. IPX8 waterproof rating lets you read comfortably by the pool or in the bath.',
          price: 139.99,
          originalPrice: 159.99,
          images: [
            'https://images.unsplash.com/photo-1592496001020-d31bd830651f?auto=format&fit=crop&w=600&h=800&q=80',
            'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&h=800&q=80'
          ],
          categoryId: 'cat-5',
          categoryName: 'E-Readers & Accessories',
          stock: 12,
          rating: 4.5,
          reviewsCount: 64,
          featured: true,
          brand: 'Malaka Tech',
          specifications: {
            'Display': '6.8-inch Paperwhite Paper Tech',
            'Storage': '16 GB',
            'Battery': 'Up to 10 weeks',
            'Waterproof': 'IPX8',
            'Weight': '205g'
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'prod-6',
          name: 'Classic Fountain Pen - Matte Black',
          description: 'An exceptionally balanced fountain pen crafted with a matte black brass body and a 24k gold-plated fine nib. Perfect for smooth, consistent ink flow. Includes an international ink converter and 3 black ink cartridges in a gift box.',
          price: 42.00,
          images: [
            'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&h=800&q=80'
          ],
          categoryId: 'cat-3',
          categoryName: 'Premium Stationery',
          stock: 25,
          rating: 4.6,
          reviewsCount: 37,
          featured: false,
          brand: 'Malaka Craft',
          specifications: {
            'Nib Size': 'Fine (0.5mm)',
            'Body Material': 'Lacquered Brass',
            'Ink System': 'Converter / Cartridges',
            'Weight': '32g'
          },
          createdAt: new Date().toISOString()
        },
        {
          id: 'prod-7',
          name: 'Atomic Habits',
          description: 'No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.',
          price: 16.20,
          originalPrice: 27.00,
          images: [
            'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&h=800&q=80'
          ],
          categoryId: 'cat-1',
          categoryName: 'Literature & Fiction',
          stock: 110,
          rating: 4.8,
          reviewsCount: 940,
          featured: true,
          brand: 'Penguin Books',
          specifications: {
            'Author': 'James Clear',
            'Format': 'Paperback',
            'Pages': '320 pages',
            'Language': 'English',
            'ISBN-10': '0735211299'
          },
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'prod-8',
          name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. Renowned software expert Robert C. Martin presents a revolutionary paradigm with Clean Code.',
          price: 44.99,
          originalPrice: 54.99,
          images: [
            'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=600&h=800&q=80'
          ],
          categoryId: 'cat-2',
          categoryName: 'Science & Technology',
          stock: 32,
          rating: 4.7,
          reviewsCount: 310,
          featured: false,
          brand: 'Prentice Hall',
          specifications: {
            'Author': 'Robert C. Martin',
            'Format': 'Paperback',
            'Pages': '464 pages',
            'Language': 'English',
            'ISBN-10': '0132350882'
          },
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      this.setItem('products', defaultProducts);
    }

    if (!localStorage.getItem(this.key('users'))) {
      const defaultUsers: User[] = [
        {
          id: 'user-1',
          name: 'Dewi Lestari',
          email: 'customer@example.com',
          role: 'customer',
          phone: '+628123456789',
          joinedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          addresses: [
            {
              id: 'addr-1',
              name: 'Home Address',
              phone: '+628123456789',
              street: 'Jl. Kemang Raya No. 45',
              city: 'Jakarta Selatan',
              province: 'DKI Jakarta',
              postalCode: '12730',
              isDefault: true
            },
            {
              id: 'addr-2',
              name: 'Office Address',
              phone: '+628129999888',
              street: 'Sudirman Central Business District (SCBD) Tower 3B, Fl. 12',
              city: 'Jakarta Selatan',
              province: 'DKI Jakarta',
              postalCode: '12190',
              isDefault: false
            }
          ]
        },
        {
          id: 'user-2',
          name: 'Ahmad Malaka',
          email: 'admin@example.com',
          role: 'admin',
          phone: '+628111222333',
          joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          addresses: []
        }
      ];
      this.setItem('users', defaultUsers);
    }

    if (!localStorage.getItem(this.key('reviews'))) {
      const defaultReviews: Review[] = [
        {
          id: 'rev-1',
          productId: 'prod-1',
          userName: 'Rian Andriani',
          rating: 5,
          comment: 'Absolutely fell in love with this book. It makes you appreciate the choices and the life you have right now. Truly beautiful writing!',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'rev-2',
          productId: 'prod-1',
          userName: 'Budi Santoso',
          rating: 4,
          comment: 'Interesting concept and highly readable. Matt Haig never disappoints. A bit predictable near the end but worth it.',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'rev-3',
          productId: 'prod-2',
          userName: 'Eko Wijaya',
          rating: 5,
          comment: 'The absolute bible for system design. If you design software, read this book immediately. It covers databases, indexes, partitioning, replication and everything in between in deep details.',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      this.setItem('reviews', defaultReviews);
    }

    if (!localStorage.getItem(this.key('orders'))) {
      // Create some initial completed orders to populate dashboards
      const defaultOrders: Order[] = [
        {
          id: 'order-1001',
          userId: 'user-1',
          userName: 'Dewi Lestari',
          userEmail: 'customer@example.com',
          items: [
            {
              product: {
                id: 'prod-1',
                name: 'The Midnight Library',
                description: '',
                price: 14.99,
                images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=800&q=80'],
                categoryId: 'cat-1',
                categoryName: 'Literature & Fiction',
                stock: 45,
                rating: 4.6,
                reviewsCount: 124,
                featured: true,
                brand: 'Canongate Books',
                specifications: {},
                createdAt: ''
              },
              quantity: 2
            },
            {
              product: {
                id: 'prod-3',
                name: 'Minimalist Leather Notebook A5',
                description: '',
                price: 24.00,
                images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=600&h=800&q=80'],
                categoryId: 'cat-3',
                categoryName: 'Premium Stationery',
                stock: 80,
                rating: 4.8,
                reviewsCount: 89,
                featured: true,
                brand: 'Malaka Craft',
                specifications: {},
                createdAt: ''
              },
              quantity: 1
            }
          ],
          shippingAddress: {
            id: 'addr-1',
            name: 'Home Address',
            phone: '+628123456789',
            street: 'Jl. Kemang Raya No. 45',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postalCode: '12730',
            isDefault: true
          },
          paymentMethod: 'credit_card',
          paymentDetails: { cardLast4: '4321' },
          status: 'completed',
          subtotal: 53.98,
          shippingCost: 5.00,
          tax: 5.40,
          total: 64.38,
          orderDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          trackingNumber: 'TRK8273918A'
        },
        {
          id: 'order-1002',
          userId: 'user-1',
          userName: 'Dewi Lestari',
          userEmail: 'customer@example.com',
          items: [
            {
              product: {
                id: 'prod-2',
                name: 'Designing Data-Intensive Applications',
                description: '',
                price: 38.50,
                images: ['https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&h=800&q=80'],
                categoryId: 'cat-2',
                categoryName: 'Science & Technology',
                stock: 18,
                rating: 4.9,
                reviewsCount: 512,
                featured: true,
                brand: 'O\'Reilly Media',
                specifications: {},
                createdAt: ''
              },
              quantity: 1
            }
          ],
          shippingAddress: {
            id: 'addr-1',
            name: 'Home Address',
            phone: '+628123456789',
            street: 'Jl. Kemang Raya No. 45',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postalCode: '12730',
            isDefault: true
          },
          paymentMethod: 'bank_transfer',
          paymentDetails: { bankName: 'Bank BCA' },
          status: 'shipped',
          subtotal: 38.50,
          shippingCost: 5.00,
          tax: 3.85,
          total: 47.35,
          orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          trackingNumber: 'TRK9982731B'
        }
      ];
      this.setItem('orders', defaultOrders);
    }
  }

  // --- LOCALSTORAGE UTILS ---
  private key(k: string): string {
    return `${this.STORAGE_KEY_PREFIX}${k}`;
  }

  private getItem<T>(key: string): T {
    const val = localStorage.getItem(this.key(key));
    return val ? JSON.parse(val) : [] as unknown as T;
  }

  private setItem<T>(key: string, value: T): void {
    localStorage.setItem(this.key(key), JSON.stringify(value));
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), this.DELAY_MS));
  }

  // --- PRODUCTS API ---
  async getProducts(): Promise<Product[]> {
    return this.delay(this.getItem<Product[]>('products'));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const products = this.getItem<Product[]>('products');
    return this.delay(products.find(p => p.id === id));
  }

  async saveProduct(product: Product): Promise<Product> {
    const products = this.getItem<Product[]>('products');
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = { ...product };
    } else {
      product.id = `prod-${Date.now()}`;
      product.createdAt = new Date().toISOString();
      products.push(product);
    }
    this.setItem('products', products);
    return this.delay(product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const products = this.getItem<Product[]>('products');
    const filtered = products.filter(p => p.id !== id);
    if (products.length !== filtered.length) {
      this.setItem('products', filtered);
      return this.delay(true);
    }
    return this.delay(false);
  }

  // --- CATEGORIES API ---
  async getCategories(): Promise<Category[]> {
    return this.delay(this.getItem<Category[]>('categories'));
  }

  async saveCategory(category: Category): Promise<Category> {
    const categories = this.getItem<Category[]>('categories');
    const index = categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      categories[index] = { ...category };
    } else {
      category.id = `cat-${Date.now()}`;
      category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      categories.push(category);
    }
    this.setItem('categories', categories);
    return this.delay(category);
  }

  async deleteCategory(id: string): Promise<boolean> {
    const categories = this.getItem<Category[]>('categories');
    const filtered = categories.filter(c => c.id !== id);
    if (categories.length !== filtered.length) {
      this.setItem('categories', filtered);
      return this.delay(true);
    }
    return this.delay(false);
  }

  // --- REVIEWS API ---
  async getReviewsByProductId(productId: string): Promise<Review[]> {
    const reviews = this.getItem<Review[]>('reviews');
    return this.delay(reviews.filter(r => r.productId === productId));
  }

  async addReview(review: Review): Promise<Review> {
    const reviews = this.getItem<Review[]>('reviews');
    review.id = `rev-${Date.now()}`;
    review.date = new Date().toISOString();
    reviews.push(review);
    this.setItem('reviews', reviews);

    // Update Product Rating
    const products = this.getItem<Product[]>('products');
    const prodIndex = products.findIndex(p => p.id === review.productId);
    if (prodIndex >= 0) {
      const prodReviews = reviews.filter(r => r.productId === review.productId);
      const totalRating = prodReviews.reduce((sum, r) => sum + r.rating, 0);
      products[prodIndex].rating = parseFloat((totalRating / prodReviews.length).toFixed(1));
      products[prodIndex].reviewsCount = prodReviews.length;
      this.setItem('products', products);
    }

    return this.delay(review);
  }

  // --- USERS API ---
  async getUsers(): Promise<User[]> {
    return this.delay(this.getItem<User[]>('users'));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const users = this.getItem<User[]>('users');
    return this.delay(users.find(u => u.id === id));
  }

  async saveUser(user: User): Promise<User> {
    const users = this.getItem<User[]>('users');
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...user };
    } else {
      user.id = `user-${Date.now()}`;
      user.joinedAt = new Date().toISOString();
      users.push(user);
    }
    this.setItem('users', users);
    return this.delay(user);
  }

  // --- ORDERS API ---
  async getOrders(): Promise<Order[]> {
    return this.delay(this.getItem<Order[]>('orders'));
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const orders = this.getItem<Order[]>('orders');
    return this.delay(orders.filter(o => o.userId === userId).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  }

  async saveOrder(order: Order): Promise<Order> {
    const orders = this.getItem<Order[]>('orders');
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      orders[index] = { ...order };
    } else {
      order.id = `order-${Math.floor(1000 + Math.random() * 9000)}`;
      order.orderDate = new Date().toISOString();
      order.trackingNumber = `TRK${Math.floor(10000000 + Math.random() * 90000000)}B`;
      orders.push(order);

      // Decrement product stock levels
      const products = this.getItem<Product[]>('products');
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.product.id);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
        }
      });
      this.setItem('products', products);
    }
    this.setItem('orders', orders);
    return this.delay(order);
  }

  // --- ANALYTICS / REPORTS API ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const orders = this.getItem<Order[]>('orders');
    const users = this.getItem<User[]>('users');
    
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
    const completedOrders = orders.filter(o => o.status !== 'cancelled');
    const totalOrders = orders.length;
    const totalCustomers = users.filter(u => u.role === 'customer').length;

    // Generate last 7 days of sales activity
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

    // Category Sales breakdown
    const catSalesMap: Record<string, number> = {};
    completedOrders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.product.categoryName || 'Other';
        catSalesMap[cat] = (catSalesMap[cat] || 0) + (item.product.price * item.quantity);
      });
    });

    const categorySales = Object.entries(catSalesMap).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }));

    return this.delay({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      revenueGrowth: 12.4, // Mock growth rate %
      totalOrders,
      ordersGrowth: 8.2,
      totalCustomers,
      customersGrowth: 15.1,
      conversionRate: 3.2,
      conversionGrowth: 2.1,
      salesHistory,
      categorySales
    });
  }
}
