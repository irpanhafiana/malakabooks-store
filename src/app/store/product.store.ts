import { Injectable, inject, signal, computed } from '@angular/core';
import { Product, Category } from '../core/models';
import { ProductApiService } from '../core/services/product-api.service';
import { CategoryApiService } from '../core/services/category-api.service';
import { ToastService } from '../core/services/toast.service';

interface ProductState {
  products: Product[];
  categories: Category[];
  selectedCategoryId: string | null;
  selectedProductId: string | null;
  searchQuery: string;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  loading: boolean;
  error: string | null;
  activeProduct: Product | null;
  isQtyModalOpen: boolean;
  qtyQuantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductStore {
  private readonly productApi = inject(ProductApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<ProductState>({
    products: [],
    categories: [],
    selectedCategoryId: null,
    selectedProductId: null,
    searchQuery: '',
    sortBy: (typeof localStorage !== 'undefined' && 'sortBy' in localStorage) ? (localStorage.getItem('sortBy') as any) : 'featured', // Keep existing sort logic if any
    loading: false,
    error: null,
    activeProduct: null,
    isQtyModalOpen: false,
    qtyQuantity: 1
  });

  // Selectors
  readonly products = computed(() => this.state().products);
  readonly categories = computed(() => this.state().categories);
  readonly selectedCategoryId = computed(() => this.state().selectedCategoryId);
  readonly selectedProductId = computed(() => this.state().selectedProductId);
  readonly searchQuery = computed(() => this.state().searchQuery);
  readonly sortBy = computed(() => this.state().sortBy);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly activeProduct = computed(() => this.state().activeProduct);
  readonly isQtyModalOpen = computed(() => this.state().isQtyModalOpen);
  readonly qtyQuantity = computed(() => this.state().qtyQuantity);

  readonly activeSearchCategories = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];

    const matchingProducts = this.products().filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );

    const categoryIds = new Set(matchingProducts.map(p => p.categoryId));
    return this.categories().filter(c => categoryIds.has(c.id));
  });

  readonly featuredProducts = computed(() => {
    const featured = this.products().filter(p => p.featured);
    // API buku tidak punya flag "featured"; jika tidak ada yang ditandai,
    // tampilkan seluruh katalog (perilaku umum home e-commerce).
    return featured.length > 0 ? featured : this.products();
  });

  // Compute filters and sorting in real-time reactively
  readonly filteredProducts = computed(() => {
    let list = [...this.products()];
    const catId = this.selectedCategoryId();
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.sortBy();

    // 1. Filter by category
    if (catId) {
      list = list.filter(p => p.categoryId === catId);
    }

    // 2. Filter by search query
    if (query) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query)
      );
    }

    // 3. Sort products
    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else {
      // Default: featured first, then newest
      list.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return list;
  });

  constructor() {}

  async loadAll() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const [products, categories] = await Promise.all([
        this.productApi.getProducts(),
        this.categoryApi.getCategories()
      ]);
      this.state.update(s => ({ ...s, products, categories, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat produk dan kategori dari server.' }));
      this.toastService.error('Failed to load products and categories.');
    }
  }

  async loadProducts() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const products = await this.productApi.getProducts();
      this.state.update(s => ({ ...s, products, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat katalog produk dari server.' }));
      this.toastService.error('Failed to load products.');
    }
  }

  async loadCategories() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const categories = await this.categoryApi.getCategories();
      this.state.update(s => ({ ...s, categories, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat daftar kategori dari server.' }));
      this.toastService.error('Failed to load categories.');
    }
  }

  setCategoryFilter(categoryId: string | null) {
    this.state.update(s => ({ ...s, selectedCategoryId: categoryId }));
  }

  setSelectedProductId(id: string | null) {
    this.state.update(s => ({ ...s, selectedProductId: id }));
  }

  setSearchQuery(query: string) {
    this.state.update(s => ({ ...s, searchQuery: query, selectedCategoryId: null }));
  }

  setSortBy(sortBy: ProductState['sortBy']) {
    this.state.update(s => ({ ...s, sortBy }));
  }

  setActiveProduct(product: Product | null) {
    this.state.update(s => ({ ...s, activeProduct: product }));
  }

  setQtyModalOpen(isOpen: boolean) {
    this.state.update(s => ({ ...s, isQtyModalOpen: isOpen }));
  }

  setQtyQuantity(quantity: number) {
    this.state.update(s => ({ ...s, qtyQuantity: quantity }));
  }

  async saveProduct(product: Product) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.productApi.saveProduct(product);
      await this.loadProducts(); // Re-seed client list
      this.toastService.success(`Product "${saved.name}" saved successfully!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to save product.');
    }
  }

  async deleteProduct(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.productApi.deleteProduct(id);
      if (success) {
        await this.loadProducts();
        this.toastService.success('Product deleted successfully.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Product not found.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to delete product.');
    }
  }

  async saveCategory(category: Category) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.categoryApi.saveCategory(category);
      await this.loadCategories();
      this.toastService.success(`Category "${saved.name}" saved successfully!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to save category.');
    }
  }

  async deleteCategory(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.categoryApi.deleteCategory(id);
      if (success) {
        await this.loadCategories();
        this.toastService.success('Category deleted successfully.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Category not found.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to delete category.');
    }
  }
}
