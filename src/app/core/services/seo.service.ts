import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoConfig {
  title: string;
  description: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  canonical?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);

  updatePage(config: SeoConfig): void {
    this.titleService.setTitle(config.title);

    this.metaService.updateTag({ name: 'description', content: config.description });
    
    // Open Graph
    this.metaService.updateTag({ property: 'og:title', content: config.title });
    this.metaService.updateTag({ property: 'og:description', content: config.description });
    
    if (config.ogImage) {
      this.metaService.updateTag({ property: 'og:image', content: config.ogImage });
    } else {
      this.metaService.removeTag("property='og:image'");
    }
    
    this.metaService.updateTag({ property: 'og:url', content: config.ogUrl || this.document.URL });
    this.metaService.updateTag({ property: 'og:type', content: config.ogType || 'website' });

    // Canonical link
    this.updateCanonicalLink(config.canonical || this.document.URL);
  }

  resetToDefaults(): void {
    this.updatePage({
      title: 'MalakaBooks Store - Pusat Belanja & Kebutuhan Terlengkap',
      description: 'MalakaBooks Store — Pusat belanja kebutuhan harian, buku, dan kopi terlengkap.',
    });
  }

  private updateCanonicalLink(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }
}
