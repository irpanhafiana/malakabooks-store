import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-card.html'
})
export class CategoryCardComponent {
  @Input({ required: true }) category!: Category;
}
