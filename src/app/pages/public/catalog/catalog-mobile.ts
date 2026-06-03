import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogPage } from './catalog';
import { BookCardComponent } from '../../../shared/components/book-card/book-card';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { ButtonComponent } from '../../../shared/components/button/button';

@Component({
  selector: 'app-catalog-mobile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BookCardComponent,
    SearchBarComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ModalComponent,
    ButtonComponent
  ],
  templateUrl: './catalog-mobile.html'
})
export class CatalogMobileComponent {
  parent = input.required<CatalogPage>();
}
