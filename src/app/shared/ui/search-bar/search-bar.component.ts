import { Component, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <form (submit)="onSubmit($event)" class="w-full relative">
      <div class="relative flex items-center w-full">
        <!-- Input search box with inner shadow and focus borders -->
        <input
          type="text"
          [(ngModel)]="searchQuery"
          name="query"
          [placeholder]="placeholder()"
          class="w-full border border-slate-100 bg-slate-50/70 focus:bg-white rounded-2xl py-2.5 pl-11 pr-16 text-sm placeholder-slate-400 text-slate-800 transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
        />
        <!-- Left search glass icon -->
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <app-icon name="search" size="18"></app-icon>
        </div>
        <!-- Right quick action search button -->
        <div class="absolute right-1.5 flex items-center">
          <button
            type="submit"
            class="px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition-colors cursor-pointer active:scale-95 shadow-sm shadow-primary-600/10"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  `
})
export class SearchBarComponent implements OnInit {
  readonly placeholder = input<string>('Search books, stationery...');
  readonly initialValue = input<string>('', { alias: 'value' });
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
