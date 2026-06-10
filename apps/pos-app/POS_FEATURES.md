# POS (Point of Sales) Module Documentation

Dokumentasi lengkap fitur dan penggunaan modul Point of Sales untuk sistem ERP Gentong MAS.

## 📋 Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Panduan Penggunaan](#panduan-penggunaan)
3. [Fitur Teknis](#fitur-teknis)
4. [API Integration](#api-integration)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Fitur Utama

### 1. **Transaksi Penjualan**
- Pencatatan penjualan real-time
- Dukungan multiple metode pembayaran:
  - Tunai (Cash)
  - Transfer Bank
  - Kartu Kredit
  - QRIS
  - Pembayaran Split (kombinasi metode)

### 2. **Manajemen Produk**
- Browser produk dengan kategori
- Pencarian real-time
- Pemindai barcode
- Adjustable quantities dengan tombol +/-
- Stock tracking
- Edit harga & status (supervisor only)

### 3. **Keranjang & Checkout**
- Add/remove items
- Quantity management
- Automatic tax calculation (11% PPN)
- Voucher & discount codes
- Member loyalty points tracking
- Split payment allocation

### 4. **Receipt & Printing**
- Receipt digital otomatis
- Format thermal printer
- Itemized breakdown
- Nomor transaksi unik
- Print langsung dari checkout screen

### 5. **Offline Support** 🔌
- Transaction queueing saat offline
- Auto-sync saat kembali online
- localStorage persistence
- Real-time connection status
- Queue counter display

### 6. **Session Management**
- Open shift dengan cash float
- Close shift dengan journal lengkap
- Hourly sales tracking
- Payment method breakdown per session
- Session-level reporting

### 7. **Loyalty Program**
- Customer member tracking
- Points earning per transaction
- Points redemption
- Configurable loyalty settings
- Customer history

### 8. **Reporting & Analytics**
- Daily sales summary
- Hourly sales breakdown
- Payment method analysis
- Bestselling products
- Transaction history dengan filter

---

## 📖 Panduan Penggunaan

### Alur Checkout Standar

```
1. Tambah Produk → Keranjang
   ↓
2. Atur Quantity (tombol +/-)
   ↓
3. Apply Diskon/Voucher (opsional)
   ↓
4. Select Member (opsional)
   ↓
5. Pilih Metode Bayar
   ↓
6. Konfirmasi Total
   ↓
7. Cetak Struk
   ↓
8. Selesai!
```

### Pembayaran Split

Untuk pembayaran menggunakan lebih dari 1 metode:

1. Klik **"Pembayaran Split"** di section metode bayar
2. Atur jumlah untuk setiap metode:
   - Tunai: Rp 50.000
   - Transfer: Rp 30.000
   - Kartu: Rp 20.000
3. Total otomatis terisi
4. Checkout normal

### Hold & Resume (Tunda Transaksi)

Untuk transaksi yang belum selesai:

1. Klik tombol **"Tahan Transaksi"** di checkout
2. Transaksi disimpan dengan status HOLD
3. Kemudian:
   - Klik **"Resume"** untuk melanjutkan
   - Data cart & pembayaran akan dikembalikan

### Session Management

**Buka Session:**
```
Navigasi ke Sessions → Buka Session
Masukkan cash float awal (contoh: 500.000)
Cashier dimulai bekerja
```

**Tutup Session:**
```
Klik "Tutup Session"
Review ringkasan total penjualan
Konfirmasi penutupan
Journal otomatis terbentuk
```

---

## 🔧 Fitur Teknis

### Toast Notifications

Sistem notifikasi untuk user feedback:

```typescript
import { useToast } from '@/lib/toast';

const { show } = useToast();

// Success notification
show.success('Transaksi berhasil');

// Error notification
show.error('Terjadi kesalahan');

// Warning notification
show.warning('Perhatian: Stock minimal');

// Info notification
show.info('Fitur baru tersedia');
```

### Receipt Printing

```typescript
import { printReceipt } from '@/lib/printReceipt';

printReceipt({
  noStruk: 'TRX-12345',
  tanggal: '2025-01-15',
  kasir: 'Kasir 1',
  items: [
    { nama: 'Semen', qty: 2, harga: 50000, subtotal: 100000 },
  ],
  subtotal: 100000,
  pajak: 11000,
  diskon: 0,
  total: 111000,
  metodeBayar: 'Tunai',
  bayar: 111000,
});
```

### Utility Functions

```typescript
import { fmt, fmtDate, fmtTime, calculateTax } from '@/lib/utils';

fmt(100000); // "Rp 100.000"
fmtDate(new Date()); // "15 Jan 2025"
fmtTime(new Date()); // "14:30:45"
calculateTax(100000); // 11000
```

### Offline Queue Management

Transaksi offline otomatis disimpan di `localStorage` dengan key:
```
pos_pending_transactions: [
  { items: [...], total: 111000, metodeBayar: 'tunai', noStruk: 'offline-...' }
]
```

Auto-sync saat network tersambung kembali.

---

## 🔗 API Integration

### Backend Endpoints

**Buat Transaksi:**
```
POST /api/pos/transactions
Body: {
  customerId: string (optional)
  items: [{ posProductId, qty, harga, ... }]
  totalHarga: number
  diskon: number
  pajak: number
  grandTotal: number
  bayar: number
  metodeBayar: 'cash' | 'transfer' | 'card' | 'qris' | 'split'
  splitPayments: [{ method, amount }] (jika split)
  status: 'selesai' | 'hold'
}
```

**Tahan Transaksi:**
```
POST /api/pos/transactions/hold
Body: { ...same as create }
```

**Resume Transaksi:**
```
POST /api/pos/transactions/{id}/resume
```

**Sync Offline:**
```
POST /api/pos/transactions/sync
Body: {
  transactions: [
    { items, total, metodeBayar, noStruk, status }
  ]
}
```

**Session Management:**
```
POST /api/pos/sessions/open
POST /api/pos/sessions/{id}/close
GET /api/pos/sessions/{id}/report
```

**Loyalty:**
```
GET /api/loyalty/config
PUT /api/loyalty/config
GET /api/loyalty/customers/{customerId}
POST /api/loyalty/redeem
```

---

## 📊 Data Structure

### Transaction Object
```typescript
interface PosSale {
  id: string;
  customerId?: string;
  kasirId: string;
  sessionId: string;
  items: PosSaleItem[];
  subtotal: number;
  diskon: number;
  pajak: number;
  grandTotal: number;
  bayar: number;
  metodeBayar: 'cash' | 'transfer' | 'card' | 'qris' | 'split';
  splitPayments?: { method: string; amount: number }[];
  status: 'selesai' | 'hold' | 'return';
  noStruk: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session Object
```typescript
interface PosSession {
  id: string;
  kasirId: string;
  openedAt: Date;
  closedAt?: Date;
  cashFloat: number;
  totalSales: number;
  totalTransactions: number;
  paymentBreakdown: {
    cash: number;
    transfer: number;
    card: number;
    qris: number;
  };
  status: 'open' | 'closed';
}
```

---

## ⚠️ Troubleshooting

### Issue: Transaksi tidak terupload saat online
**Solusi:**
1. Buka DevTools (F12) → Network
2. Pastikan API endpoint `/api/pos/transactions` accessible
3. Check authentication token di localStorage
4. Lihat error message di toast notification

### Issue: Receipt tidak cetak
**Solusi:**
1. Pastikan browser tidak blocking popup
2. Cek browser console untuk error
3. Coba print ulang dari halaman Riwayat

### Issue: Offline queue tidak sync otomatis
**Solusi:**
1. Klik tombol sync manual di queue counter
2. Tunggu 5 detik koneksi stabil
3. Refresh halaman jika masih gagal

### Issue: Service Worker tidak aktif
**Solusi:**
1. Buka: Chrome → Settings → Apps → Manage all apps
2. Cari app ini dan enable notifications
3. Clear cache: Ctrl+Shift+Delete → All time → Clear data

### Issue: Stock tidak update
**Solusi:**
1. Hanya supervisor yang bisa edit
2. Pastikan logged in sebagai supervisor
3. Refresh halaman setelah edit

---

## 🔐 Security Notes

- Semua endpoint dilindungi JWT auth
- Sensitive data (token) disimpan di secure storage
- Offline transactions divalidasi saat sync
- Session management mencegah duplikasi transaksi

---

## 📱 Supported Devices

- Desktop Browser (Chrome, Firefox, Safari, Edge)
- Tablet (iPad, Android tablets)
- Mobile (dengan responsive design)
- Thermal Printer (via browser print)
- Barcode Scanner (USB HID compatible)

---

## 🚀 Performance Tips

1. **Untuk offline support**: Matikan auto-sync, manual sync 10 transaksi sekali
2. **Untuk banyak produk**: Gunakan category filter, jangan browse all
3. **Untuk printing**: Print maksimal 5 struk sekaligus, tunggu selesai
4. **Untuk session**: Close session 1x/hari di akhir shift

---

## 📞 Support

Untuk bantuan teknis:
1. Buka Browser Console (F12)
2. Copy error message
3. Screenshot halaman yang error
4. Hubungi tim development

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
