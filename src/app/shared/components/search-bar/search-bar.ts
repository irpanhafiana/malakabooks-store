import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.html'
})
export class SearchBarComponent {
  @Input() placeholder = 'Cari sesuatu...';
  @Output() search = new EventEmitter<string>();

  query = '';

  onSubmit() {
    this.search.emit(this.query.trim());
  }

  clear() {
    this.query = '';
    this.search.emit('');
  }
}
