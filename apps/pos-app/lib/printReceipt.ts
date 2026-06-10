'use client';

interface ReceiptItem {
  nama: string;
  qty: number;
  harga: number;
  subtotal: number;
}

interface ReceiptData {
  noStruk: string;
  tanggal: string;
  kasir: string;
  items: ReceiptItem[];
  subtotal: number;
  pajak: number;
  diskon: number;
  total: number;
  metodeBayar: string;
  bayar: number;
  kembalian?: number;
}

export const printReceipt = (data: ReceiptData) => {
  const content = `
    <div style="font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px;">TOKO MATERIAL</h2>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">Jl. Raya No. 123</p>
        <p style="margin: 0; font-size: 11px; color: #999;">STRUK PENJUALAN</p>
      </div>
      
      <div style="border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 10px 0; margin: 10px 0; font-size: 11px;">
        <p style="margin: 2px 0;"><strong>No. Struk:</strong> ${data.noStruk}</p>
        <p style="margin: 2px 0;"><strong>Tanggal:</strong> ${data.tanggal}</p>
        <p style="margin: 2px 0;"><strong>Kasir:</strong> ${data.kasir}</p>
      </div>
      
      <table style="width: 100%; font-size: 11px; margin: 10px 0;">
        <thead>
          <tr style="border-bottom: 1px solid #333;">
            <th style="text-align: left; padding: 3px 0;">Item</th>
            <th style="text-align: right; padding: 3px 0;">Qty</th>
            <th style="text-align: right; padding: 3px 0;">Harga</th>
            <th style="text-align: right; padding: 3px 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td style="text-align: left; padding: 3px 0;">${item.nama}</td>
              <td style="text-align: right; padding: 3px 0;">${item.qty}</td>
              <td style="text-align: right; padding: 3px 0;">Rp ${item.harga.toLocaleString('id-ID')}</td>
              <td style="text-align: right; padding: 3px 0;">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="border-top: 1px solid #333; border-bottom: 2px solid #333; padding: 8px 0; margin: 10px 0; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>Subtotal:</span>
          <span>Rp ${data.subtotal.toLocaleString('id-ID')}</span>
        </div>
        ${data.diskon > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #16A34A;">
          <span>Diskon:</span>
          <span>-Rp ${data.diskon.toLocaleString('id-ID')}</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>Pajak (11%):</span>
          <span>Rp ${data.pajak.toLocaleString('id-ID')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px;">
          <span>TOTAL:</span>
          <span>Rp ${data.total.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <div style="font-size: 11px; margin: 10px 0;">
        <p style="margin: 3px 0;"><strong>Metode Bayar:</strong> ${data.metodeBayar}</p>
        <p style="margin: 3px 0;"><strong>Nominal Bayar:</strong> Rp ${data.bayar.toLocaleString('id-ID')}</p>
        ${data.kembalian !== undefined ? `
        <p style="margin: 3px 0;"><strong>Kembalian:</strong> Rp ${data.kembalian.toLocaleString('id-ID')}</p>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
        <p style="margin: 5px 0;">Terima kasih atas pembelian Anda!</p>
        <p style="margin: 0; font-size: 10px;">Kami tunggu kedatangan Anda kembali</p>
      </div>
    </div>
  `;

  const printWindow = window.open('', '', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk ${data.noStruk}</title>
          <style>
            body { margin: 0; padding: 0; background: #f5f5f5; }
            @media print {
              body { margin: 0; background: #fff; }
              .print-area { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-area" style="background: white; margin: 10px; padding: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            ${content}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
