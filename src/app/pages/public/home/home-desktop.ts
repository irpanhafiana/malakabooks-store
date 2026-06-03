import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HomePage } from './home';
import { BookCardComponent } from '../../../shared/components/book-card/book-card';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { CategoryCardComponent } from '../../../shared/components/category-card/category-card';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header';

@Component({
  selector: 'app-home-desktop',
  standalone: true,
  imports: [CommonModule, RouterLink, BookCardComponent, LoadingSpinnerComponent, CategoryCardComponent, SectionHeaderComponent],
  templateUrl: './home-desktop.html'
})
export class HomeDesktopComponent {
  parent = input.required<HomePage>();
}
