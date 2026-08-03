import { Injectable, inject, computed } from '@angular/core';
import { Author } from '../core/models';
import { AuthorApiService } from '../core/services/author-api.service';
import { BaseCrudStore, CrudApiService } from './utils/base-crud.store';

@Injectable({
  providedIn: 'root'
})
export class AuthorStore extends BaseCrudStore<Author> {
  private readonly authorApi = inject(AuthorApiService);
  protected readonly entityName = 'Penulis';

  protected readonly api: CrudApiService<Author> = {
    getAll: () => this.authorApi.getAuthors(),
    save: (author, file) => this.authorApi.saveAuthor(author, file),
    delete: (id) => this.authorApi.deleteAuthor(id)
  };

  readonly authors = computed(() => this.items());

  async loadAuthors() {
    return this.load();
  }

  async saveAuthor(author: Partial<Author>, photoFile?: File, options?: { showToast?: boolean }) {
    return this.save(author, photoFile, options);
  }

  async deleteAuthor(id: string, options?: { showToast?: boolean }) {
    return this.delete(id, options);
  }
}
