import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Author, ApiResponse } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { isAdminSession } from '../auth/session.util';

@Injectable({
  providedIn: 'root'
})
export class AuthorApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  private authorCache: { data: Author[]; ts: number } | null = null;
  private readonly AUTHOR_TTL_MS = 5 * 60 * 1000;

  async getAuthors(): Promise<Author[]> {
    const now = Date.now();
    const isAdmin = isAdminSession();

    if (!isAdmin && this.authorCache && now - this.authorCache.ts < this.AUTHOR_TTL_MS) {
      return this.authorCache.data;
    }
    try {
      const endpoint = isAdmin ? `${this.BASE_URL}/admin/Authors` : `${this.BASE_URL}/public/Authors`;
      const envelope = await firstValueFrom(this.http.get<ApiResponse<Author[]>>(endpoint));
      const list = envelope?.data || [];
      const data = list.map((a: Author) => ({
        id: a.id,
        name: a.name,
        role: a.role || '',
        biography: a.biography || '',
        photoUrl: a.photoUrl || ''
      }));
      if (!isAdmin) {
        this.authorCache = { data, ts: now };
      }
      return data;
    } catch (e) {
      this.logger.error('AuthorApiService.getAuthors', 'Gagal mengambil author:', e);
      return [];
    }
  }

  private invalidateAuthorCache() {
    this.authorCache = null;
  }

  async saveAuthor(author: Partial<Author>): Promise<Author> {
    const isNew = !author.id;
    const body: Partial<Author> = {
      name: author.name,
      role: author.role || '',
      biography: author.biography || '',
      photoUrl: author.photoUrl || ''
    };

    try {
      let result: Author;
      if (isNew) {
        const envelope = await firstValueFrom(this.http.post<ApiResponse<Author>>(`${this.BASE_URL}/admin/Authors`, body));
        result = envelope?.data;
      } else {
        body.id = author.id;
        const envelope = await firstValueFrom(this.http.put<ApiResponse<Author>>(`${this.BASE_URL}/admin/Authors/${author.id}`, body));
        result = envelope?.data;
      }
      this.invalidateAuthorCache();
      return result;
    } catch (e) {
      this.logger.error('AuthorApiService.saveAuthor', 'Gagal menyimpan author:', e);
      throw e;
    }
  }

  async deleteAuthor(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BASE_URL}/admin/Authors/${id}`));
      this.invalidateAuthorCache();
      return true;
    } catch (e) {
      this.logger.error('AuthorApiService.deleteAuthor', `Gagal menghapus author ${id}:`, e);
      return false;
    }
  }
}
