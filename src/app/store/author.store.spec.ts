import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthorStore } from './author.store';
import { AuthorApiService } from '../core/services/author-api.service';
import { ToastService } from '../core/services/toast.service';

describe('BaseCrudStore (via AuthorStore)', () => {
  let store: AuthorStore;
  let authorApiMock: Partial<AuthorApiService>;
  let toastMock: Partial<ToastService>;

  const mockAuthors = [
    { id: '1', name: 'Pramoedya Ananta Toer', role: 'Author', biography: '', photoUrl: '' }
  ];

  beforeEach(() => {
    authorApiMock = {
      getAuthors: vi.fn().mockResolvedValue(mockAuthors),
      saveAuthor: vi.fn().mockResolvedValue(mockAuthors[0]),
      deleteAuthor: vi.fn().mockResolvedValue(true)
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthorStore,
        { provide: AuthorApiService, useValue: authorApiMock },
        { provide: ToastService, useValue: toastMock }
      ]
    });

    store = TestBed.inject(AuthorStore);
  });

  it('should initialize with empty state', () => {
    expect(store.authors()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load items successfully', async () => {
    await store.loadAuthors();
    expect(store.authors()).toEqual(mockAuthors);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should handle save item successfully', async () => {
    await store.saveAuthor({ name: 'Pramoedya Ananta Toer' });
    expect(authorApiMock.saveAuthor).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith(expect.stringContaining('berhasil disimpan'));
  });

  it('should handle delete item successfully', async () => {
    await store.deleteAuthor('1');
    expect(authorApiMock.deleteAuthor).toHaveBeenCalledWith('1');
    expect(toastMock.success).toHaveBeenCalledWith(expect.stringContaining('berhasil dihapus'));
  });
});
