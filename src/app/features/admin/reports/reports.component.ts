import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ButtonComponent, IconComponent],
  template: `
    <div class="animate-fade-in flex flex-col gap-6 max-w-3xl">
      <!-- Title header -->
      <div>
        <h1 class="font-display font-extrabold text-slate-800 text-xl">Analytics & Reports</h1>
        <p class="text-xs text-slate-400 mt-0.5">Generate and download structured CSV reports from your e-commerce database logs</p>
      </div>

      <!-- Reports grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <!-- Sales Report Card -->
        <div class="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="p-3 bg-primary-50 rounded-xl text-primary-600">
              <app-icon name="bar-chart" size="20"></app-icon>
            </div>
            <div class="flex flex-col gap-0.5">
              <h3 class="font-display font-bold text-slate-800 text-xs">Sales Revenue Report</h3>
              <p class="text-[10px] text-slate-400 leading-relaxed">Breakdown of total transaction orders, shipping charges, sales taxes, and applied promos.</p>
            </div>
          </div>
          <app-button (click)="downloadSalesReport()" [loading]="salesLoading()" variant="outline" size="sm" class="self-start">
            <app-icon name="chevron-down" size="12"></app-icon>
            Download CSV
          </app-button>
        </div>

        <!-- Inventory Report Card -->
        <div class="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="p-3 bg-sky-50 rounded-xl text-sky-600">
              <app-icon name="book-open" size="20"></app-icon>
            </div>
            <div class="flex flex-col gap-0.5">
              <h3 class="font-display font-bold text-slate-800 text-xs">Products Inventory Report</h3>
              <p class="text-[10px] text-slate-400 leading-relaxed">Active products counts, available stock logs, prices, average reviews rating and categories.</p>
            </div>
          </div>
          <app-button (click)="downloadInventoryReport()" [loading]="invLoading()" variant="outline" size="sm" class="self-start">
            <app-icon name="chevron-down" size="12"></app-icon>
            Download CSV
          </app-button>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {
  private readonly apiService = inject(ApiService);
  private readonly toastService = inject(ToastService);

  salesLoading = signal<boolean>(false);
  invLoading = signal<boolean>(false);

  async downloadSalesReport() {
    this.salesLoading.set(true);
    try {
      const orders = await this.apiService.getOrders();
      
      // Build CSV Content
      const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Subtotal', 'Tax', 'Shipping', 'Total', 'Status', 'Date'];
      const rows = orders.map(o => [
        o.id,
        o.userName,
        o.userEmail,
        o.subtotal.toFixed(2),
        o.tax.toFixed(2),
        o.shippingCost.toFixed(2),
        o.total.toFixed(2),
        o.status,
        o.orderDate
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      this.triggerDownload(csvContent, 'sales-revenue-report.csv');
      this.toastService.success('Sales report downloaded successfully!');
    } catch (e) {
      this.toastService.error('Failed to generate sales report.');
    } finally {
      this.salesLoading.set(false);
    }
  }

  async downloadInventoryReport() {
    this.invLoading.set(true);
    try {
      const products = await this.apiService.getProducts();

      const headers = ['Product ID', 'Name', 'Brand', 'Category', 'Price', 'Original Price', 'Stock Level', 'Rating', 'Reviews Count'];
      const rows = products.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.brand,
        p.categoryName,
        p.price.toFixed(2),
        (p.originalPrice || p.price).toFixed(2),
        p.stock,
        p.rating,
        p.reviewsCount
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      this.triggerDownload(csvContent, 'products-inventory-report.csv');
      this.toastService.success('Inventory report downloaded successfully!');
    } catch (e) {
      this.toastService.error('Failed to generate inventory report.');
    } finally {
      this.invLoading.set(false);
    }
  }

  private triggerDownload(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
