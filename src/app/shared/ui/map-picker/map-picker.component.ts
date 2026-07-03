import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input, Output, EventEmitter, PLATFORM_ID, Inject, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  template: `
    <div class="relative w-full h-[300px] bg-slate-100 rounded-md overflow-hidden border border-slate-200">
      <div #mapContainer class="w-full h-full z-0"></div>
      <button 
        type="button"
        (click)="useCurrentLocation()"
        [disabled]="isLocating"
        class="absolute bottom-4 right-4 z-[1000] flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow border border-slate-200  cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        title="Gunakan Lokasi Sekarang"
      >
        <i class="bx" [class.bx-current-location]="!isLocating" [class.bx-loader-alt]="isLocating" [class.animate-spin]="isLocating" class="text-primary-500 text-base"></i> 
        {{ isLocating ? 'Mencari...' : 'Lokasi Sekarang' }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class MapPickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  @Input() set initialLat(value: number | undefined) {
    this._lat = value;
    if (this.map && value !== undefined && this._lng !== undefined && value !== 0 && this._lng !== 0) {
      this.updateMarker(value, this._lng);
    }
  }

  @Input() set initialLng(value: number | undefined) {
    this._lng = value;
    if (this.map && this._lat !== undefined && value !== undefined && this._lat !== 0 && value !== 0) {
      this.updateMarker(this._lat, value);
    }
  }

  @Output() locationSelected = new EventEmitter<{ latitude: number; longitude: number }>();

  private _lat?: number;
  private _lng?: number;

  private map: any;
  private marker: any;
  private L: any;

  isLocating = false;
  private readonly logger = inject(LoggerService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Dynamically import Leaflet so it doesn't break SSR
      const L = await import('leaflet');
      this.L = L;

      // Default to Jakarta if no coords provided
      const startLat = (this._lat && this._lat !== 0) ? this._lat : -6.200000;
      const startLng = (this._lng && this._lng !== 0) ? this._lng : 106.816666;

      this.map = L.map(this.mapContainer.nativeElement).setView([startLat, startLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      // Fix missing marker icons in Angular/Webpack
      const iconDefault = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = iconDefault;

      if (this._lat && this._lng && this._lat !== 0 && this._lng !== 0) {
        this.marker = L.marker([this._lat, this._lng], { draggable: true }).addTo(this.map);
      } else {
        // Drop a marker at the center anyway
        this.marker = L.marker([startLat, startLng], { draggable: true }).addTo(this.map);
      }

      // Handle marker drag
      this.marker.on('dragend', () => {
        const position = this.marker.getLatLng();
        this.emitLocation(position.lat, position.lng);
      });

      // Handle map click
      this.map.on('click', (e: any) => {
        this.marker.setLatLng(e.latlng);
        this.emitLocation(e.latlng.lat, e.latlng.lng);
      });
    }
  }

  useCurrentLocation() {
    if (isPlatformBrowser(this.platformId) && navigator.geolocation) {
      this.isLocating = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.isLocating = false;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.updateMarker(lat, lng);
          this.emitLocation(lat, lng);
        },
        (error) => {
          this.isLocating = false;
          this.logger.error('Error getting location', error);
          alert('Tidak dapat mengakses lokasi saat ini. Pastikan izin lokasi diberikan pada browser Anda.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation tidak didukung oleh browser ini.');
    }
  }

  private updateMarker(lat: number, lng: number) {
    if (this.map && this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 15);
    }
  }

  private emitLocation(lat: number, lng: number) {
    this._lat = lat;
    this._lng = lng;
    this.locationSelected.emit({ latitude: lat, longitude: lng });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
