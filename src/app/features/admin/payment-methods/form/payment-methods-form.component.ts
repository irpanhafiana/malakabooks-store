import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Payment, PaymentFee } from '../../../../core/models';
import { PaymentStore } from '../../../../store/payment.store';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-payment-methods-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminSelectComponent, AdminButtonComponent, IconComponent, TooltipDirective],
  templateUrl: './payment-methods-form.component.html'
})
export class PaymentMethodsFormComponent {
  readonly payment = input<Payment | null>(null);
  readonly formCancel = output<void>();
  readonly save = output<void>();

  private readonly paymentStore = inject(PaymentStore);
  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);

  nameControl = new FormControl('', [Validators.required]);
  methodTypeControl = new FormControl('', [Validators.required]);
  
  feeTypeOptions = [
    { value: 'PERCENTAGE', label: 'Percentage (%)' },
    { value: 'FIXED', label: 'Fixed (Rp)' }
  ];

  feesArray = this.fb.array<FormGroup>([]);

  paymentForm = new FormGroup({
    name: this.nameControl,
    methodType: this.methodTypeControl,
    fees: this.feesArray
  });

  constructor() {
    effect(() => {
      const p = this.payment();
      this.feesArray.clear();
      
      if (p) {
        this.nameControl.setValue(p.name);
        this.methodTypeControl.setValue(p.methodType);
        
        if (p.fees && p.fees.length > 0) {
          p.fees.forEach(fee => {
            this.addFee(fee);
          });
        }
      } else {
        this.paymentForm.reset({ name: '', methodType: '' });
      }
    });
  }
  
  createFeeFormGroup(fee?: PaymentFee): FormGroup {
    return this.fb.group({
      code: [fee?.code || '', Validators.required],
      name: [fee?.name || '', Validators.required],
      type: [fee?.type || '', Validators.required],
      value: [fee?.value || 0, [Validators.required, Validators.min(0)]]
    });
  }

  addFee(fee?: PaymentFee) {
    this.feesArray.push(this.createFeeFormGroup(fee));
  }

  removeFee(index: number) {
    this.feesArray.removeAt(index);
  }

  async onSubmitForm() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const isConfirmed = await this.alertService.confirm(
      'Simpan Payment Method?',
      'Apakah Anda yakin ingin menyimpan perubahan data payment method ini?'
    );
    if (!isConfirmed) return;

    const pData: Partial<Payment> = {
      id: this.payment()?.id || '',
      name: this.nameControl.value || '',
      methodType: this.methodTypeControl.value || '',
      fees: this.feesArray.value.map((f: any) => ({
        code: f.code,
        name: f.name,
        type: f.type,
        value: Number(f.value)
      }))
    };

    await this.paymentStore.savePayment(pData, { showToast: false });
    this.alertService.success('Berhasil!', 'Data payment method berhasil disimpan.');
    this.save.emit();
  }
}
