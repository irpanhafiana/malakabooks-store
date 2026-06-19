import { Component, input, output, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
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
export class SearchBarComponent implements OnInit, OnDestroy {
  readonly placeholder = input<string>('Search books, stationery...');
  readonly initialValue = input<string>('', { alias: 'value' });
  readonly autofocus = input<boolean>(false);
  readonly search = output<string>();

  searchQuery = '';
  private searchSubject = new Subject<string>();
  private subscription?: Subscription;

  ngOnInit() {
    this.searchQuery = this.initialValue();
    
    this.subscription = this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.search.emit(query.trim());
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.searchSubject.next(this.searchQuery);
    this.search.emit(this.searchQuery.trim());
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchSubject.next('');
    this.search.emit('');
  }
}
