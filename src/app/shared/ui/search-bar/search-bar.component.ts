import { Component, input, output, OnInit, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
  readonly value = input<string>('');
  readonly autofocus = input<boolean>(false);
  readonly searchSubmit = output<string>();
  readonly inputChange = output<string>();

  searchQuery = '';
  private searchSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.searchQuery = this.value();
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((query) => {
      const trimmed = query.trim();
      this.inputChange.emit(trimmed);
    });
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const trimmed = this.searchQuery.trim();
    this.searchSubmit.emit(trimmed);
    this.inputChange.emit(trimmed);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchSubject.next('');
    this.searchSubmit.emit('');
    this.inputChange.emit('');
  }
}
