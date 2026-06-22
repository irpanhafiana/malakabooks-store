import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'app-tracking',
  standalone: true,
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4 text-gray-800">Tracking Pesanan</h2>
      <p class="text-gray-600">Sedang memuat data tracking. Silakan buka Console browser (F12) untuk melihat respons API.</p>
    </div>
  `
})
export class TrackingComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  ngOnInit() {
    const user = this.authStore.currentUser();
    if (user && user.id) {
      const url = `http://192.168.1.15:25168/api/v1/customer/Orders/user/${user.id}`;
      this.http.get(url).subscribe({
        next: (res) => {
          console.log('Tracking Orders Response:', res);
        },
        error: (err) => {
          console.error('Failed to fetch tracking orders:', err);
        }
      });
    } else {
      console.warn('No logged in user found to fetch tracking details.');
    }
  }
}
