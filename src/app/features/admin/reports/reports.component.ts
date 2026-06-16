import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { OrderApiService } from '../../../core/services/order-api.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { ToastService } from '../../../core/services/toast.service';
import { buildCsv, downloadCsv } from '../../../shared/util/csv.util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports',
  standalone: true,
  imports: [ButtonComponent, IconComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent {
  private readonly orderApi = inject(OrderApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly toastService = inject(ToastService);

  salesLoading = signal<boolean>(false);
  invLoading = signal<boolean>(false);

  async downloadSalesReport() {
    this.salesLoading.set(true);
    try {
      const orders = await this.orderApi.getOrders();
      
      // Build CSV Content — every cell is escaped + formula-injection-safe.
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

      downloadCsv(buildCsv(headers, rows), 'sales-revenue-report.csv');
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
      const products = await this.productApi.getProducts();

      const headers = ['Product ID', 'Name', 'Brand', 'Category', 'Price', 'Original Price', 'Stock Level', 'Rating', 'Reviews Count'];
      const rows = products.map(p => [
        p.id,
        p.name,
        p.brand,
        p.categoryName,
        p.price.toFixed(2),
        (p.originalPrice || p.price).toFixed(2),
        p.stock,
        p.rating,
        p.reviewsCount
      ]);

      downloadCsv(buildCsv(headers, rows), 'products-inventory-report.csv');
      this.toastService.success('Inventory report downloaded successfully!');
    } catch (e) {
      this.toastService.error('Failed to generate inventory report.');
    } finally {
      this.invLoading.set(false);
    }
  }
}
