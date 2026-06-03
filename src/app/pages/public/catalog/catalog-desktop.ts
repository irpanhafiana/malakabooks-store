import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogPage } from './catalog';
import { BookCardComponent } from '../../../shared/components/book-card/book-card';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-catalog-desktop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BookCardComponent,
    SearchBarComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  templateUrl: './catalog-desktop.html'
})
export class CatalogDesktopComponent {
  parent = input.required<CatalogPage>();
}
