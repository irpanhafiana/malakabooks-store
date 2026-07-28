import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { User } from '../../core/models';
import { InputComponent } from '../../shared/ui/input/input.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { ToastService } from '../../core/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';
import { UserApiService } from '../../core/services/user-api.service';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { ScreenService } from '../../core/services/screen.service';
import { OrderStore } from '../../store/order.store';

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
    ModalComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  protected readonly screen = inject(ScreenService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly userApi = inject(UserApiService);

  isProfileSaving = signal<boolean>(false);
  avatarPreview = signal<string>('');

  showEditProfile = signal<boolean>(false);
  showMockModal = signal<string | null>(null);

  // Menu configuration for clean looping in template
  menuSections: MenuSection[] = [
    {
      items: [
        { icon: 'bx-map', label: 'Alamat Saya', route: '/profile/addresses' },
        { icon: 'bx-key', label: 'Ganti Password', action: () => this.showMockModal.set('Change Password') },
        { icon: 'bx-message-square-error', label: 'Komplain', route: '/complaints' },
        { icon: 'bx-package', label: 'Lacak Pesanan', route: '/order-history' }
      ]
    }
  ];

  // Order status counts
  pendingCount = computed(() => this.orderStore.orders().filter(o => o.status === 'pending').length);
  processingCount = computed(() => this.orderStore.orders().filter(o => o.status === 'processing').length);
  shippedCount = computed(() => this.orderStore.orders().filter(o => o.status === 'shipped').length);
  completedCount = computed(() => this.orderStore.orders().filter(o => o.status === 'completed').length);

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

    this.nameControl.setValue(user.name);
    this.emailControl.setValue(user.email);
    this.phoneControl.setValue(user.phone || '');
    this.avatarPreview.set(user.avatar || '');

    if (user.phone) {
      this.userApi.getExternalProfile(user.phone).subscribe({
        next: (res: any) => {
          if (res && res.id) {
            localStorage.setItem('externalProfileId', res.id);
          } else if (res && res.data && res.data.id) {
            localStorage.setItem('externalProfileId', res.data.id);
          }
        },
        error: (err) => this.logger.error('Failed to get external profile id:', err)
      });
    }

    // Load user orders
    this.orderStore.loadUserOrders(user.id);
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastService.error('File harus berupa gambar.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.error('Ukuran gambar maksimal 2MB.');
      return;
    }

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

    const success = await this.authStore.updateProfile(updatedUser);
    this.isProfileSaving.set(false);
    if (success) {
      this.showEditProfile.set(false);
    }
  }

  logout() {
    this.authStore.logout();
    this.toastService.success('Logged out successfully.');
    this.router.navigate(['/auth/login']);
  }

  navigateBack() {
    this.router.navigate(['/']);
  }
}
