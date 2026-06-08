import { Component } from '@angular/core';

@Component({
  selector: 'app-table',
  standalone: true,
  template: `
    <div class="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table class="w-full border-collapse text-left text-sm text-slate-600">
        <thead class="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
          <tr>
            <ng-content select="[table-headers]"></ng-content>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white text-slate-700">
          <ng-content select="[table-rows]"></ng-content>
        </tbody>
      </table>
    </div>
  `
})
export class TableComponent {}
