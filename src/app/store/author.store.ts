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
      this.toastService.error('Failed to load authors.');
    }
  }

  async saveAuthor(author: Partial<Author>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const saved = await this.authorApi.saveAuthor(author);
      await this.loadAuthors();
      this.toastService.success(`Author "${saved.name}" saved successfully!`);
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to save author.');
    }
  }

  async deleteAuthor(id: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const success = await this.authorApi.deleteAuthor(id);
      if (success) {
        await this.loadAuthors();
        this.toastService.success('Author deleted successfully.');
      } else {
        this.state.update(s => ({ ...s, loading: false }));
        this.toastService.error('Author not found.');
      }
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Failed to delete author.');
    }
  }
}
