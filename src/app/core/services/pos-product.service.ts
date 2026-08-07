import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, of, catchError, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PosProduct, PosProductApi } from '../models/pos.model';
import { POS_BRANCH_KEY } from '../auth/pos-session.util';

/**
 * Master data produk dari gateway POS (SAP).
 *
 * Port dari `sj-pos-katalog/src/app/core/services/product.service.ts`.
 * `ProductApiService` MalakaBooks tidak bisa dipakai di sini: katalog buku
 * tidak punya paging AutoFill, harga per-customer, maupun grup UoM SAP.
 *
 * Delegasi ke CustomerService/TransactionService yang ada di sj-pos sengaja
 * TIDAK ikut di-port — komponen di sini meng-inject service tersebut langsung.
 */
@Injectable({ providedIn: 'root' })
export class PosProductService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.posApiUrl}/retail-api/api/Products`;
  private itemGroupsUrl = `${environment.posApiUrl}/retail-api/api/ItemGroups`;
  private itemGroupsCache = signal<any[] | null>(null);

  branchCode = signal<string | null>(null);

  constructor() {
    const data = typeof localStorage === 'undefined' ? null : localStorage.getItem(POS_BRANCH_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (typeof parsed === 'object' && parsed !== null) {
          this.branchCode.set(parsed.Code || parsed.code || null);
        } else {
          this.branchCode.set(parsed.toString());
        }
      } catch {
        this.branchCode.set(data);
      }
    }
  }

  getProducts(categoryId?: number | string, pageNumber: number = 1, pageSize: number = 10): Observable<PosProduct[]> {
    const url = categoryId
      ? `${this.apiUrl}/${categoryId}/${pageNumber}/${pageSize}`
      : `${this.apiUrl}/${pageNumber}/${pageSize}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const results = Array.isArray(res) ? res : (res.results || []);
        return results.map((apiProduct: PosProductApi) => this.mapToProduct(apiProduct));
      })
    );
  }

  getProductById(code: string): Observable<PosProduct> {
    return this.http.get<any>(`${this.apiUrl}/Detail/${code}`).pipe(
      map(res => this.mapToProduct(res))
    );
  }

  getAutoFillProducts(pageNumber: number = 1, pageSize: number = 50): Observable<PosProduct[]> {
    const url = `${this.apiUrl}/AutoFill/${pageNumber}/${pageSize}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        const results = res.results || [];
        return results.map((apiProduct: PosProductApi) => this.mapToProduct(apiProduct));
      })
    );
  }

  searchProducts(query: string): Observable<PosProduct[]> {
    return this.http.get<any>(`${this.apiUrl}/${query}`).pipe(
      map(res => {
        const results = Array.isArray(res) ? res : (res.results || []);
        return results.map((apiProduct: PosProductApi) => this.mapToProduct(apiProduct));
      })
    );
  }

  getItemGroups(): Observable<any[]> {
    return this.http.get<any[]>(this.itemGroupsUrl);
  }

  getItemGroupsCached(): Observable<any[]> {
    if (this.itemGroupsCache()) {
      return of(this.itemGroupsCache()!);
    }
    return this.getItemGroups().pipe(
      tap(res => this.itemGroupsCache.set(res))
    );
  }

  /** Harga khusus pelanggan per UoM. Inti dari pricing POS. */
  getPrice(customerCode: string, productCode: string, uomCode: string): Observable<number> {
    const url = `${environment.posApiUrl}/retail-api/api/Prices/${customerCode}/${productCode}/${uomCode}`;
    return this.http.get<any>(url).pipe(
      map(res => typeof res === 'number' ? res : (res.price || 0))
    );
  }

  /**
   * Ambil cabang default lalu detailnya, simpan ke signal + localStorage.
   * `WarehouseModel.Code` pada payload invoice bergantung pada ini.
   */
  fetchDefaultBranch(): Observable<any> {
    const url = `${environment.posApiUrl}/pos-api/api/v1/Branches/Default`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(res => {
        try {
          return JSON.parse(res);
        } catch {
          return (res || '').trim().replace(/^"|"$/g, '');
        }
      }),
      switchMap((res: any) => {
        const branchCode = (typeof res === 'object' && res !== null) ? (res.Code || res.code) : res;
        if (!branchCode) {
          return of(null);
        }
        const detailsUrl = `${environment.posApiUrl}/pos-api/api/v1/Branches/${branchCode}`;
        return this.http.get(detailsUrl, { responseType: 'text' }).pipe(
          map(detailsRes => {
            try {
              return JSON.parse(detailsRes);
            } catch {
              return (detailsRes || '').trim().replace(/^"|"$/g, '');
            }
          }),
          tap(details => {
            if (details) {
              const code = details.Code || details.code || branchCode;
              this.branchCode.set(code || '');
              localStorage.setItem(
                POS_BRANCH_KEY,
                typeof details === 'string' ? details : JSON.stringify(details)
              );
            }
          }),
          catchError(() => of(null))
        );
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Normalisasi respons SAP (camelCase maupun PascalCase) menjadi PosProduct.
   * UoM diurut menurun berdasarkan `uoMPackage` sehingga kolom EXTRA/BESAR/
   * SEDANG/KECIL di keranjang berbaris konsisten.
   */
  public mapToProduct(api: any): PosProduct {
    if (!api) return null as any;
    const uomGroup = api.uoMGroup || api.UoMGroupModel;
    const sortedDetails = [...(uomGroup?.details || uomGroup?.Details || [])].sort(
      (a, b) => ((b.uoMPackage || b.UoMPackage || 0) - (a.uoMPackage || a.UoMPackage || 0))
    );

    const smallestUomDetail = [...sortedDetails].sort(
      (a, b) => ((a.uoMPackage || a.UoMPackage || 0) - (b.uoMPackage || b.UoMPackage || 0))
    )[0];
    const primaryUom = smallestUomDetail?.alternateUoMModel?.Code || smallestUomDetail?.alternateUoM || api.UoMModel?.Code || 'PCS';

    const uomOptions = sortedDetails.map(d => d.alternateUoMModel?.Code || d.alternateUoM).filter(Boolean);
    const uomDetails = sortedDetails.map(d => ({
      name: d.alternateUoMModel?.Code || d.alternateUoM,
      package: d.uoMPackage || d.UoMPackage || 0,
      conversion: d.baseQuantity || d.BaseQuantity || 1
    }));

    if (uomOptions.length === 0) {
      const fallbackUom = api.UoMModel?.Code || 'PCS';
      uomOptions.push(fallbackUom);
      uomDetails.push({ name: fallbackUom, package: 0, conversion: 1 });
    }

    const code = api.code || api.Code || '';
    const name = api.name || api.Name || api.Description || code;

    return {
      id: code,
      name: name,
      price: api.lowestPrice || api.BasePrice || 0,
      uom: primaryUom,
      uomOptions: uomOptions,
      uomDetails: uomDetails,
      category: api.itemGroup?.description || api.ItemGroupModel?.Description || 'Lainnya',
      itemGroupCode: api.itemGroup?.code || api.ItemGroupModel?.Code,
      image: api.productImageUrl || api.ProductImageUrl || `https://placehold.co/400x400?text=${encodeURIComponent(name)}`,
      description: api.uoMGroup?.description || api.UoMGroupModel?.Description || '',
      isRokok: api.isRokok || false,
      barcode: api.barcode || api.Barcode,
      barcode2: api.barcode2 || api.Barcode2,
      barcode3: api.barcode3 || api.Barcode3,
      barcode4: api.barcode4 || api.Barcode4
    };
  }
}
