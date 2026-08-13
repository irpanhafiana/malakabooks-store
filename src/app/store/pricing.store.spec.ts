import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PricingStore } from './pricing.store';
import { PricingApiService } from '../core/services/pricing-api.service';
import { AlertService } from '../core/services/alert.service';
import { Pricing } from '../core/models';

describe('PricingStore', () => {
  let store: PricingStore;
  const mockPricingApi = {
    getPricings: vi.fn(),
    savePricing: vi.fn(),
    deletePricing: vi.fn()
  };
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        PricingStore,
        { provide: PricingApiService, useValue: mockPricingApi },
        { provide: AlertService, useValue: mockToast }
      ]
    });
    store = TestBed.inject(PricingStore);
  });

  it('should create', () => {
    expect(store).toBeTruthy();
    expect(store.pricings()).toEqual([]);
    expect(store.loading()).toBe(false);
  });

  it('should load pricings successfully', async () => {
    const mockPricings: Pricing[] = [
      { id: '1', name: 'Standard Price', price: 15000 } as unknown as Pricing
    ];
    mockPricingApi.getPricings.mockResolvedValue(mockPricings);

    await store.loadPricings();

    expect(store.pricings()).toEqual(mockPricings);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should handle load error', async () => {
    mockPricingApi.getPricings.mockRejectedValue(new Error('API error'));

    await store.loadPricings();

    expect(store.pricings()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Gagal memuat pricings.');
    expect(mockToast.error).toHaveBeenCalledWith('Gagal memuat daftar harga.');
  });

  it('should save pricing successfully', async () => {
    const pricingData = { name: 'Promo Price', price: 12000 };
    const savedPricing = { id: '2', ...pricingData } as unknown as Pricing;
    
    mockPricingApi.savePricing.mockResolvedValue(savedPricing);
    mockPricingApi.getPricings.mockResolvedValue([savedPricing]);

    await store.savePricing(pricingData);

    expect(mockPricingApi.savePricing).toHaveBeenCalledWith(pricingData);
    expect(mockToast.success).toHaveBeenCalledWith('Pricing "Promo Price" berhasil disimpan!');
    expect(store.pricings()).toEqual([savedPricing]);
  });

  it('should handle save error', async () => {
    mockPricingApi.savePricing.mockRejectedValue(new Error('Save error'));

    await store.savePricing({ name: 'Failed Price' });

    expect(mockToast.error).toHaveBeenCalledWith('Gagal menyimpan pricing.');
  });

  it('should delete pricing successfully', async () => {
    mockPricingApi.deletePricing.mockResolvedValue(true);
    mockPricingApi.getPricings.mockResolvedValue([]);

    await store.deletePricing('1');

    expect(mockPricingApi.deletePricing).toHaveBeenCalledWith('1');
    expect(mockToast.success).toHaveBeenCalledWith('Pricing berhasil dihapus.');
  });

  it('should handle delete failure return value', async () => {
    mockPricingApi.deletePricing.mockResolvedValue(false);

    await store.deletePricing('1');

    expect(mockToast.error).toHaveBeenCalledWith('Pricing gagal dihapus.');
  });

  it('should handle delete error', async () => {
    mockPricingApi.deletePricing.mockRejectedValue(new Error('Delete error'));

    await store.deletePricing('1');

    expect(mockToast.error).toHaveBeenCalledWith('Gagal menghapus pricing.');
  });
});
