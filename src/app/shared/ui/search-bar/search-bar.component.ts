import { Component, input, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent implements OnInit {
  readonly placeholder = input<string>('Search books, stationery...');
  readonly initialValue = input<string>('', { alias: 'value' });
  readonly autofocus = input<boolean>(false);
  readonly search = output<string>();

  searchQuery = '';

  ngOnInit() {
    this.searchQuery = this.initialValue();
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.search.emit(this.searchQuery.trim());
  }
}
