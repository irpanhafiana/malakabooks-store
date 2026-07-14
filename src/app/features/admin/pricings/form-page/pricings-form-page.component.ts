import { Component, inject, OnInit, signal, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PricingStore } from '../../../../store/pricing.store';
import { Pricing } from '../../../../core/models';
import { PricingsFormComponent } from '../form/pricings-form.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pricings-form-page',
  standalone: true,
  imports: [PricingsFormComponent, IconComponent, AdminButtonComponent],
  templateUrl: './pricings-form-page.component.html'
})
export class PricingsFormPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pricingStore = inject(PricingStore);

  @ViewChild(PricingsFormComponent) pricingsForm!: PricingsFormComponent;

  protected readonly editPricing = signal<Pricing | null>(null);
  protected readonly isEditing = signal(false);

  ngOnInit() {
    this.pricingStore.loadPricings();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      
      const pricing = this.pricingStore.pricings()?.find((p: Pricing) => p.id === id);
      if (pricing) {
        this.editPricing.set(pricing);
      } else {
        const checkInterval = setInterval(() => {
          const loadedPricing = this.pricingStore.pricings()?.find((p: Pricing) => p.id === id);
          if (loadedPricing) {
            this.editPricing.set(loadedPricing);
            clearInterval(checkInterval);
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 3000);
      }
    } else {
      this.isEditing.set(false);
      this.editPricing.set(null);
    }
  }

  onCancel() {
    this.router.navigate(['/admin/pricings']);
  }

  onSave() {
    this.router.navigate(['/admin/pricings']);
  }
}
