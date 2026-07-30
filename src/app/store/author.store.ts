import { Injectable, inject, signal, computed } from '@angular/core';
import { Author } from '../core/models';
import { AuthorApiService } from '../core/services/author-api.service';
import { ToastService } from '../core/services/toast.service';

interface AuthorState {
  authors: Author[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthorStore {
  private readonly authorApi = inject(AuthorApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<AuthorState>({
    authors: [],
    loading: false,
    error: null
  });

  readonly authors = computed(() => this.state().authors);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadAuthors() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const authors = await this.authorApi.getAuthors();
      this.state.update(s => ({ ...s, authors, loading: false, error: null }));
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat daftar author dari server.' }));
      this.toastService.error('Gagal memuat daftar penulis.');
    }
  }

  async saveAuthor(author: Partial<Author>, photoFile?: File) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.authorApi.saveAuthor(author, photoFile);
      await this.loadAuthors();
      this.toastService.success(`Penulis "${saved.name}" berhasil disimpan!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menyimpan penulis.');
    }
  }

  async deleteAuthor(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.authorApi.deleteAuthor(id);
      if (success) {
        await this.loadAuthors();
        this.toastService.success('Penulis berhasil dihapus.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Penulis tidak ditemukan.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal menghapus penulis.');
    }
  }
}
