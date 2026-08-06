import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReceiptPrintService {
  printReceipt(data: any[]): void {
    if (!data || data.length === 0) return;
    const firstItem = data[0];

    let branchName = 'Malakabooks Store';
    const branchCodeStr = localStorage.getItem('sj_default_branch');
    if (branchCodeStr) {
      try {
        const branchConfig = JSON.parse(branchCodeStr);
        branchName = branchConfig.Name || branchConfig.Name1 || branchConfig.Description || branchConfig.code || branchName;
      } catch (e) {
        // use default
      }
    }

    const formatDate = (dateStr: string, timeStr?: string) => {
      let datePart = '';
      if (dateStr) {
        datePart = dateStr.split('T')[0];
      } else {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      }

      let timePart = '00:00:00';
      if (timeStr) {
        timePart = timeStr.split('.')[0];
      }

      return `${datePart} ${timePart}`;
    };

    const formatCurrency = (val: number) => {
      return (val || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    let itemsHtml = '';
    data.forEach((item: any) => {
      itemsHtml += `
        <div class="item-row" style="margin: 0; padding: 0; line-height: 1.1; font-size: 11px;">
          <div style="word-break: break-all; margin: 0; padding: 0; line-height: 1.1;">
            ${item.quantity} ${item.uoM || item.uom} ${item.productName}
          </div>
          <div style="display: flex; justify-content: space-between; margin: 0; padding: 0 0 0 20px; line-height: 1.1;">
            <span>isi ${item.baseQuantity || 1} &nbsp;&nbsp;&nbsp; @${formatCurrency(item.price)}</span>
            <span>${formatCurrency(item.lineTotal)}</span>
          </div>
        </div>
      `;
    });

    const docTotal = firstItem.docTotal || data.reduce((acc, curr) => acc + (curr.lineTotal || 0), 0);

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Struk Belanja - ${firstItem.docNum}</title>
        <style>
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            font-family: 'Poppins', Consolas, monaco, monospace;
            font-size: 13px;
            line-height: 1.35;
            width: 72mm;
            margin: 0 auto;
            padding: 5px;
            box-sizing: border-box;
            color: #000;
            background-color: #fff;
            text-transform: uppercase;
          }
          .receipt-container {
            display: block;
            width: 100%;
            padding-right: 10px;
            box-sizing: border-box;
          }
          .text-center { text-align: center; }
          .flex { display: flex; justify-content: space-between; }
          .divider {
            border-top: 2px dashed #000;
            margin: 4px 0;
          }
          .header { margin-bottom: 4px; }
          .info-row { font-size: 12px; margin-bottom: 2px; }
          .summary-table { margin-top: 5px; width: 100%; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header text-center">
            <div class="info-row" style="margin-bottom: 2px; font-weight: bold; font-size: 14px;">${branchName}</div>
            <div style="font-size: 10px; font-weight: normal;">NOTA ORDER / STRUK POS</div>
          </div>
          
          <div class="info-row">
            <div class="flex">
              <span>No. Nota :</span>
              <span>${firstItem.docNum}</span>
            </div>
            <div class="flex">
              <span>Tanggal  :</span>
              <span>${formatDate(firstItem.docDate, firstItem.docTime)}</span>
            </div>
            <div class="flex">
              <span>Customer :</span>
              <span>${firstItem.customerName}</span>
            </div>
            <div class="flex">
              <span>Kasir    :</span>
              <span>${firstItem.cashier || ''}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="items-list">
            ${itemsHtml}
          </div>
          
          <div class="divider"></div>
          
          <div class="summary-table">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 11px; line-height: 1.2;">
              <div style="text-align: left; width: 40%; max-width: 40%; word-break: break-all;">
                ${firstItem.remarks ? `${firstItem.remarks}` : ''}
              </div>
              
              <div style="width: 60%; max-width: 60%;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                  <span>Total</span>
                  <span>${formatCurrency(docTotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; width: 100%;">
                  <span>Bayar Tunai</span>
                  <span>${formatCurrency(firstItem.cashPayment || 0)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; width: 100%;">
                  <span>Kembali</span>
                  <span>${formatCurrency(Math.max(0, (firstItem.cashPayment || 0) - docTotal))}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div style="text-align: center; font-size: 9px; margin-top: 15px; text-transform: none;">
            Terima kasih telah berbelanja di ${branchName}
          </div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '80mm';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  }
}
