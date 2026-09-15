import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-table',
  standalone: true,
  templateUrl: './table.component.html',
  })
export class TableComponent {}
