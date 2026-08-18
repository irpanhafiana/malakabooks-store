import { Injectable } from '@angular/core';
import { Order } from '../models';
import { getWaybillField } from './waybill-normalizer';

@Injectable({
  providedIn: 'root'
})
export class ShippingLabelService {

  public printLabel(order: Order, detailResiData: any): boolean {
    const printWindow = window.open('', '_blank', 'width=520,height=760');
    if (!printWindow) {
      return false;
    }

    const html = this.buildLabelHtml(order, detailResiData);
    printWindow.document.write(html);
    printWindow.document.close();
    return true;
  }

  public buildLabelHtml(order: Order, detailResiData: any): string {
    const dr = (...keys: string[]) => getWaybillField(detailResiData, ...keys);
    const has = (v: string) => v != null && v !== '' && v !== '-';

    // Courier & service (from detail-resi)
    const courierRaw = order.shippingCourier || dr('ekspedisi', 'courier', 'courierName', 'expedition');
    const courierName = has(courierRaw) ? courierRaw.toUpperCase() : 'SPX';
    const serviceRaw = dr('service_code', 'serviceType', 'ServiceType', 'service_type') !== '-'
      ? dr('service_code', 'serviceType', 'ServiceType', 'service_type')
      : (order.shippingType || 'STD');
    const service = serviceRaw.toUpperCase();

    // AWB / Order number
    const awb = order.trackingNumber || dr('awb', 'Awb', 'awbNo', 'AWBNo', 'trackingNumber', 'noResi') || '-';
    const awbClean = awb.replace(/[^a-zA-Z0-9_-]/g, '');
    const orderNo = has(dr('order_id')) ? dr('order_id') : order.id;

    // Routing / sorting codes (from detail-resi)
    const descode = dr('descode');
    const destCode = dr('destination_code', 'dest_code');

    // Receiver (from detail-resi, fallback to order)
    const recvName = has(dr('receiver_name')) ? dr('receiver_name') : (order.userName || '-');
    const recvPhone = dr('receiver_phone');
    const recvAddrDetail = dr('receiver_addr_detail');
    const recvAddrLine = dr('receiver_addr'); // "KELURAHAN, KECAMATAN, KOTA, PROVINSI"
    const recvParts = has(recvAddrLine) ? recvAddrLine.split(',').map(s => s.trim()) : [];
    const recvKec = recvParts[1] || '';
    const recvCity = (recvParts[2] || dr('receiver_city') || '-').toUpperCase();
    const recvProvince = (recvParts[3] || '').toUpperCase();
    const recvAddrFull = [recvAddrDetail, recvAddrLine].filter(has).join('. ');

    // Sender (from detail-resi, fallback to store)
    const senderName = has(dr('shipper_name', 'shipper', 'shipperName', 'pengirim', 'senderName', 'sender'))
      ? dr('shipper_name', 'shipper', 'shipperName', 'pengirim', 'senderName', 'sender')
      : 'MalakaBooks Store';
    const senderPhone = dr('shipper_phone', 'shipperPhone', 'senderPhone', 'senderPhoneNumber');
    const senderCity = (dr('shipper_city', 'origin', 'originCity', 'kota_pengirim', 'kota_asal') || '').toUpperCase();

    // Weight: detail-resi "berat" (kg), fallback to summed item weights (grams)
    const beratNum = parseFloat(dr('berat', 'weight', 'berat_paket', 'itemWeight', 'ItemWeight', 'weightValue'));
    let weightStr = '-';
    if (!isNaN(beratNum) && beratNum > 0) {
      weightStr = beratNum < 100 ? `${Math.round(beratNum * 1000)} gr` : `${Math.round(beratNum)} gr`;
    } else {
      let w = 0;
      for (const it of order.items) w += ((it.product as any)?.weight || 0) * (it.quantity || 0);
      if (w > 0) weightStr = `${w} gr`;
    }

    // Payment mode (COD vs cashless)
    const isCod = (order.paymentMethod || '').toLowerCase().includes('cod');
    const codLabel = isCod ? 'COD' : 'CASHLESS';
    const codMsg = isCod
      ? 'Pembeli membayar tunai ke Kurir'
      : 'Pembeli tidak perlu bayar ongkir ke Kurir';

    // Product rows (order items; fallback to detail-resi deskripsi/jumlah)
    let itemsHtml = order.items.map((it, i) => {
      const p: any = it.product || {};
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>${this.esc(p.title || p.name || '-')}</td>
        <td>${this.esc(p.sapCode || p.isbn || p.id || '-')}</td>
        <td>${this.esc(p.categoryName || '-')}</td>
        <td class="c">${it.quantity || 0}</td>
      </tr>`;
    }).join('');
    if (!itemsHtml) {
      itemsHtml = `<tr>
        <td class="c">1</td>
        <td>${this.esc(has(dr('deskripsi')) ? dr('deskripsi') : '-')}</td>
        <td>-</td>
        <td>-</td>
        <td class="c">${this.esc(has(dr('jumlah')) ? dr('jumlah') : '1')}</td>
      </tr>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Label Resi - ${this.esc(awb)}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
<style>
  @page { margin: 0; size: 100mm 150mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .label { width: 100mm; padding: 2.5mm; }
  .row { display: flex; }
  .dashed { border-top: 1.5px dashed #000; margin: 1.5mm 0; }
  .solid { border-top: 2px solid #000; margin: 1.5mm 0; }

  /* Header */
  .head { display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 1.5mm; }
  .brand .icon-box { background: #003049; border-radius: 1.2mm; width: 8mm; height: 8mm; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .brand .icon-box img { width: 5.5mm; height: 5.5mm; filter: brightness(0) invert(1); }
  .brand .text { display: flex; flex-direction: column; justify-content: center; line-height: 1.1; }
  .brand .text .name { font-size: 11pt; font-weight: 800; letter-spacing: -0.2px; }
  .brand .text .tagline { font-size: 5.5pt; font-weight: 600; color: #666; letter-spacing: 0.5px; text-transform: uppercase; }
  .service { font-size: 20pt; font-weight: 900; letter-spacing: 1px; }
  .courier-logo { font-size: 14pt; font-weight: 900; font-style: italic; letter-spacing: -0.5px; }

  /* Code boxes */
  .boxrow { display: flex; gap: 0; border: 1.5px solid #000; margin-top: 1mm; }
  .boxrow .box { flex: 1; padding: 1.5mm 2mm; border-right: 1.5px solid #000; font-size: 9pt; font-weight: 700; }
  .boxrow .box:last-child { border-right: none; }
  .boxrow .box.big { font-size: 14pt; font-weight: 900; text-align: center; }
  .boxrow .box.mid { font-size: 10pt; font-weight: 900; text-align: center; word-break: break-word; }
  .boxrow .box.resi { font-size: 8.5pt; font-weight: 700; }

  /* Barcode */
  .barcode { text-align: center; margin: 1.5mm 0 0.5mm; }
  .barcode svg { max-width: 100%; height: auto; }

  /* Names */
  .names { display: flex; font-size: 9pt; }
  .names .col { flex: 1; padding-right: 2mm; }
  .names b { font-weight: 800; }

  /* Address */
  .addr { display: flex; font-size: 8.5pt; line-height: 1.35; margin-top: 0.5mm; }
  .addr .col { flex: 1; padding-right: 2mm; word-break: break-word; }
  .addr .col.right { text-align: left; }

  /* small labelled boxes */
  .minirow { display: flex; border: 1.5px solid #000; margin-top: 1.5mm; }
  .minirow .cell { padding: 1mm 2mm; border-right: 1.5px solid #000; font-size: 8pt; font-weight: 700; }
  .minirow .cell:last-child { border-right: none; }
  .minirow .cell.grow { flex: 1; }
  .minirow .cell.italic { font-style: italic; font-weight: 400; }
  .minirow .cell.bold { font-weight: 900; }

  /* Weight + QR */
  .wq { display: flex; align-items: center; justify-content: space-between; margin-top: 2mm; gap: 2mm; }
  .wq .info { font-size: 10pt; }
  .wq .info .berat { font-weight: 800; margin-bottom: 1mm; }
  .wq .info .ordno { font-size: 9.5pt; font-weight: 800; }
  .wq .qr { display: flex; align-items: center; gap: 2mm; }
  .wq .qr img, .wq .qr canvas { width: 20mm; height: 20mm; }
  .wq .qr .codes { display: flex; flex-direction: column; gap: 1.5mm; }
  .wq .qr .codes .code { border: 1.5px solid #000; padding: 1.5mm 2mm; font-size: 8pt; font-weight: 700; text-align: center; }

  /* Items table */
  table.items { width: 100%; border-collapse: collapse; margin-top: 1mm; font-size: 8pt; }
  table.items th { text-align: left; border-bottom: 1.5px solid #000; padding: 1mm 1.5mm; font-weight: 800; }
  table.items td { padding: 1mm 1.5mm; vertical-align: top; word-break: break-word; }
  table.items .c { text-align: center; }
  table.items th.qc, table.items td.qc { text-align: center; }

  .pesan { font-size: 8pt; margin-top: 1mm; }
</style>
</head>
<body>
<div class="label">
  <!-- Header -->
  <div class="head">
    <div class="brand">
      <div class="icon-box"><img src="/malaka-books.svg" alt="Logo"></div>
      <div class="text">
        <span class="name">Malaka Books</span>
        <span class="tagline">Jendela Literasi Bangsa</span>
      </div>
    </div>
    <div class="service">${this.esc(service)}</div>
    <div class="courier-logo">${this.esc(courierName)}</div>
  </div>
  <div class="dashed"></div>

  <!-- Code boxes -->
  <div class="boxrow">
    <div class="box big">${this.esc(destCode !== '-' ? destCode : recvCity)}</div>
    <div class="box mid">${this.esc(descode)}</div>
    <div class="box resi">No. Resi: ${this.esc(awb)}</div>
  </div>

  <!-- Barcode -->
  <div class="barcode"><svg id="barcode"></svg></div>
  <div class="dashed"></div>

  <!-- Names -->
  <div class="names">
    <div class="col"><b>Penerima:</b> ${this.esc(recvName)}</div>
    <div class="col"><b>Pengirim:</b> ${this.esc(senderName)}</div>
  </div>

  <!-- Address -->
  <div class="addr">
    <div class="col">${this.esc(recvAddrFull)}<br>Telp: ${this.esc(recvPhone)}</div>
    <div class="col right">${this.esc(senderPhone)}<br>${this.esc(senderCity)}</div>
  </div>

  <!-- City boxes -->
  <div class="minirow">
    <div class="cell grow">${this.esc(recvCity)}</div>
    <div class="cell grow">${this.esc(recvKec.toUpperCase())}</div>
    <div class="cell grow">${this.esc(recvProvince)}</div>
  </div>

  <!-- Payment -->
  <div class="minirow">
    <div class="cell bold">${this.esc(codLabel)}</div>
    <div class="cell grow italic">${this.esc(codMsg)}</div>
  </div>

  <!-- Weight + QR -->
  <div class="wq">
    <div class="info">
      <div class="berat">Berat: ${this.esc(weightStr)}</div>
      <div class="ordno">No. Pesanan: ${this.esc(orderNo)}</div>
    </div>
    <div class="qr">
      <div id="qrcode"></div>
      <div class="codes">
        <div class="code">${this.esc(service)}</div>
        <div class="code">${this.esc(courierName)}</div>
      </div>
    </div>
  </div>
  <div class="solid"></div>

  <!-- Items -->
  <table class="items">
    <thead>
      <tr>
        <th class="c">#</th>
        <th>Nama Produk</th>
        <th>SKU</th>
        <th>Variasi</th>
        <th class="qc">Qty</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <div class="pesan">Pesan: (${this.esc(orderNo)})</div>
</div>
<script>
  try {
    JsBarcode("#barcode", "${awbClean}", {
      format: "CODE128",
      width: 1.6,
      height: 45,
      displayValue: false,
      margin: 0,
      background: "#fff"
    });
  } catch(e) {
    var el = document.querySelector('.barcode');
    if (el) { el.textContent = "${awbClean}"; }
  }
  try {
    new QRCode(document.getElementById("qrcode"), {
      text: "${awbClean}",
      width: 76,
      height: 76,
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch(e) {}
  setTimeout(function() { window.print(); window.close(); }, 600);
</script>
</body>
</html>`;
  }

  private esc(s: string): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
