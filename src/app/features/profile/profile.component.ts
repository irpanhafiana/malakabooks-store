import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { User } from '../../core/models';
import { InputComponent } from '../../shared/ui/input/input.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { AlertService } from '../../core/services/alert.service';
import { LoggerService } from '../../core/services/logger.service';
import { UserApiService } from '../../core/services/user-api.service';
import { OrderApiService } from '../../core/services/order-api.service';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { ScreenService } from '../../core/services/screen.service';
import { OrderStore } from '../../store/order.store';
import { MyAddressesComponent } from './my-addresses/my-addresses.component';
import { OrderHistoryComponent } from '../order/order-history/order-history.component';
import { ComplaintComponent } from '../complaint/complaint.component';

export type ProfileTab = 'info' | 'addresses' | 'orders' | 'complaints' | 'password';

interface MenuItem {
  icon: string;
  label: string;
  action?: () => void;
  route?: string;
  isDanger?: boolean;
}

interface MenuSection {
  items: MenuItem[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputComponent,
    ButtonComponent,
    BottomSheetComponent,
    ModalComponent,
    MyAddressesComponent,
    OrderHistoryComponent,
    ComplaintComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  protected readonly screen = inject(ScreenService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly logger = inject(LoggerService);
  private readonly userApi = inject(UserApiService);
  private readonly orderApi = inject(OrderApiService);
  private readonly destroyRef = inject(DestroyRef);

  isProfileSaving = signal<boolean>(false);
  avatarPreview = signal<string>('');

  showEditProfile = signal<boolean>(false);
  showMockModal = signal<string | null>(null);

  activeTab = signal<ProfileTab>('info');

  // Menu configuration for clean looping in template
  menuSections: MenuSection[] = [
    {
      items: [
        { icon: 'bx-map', label: 'Alamat Saya', route: '/profile/addresses' },
        { icon: 'bx-key', label: 'Ganti Password', action: () => this.openChangePasswordModal() },
        { icon: 'bx-message-square-error', label: 'Komplain', route: '/complaints' },
        { icon: 'bx-package', label: 'Lacak Pesanan', route: '/order-history' }
      ]
    }
  ];

  // Order status counts
  pendingCount = signal<number>(0);
  processingCount = signal<number>(0);
  shippedCount = signal<number>(0);
  completedCount = signal<number>(0);

  // Latest order
  latestOrder = computed(() => {
    const orders = this.orderStore.orders();
    if (!orders || orders.length === 0) return null;
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0];
  });

  // Profile fields
  nameControl = new FormControl('', [Validators.required]);
  emailControl = new FormControl({ value: '', disabled: true });
  phoneControl = new FormControl('');

  profileForm = new FormGroup({
    name: this.nameControl,
    email: this.emailControl,
    phone: this.phoneControl
  });

  async ngOnInit() {
    const user = this.authStore.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const tabParam = this.route.snapshot.queryParams['tab'];
    if (tabParam && ['info', 'addresses', 'orders', 'complaints', 'password'].includes(tabParam)) {
      this.activeTab.set(tabParam as ProfileTab);
    }

    this.nameControl.setValue(user.name);
    this.emailControl.setValue(user.email);
    this.phoneControl.setValue(user.phone || '');
    this.avatarPreview.set(user.avatar || '');

    if (user.phone) {
      this.userApi.getExternalProfile(user.phone).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res: unknown) => {
          const r = res as { id?: string, data?: { id?: string } };
          if (r && r.id) {
            localStorage.setItem('externalProfileId', r.id);
          } else if (r && r.data && r.data.id) {
            localStorage.setItem('externalProfileId', r.data.id);
          }
        },
        error: (err) => this.logger.error('Failed to get external profile id:', err)
      });
    }

    // Load user orders
    this.orderStore.loadUserOrders(user.id);
    this.fetchStatusCounts(user.id);
  }

  private async fetchStatusCounts(userId: string) {
    const counts = await this.orderApi.getOrderStatusCounts(userId);
    if (counts) {
      this.pendingCount.set(counts['waitingForPaymentCount'] || 0);
      this.processingCount.set(counts['processCount'] || 0);
      this.shippedCount.set(counts['deliveryCount'] || 0);
      this.completedCount.set(counts['finishedCount'] || 0);
    }
  }

  showChangePasswordModal = signal<boolean>(false);
  isPasswordSaving = signal<boolean>(false);

  newPasswordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  confirmPasswordControl = new FormControl('', [Validators.required]);

  passwordForm = new FormGroup({
    newPassword: this.newPasswordControl,
    confirmPassword: this.confirmPasswordControl
  });

  openChangePasswordModal() {
    this.passwordForm.reset();
    this.showChangePasswordModal.set(true);
  }

  async onChangePasswordSubmit() {
    if (this.passwordForm.invalid) return;

    const newPassword = this.newPasswordControl.value || '';
    const confirmPassword = this.confirmPasswordControl.value || '';

    if (newPassword !== confirmPassword) {
      this.alertService.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    this.isPasswordSaving.set(true);
    const success = await this.authStore.changePassword(newPassword, confirmPassword);
    this.isPasswordSaving.set(false);

    if (success) {
      this.showChangePasswordModal.set(false);
      this.passwordForm.reset();
    }
  }

  selectTab(tab: ProfileTab) {
    if (tab === 'password') {
      this.openChangePasswordModal();
      return;
    }
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  selectedAvatarFile = signal<File | null>(null);

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.alertService.error('File harus berupa gambar.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.alertService.error('Ukuran gambar maksimal 2MB.');
      return;
    }

    this.selectedAvatarFile.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async onSubmitProfile() {
    if (this.profileForm.invalid) return;

    const user = this.authStore.currentUser();
    if (!user) return;

    this.isProfileSaving.set(true);

    const updatedUser: User = {
      ...user,
      name: this.nameControl.value || '',
      phone: this.phoneControl.value || '',
      avatar: this.avatarPreview() || user.avatar || ''
    };

    const success = await this.authStore.updateProfile(updatedUser, this.selectedAvatarFile() || undefined);
    this.isProfileSaving.set(false);
    if (success) {
      this.showEditProfile.set(false);
    }
  }

  logout() {
    this.authStore.logout();
  }

  navigateBack() {
    this.router.navigate(['/']);
  }
}
