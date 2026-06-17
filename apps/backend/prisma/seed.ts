import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);

  // ─── DEFAULT TENANT ────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'gentong-mas' },
    update: {},
    create: {
      name: 'Gentong Mas',
      slug: 'gentong-mas',
      email: 'info@gentongmas.com',
      phone: '031-1234567',
      address: 'Jl. Industri No. 1, Surabaya 60123',
      plan: 'trial',
      isActive: true,
    },
  });
  const tid = tenant.id;

  // ─── ROLE & PERMISSIONS ───────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tid, name: 'admin' } },
    update: { description: 'Administrator role with full access' },
    create: { tenantId: tid, name: 'admin', description: 'Administrator role with full access' },
  });

  const perms = [
    { module: 'dashboard', action: 'view', label: 'View Dashboard', description: 'View dashboard summary' },
    { module: 'notifications', action: 'view', label: 'View Notifications', description: 'View notifications' },
    { module: 'notifications', action: 'update', label: 'Update Notifications', description: 'Mark notifications as read' },
    { module: 'notifications', action: 'create', label: 'Create Notifications', description: 'Send notifications' },
    { module: 'roles', action: 'view', label: 'View Roles', description: 'View roles' },
    { module: 'permissions', action: 'view', label: 'View Permissions', description: 'View permissions' },
  ];

  for (const p of perms) {
    const perm = await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      update: {},
      create: p,
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id, allowed: true },
    });
  }

  // ─── ADMIN USER ───────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tid, email: 'admin@example.com' } },
    update: { name: 'Administrator', password, roleId: adminRole.id },
    create: { tenantId: tid, email: 'admin@example.com', name: 'Administrator', password, isActive: true, isOwner: true, roleId: adminRole.id },
  });

  // ─── WAREHOUSE ────────────────────────────────────────────────────────
  const gudang = await prisma.warehouse.upsert({
    where: { code: 'GDG-001' },
    update: {},
    create: { tenantId: tid, code: 'GDG-001', name: 'Gudang Utama', address: 'Jl. Industri No. 1, Surabaya', active: true },
  });

  // ─── PRODUCT CATEGORIES ───────────────────────────────────────────────
  const catSpr = await prisma.productCategory.upsert({ where: { code: 'CAT-SPR' }, update: {}, create: { tenantId: tid, code: 'CAT-SPR', name: 'Sparepart Motor' } });
  const catOli = await prisma.productCategory.upsert({ where: { code: 'CAT-OLI' }, update: {}, create: { tenantId: tid, code: 'CAT-OLI', name: 'Pelumas & Oli' } });

  // ─── PRODUCT UNITS ─────────────────────────────────────────────────────
  const uPcs = await prisma.productUnit.upsert({ where: { name: 'Pcs' }, update: {}, create: { tenantId: tid, name: 'Pcs', symbol: 'pcs' } });
  const uLtr = await prisma.productUnit.upsert({ where: { name: 'Liter' }, update: {}, create: { tenantId: tid, name: 'Liter', symbol: 'L' } });

  // ─── PRODUCTS ──────────────────────────────────────────────────────────
  for (const p of [
    { sku: 'HDA-001', name: 'Rantai Motor Honda Aspira', hargaBeli: 45000, hargaJual: 55000, stok: 150, stokMinimum: 20, categoryId: catSpr.id, unitId: uPcs.id, brand: 'ASPIRA' },
    { sku: 'FED-001', name: 'Kampas Rem Depan Federal', hargaBeli: 35000, hargaJual: 42000, stok: 200, stokMinimum: 30, categoryId: catSpr.id, unitId: uPcs.id, brand: 'FEDERAL' },
    { sku: 'YMH-001', name: 'Filter Udara Yamaha', hargaBeli: 25000, hargaJual: 32000, stok: 80, stokMinimum: 15, categoryId: catSpr.id, unitId: uPcs.id, brand: 'YAMAHA' },
    { sku: 'NGK-001', name: 'Busi NGK Racing', hargaBeli: 18000, hargaJual: 25000, stok: 300, stokMinimum: 50, categoryId: catSpr.id, unitId: uPcs.id, brand: 'HONDA' },
    { sku: 'CAS-001', name: 'Oli Mesin Castrol 10W-40 1L', hargaBeli: 55000, hargaJual: 65000, stok: 120, stokMinimum: 20, categoryId: catOli.id, unitId: uLtr.id, brand: 'SUZUKI' },
    { sku: 'AHM-001', name: 'Oli Gardan AHM SPX', hargaBeli: 22000, hargaJual: 28000, stok: 90, stokMinimum: 15, categoryId: catOli.id, unitId: uLtr.id, brand: 'HONDA' },
    { sku: 'KWS-001', name: 'Kampas Kopling Kawasaki', hargaBeli: 48000, hargaJual: 58000, stok: 45, stokMinimum: 10, categoryId: catSpr.id, unitId: uPcs.id, brand: 'KAWASAKI' },
    { sku: 'HDB-001', name: 'Gear Set Honda Beat', hargaBeli: 85000, hargaJual: 99000, stok: 60, stokMinimum: 10, categoryId: catSpr.id, unitId: uPcs.id, brand: 'HONDA' },
    { sku: 'VBY-001', name: 'V-Belt Yamaha Mio', hargaBeli: 55000, hargaJual: 68000, stok: 40, stokMinimum: 10, categoryId: catSpr.id, unitId: uPcs.id, brand: 'YAMAHA' },
    { sku: 'AKY-001', name: 'Aki Yuasa 12V 5Ah', hargaBeli: 185000, hargaJual: 220000, stok: 25, stokMinimum: 5, categoryId: catSpr.id, unitId: uPcs.id, brand: 'HONDA' },
  ]) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { stok: p.stok },
      create: { tenantId: tid, ...p, warehouseId: gudang.id, active: true },
    });
  }

  // ─── CUSTOMERS ─────────────────────────────────────────────────────────
  for (const c of [
    { name: 'Bengkel Maju Jaya', email: 'maju@gmail.com', phone: '08111222333', city: 'Surabaya', address: 'Jl. Raya Darmo 10', active: true },
    { name: 'UD Sumber Rejeki', email: 'sumber@gmail.com', phone: '08222333444', city: 'Sidoarjo', address: 'Jl. Veteran 5', active: true },
    { name: 'Toko Bintang Motor', email: 'bintang@gmail.com', phone: '08333444555', city: 'Gresik', address: 'Jl. Harun Tohir 20', active: true },
    { name: 'CV Karya Mandiri', email: 'karya@gmail.com', phone: '08444555666', city: 'Surabaya', address: 'Jl. Ahmad Yani 99', active: true },
    { name: 'Bengkel Santoso', email: 'santoso@gmail.com', phone: '08555666777', city: 'Malang', address: 'Jl. Semeru 15', active: true },
    { name: 'PT Cakra Motor', email: 'cakra@gmail.com', phone: '08666777888', city: 'Surabaya', address: 'Jl. Dupak 55', active: true },
  ]) {
    const exists = await prisma.customer.findFirst({ where: { tenantId: tid, name: c.name } });
    if (!exists) await prisma.customer.create({ data: { tenantId: tid, ...c } });
  }

  // ─── SUPPLIERS ─────────────────────────────────────────────────────────
  for (const s of [
    { code: 'SUP-001', name: 'PT Aspira Indonesia', email: 'aspira@supplier.com', phone: '02111111111', city: 'Jakarta', address: 'Jl. MT Haryono Kav. 1', active: true },
    { code: 'SUP-002', name: 'PT Federal Parts', email: 'federal@supplier.com', phone: '02222222222', city: 'Jakarta', address: 'Jl. Casablanca 88', active: true },
    { code: 'SUP-003', name: 'CV Yamaha Distributor', email: 'yamaha@supplier.com', phone: '02333333333', city: 'Surabaya', address: 'Jl. Rungkut Industri 5', active: true },
    { code: 'SUP-004', name: 'PT Global Spare Nusantara', email: 'gsn@supplier.com', phone: '02444444444', city: 'Surabaya', address: 'Jl. Margomulyo Ind. 3', active: true },
  ]) {
    await prisma.supplier.upsert({ where: { code: s.code }, update: {}, create: { tenantId: tid, ...s } });
  }

  // ─── EMPLOYEES ─────────────────────────────────────────────────────────
  for (const e of [
    { nik: 'EMP001', name: 'Budi Santoso', jabatan: 'Sales Manager', departemen: 'Sales', gapok: 8000000, status: 'aktif', tanggalMasuk: new Date('2020-01-15') },
    { nik: 'EMP002', name: 'Dewi Lestari', jabatan: 'Admin', departemen: 'Admin', gapok: 5500000, status: 'aktif', tanggalMasuk: new Date('2021-03-01') },
    { nik: 'EMP003', name: 'Eko Prasetyo', jabatan: 'Driver', departemen: 'Operasional', gapok: 4500000, status: 'aktif', tanggalMasuk: new Date('2019-07-20') },
    { nik: 'EMP004', name: 'Fitri Handayani', jabatan: 'Kasir', departemen: 'Finance', gapok: 5000000, status: 'aktif', tanggalMasuk: new Date('2022-01-10') },
    { nik: 'EMP005', name: 'Gunawan Susilo', jabatan: 'Staf Gudang', departemen: 'Logistik', gapok: 4800000, status: 'aktif', tanggalMasuk: new Date('2020-06-01') },
    { nik: 'EMP006', name: 'Hendra Wijaya', jabatan: 'Sales', departemen: 'Sales', gapok: 6000000, status: 'aktif', tanggalMasuk: new Date('2021-08-15') },
  ]) {
    await prisma.employee.upsert({ where: { nik: e.nik }, update: {}, create: { tenantId: tid, ...e } });
  }

  // ─── CHART OF ACCOUNTS ─────────────────────────────────────────────────
  for (const coa of [
    { code: '1-1001', name: 'Kas', type: 'aset' },
    { code: '1-1002', name: 'Bank BCA', type: 'aset' },
    { code: '1-1003', name: 'Piutang Dagang', type: 'aset' },
    { code: '1-2001', name: 'Persediaan Barang', type: 'aset' },
    { code: '2-1001', name: 'Hutang Dagang', type: 'kewajiban' },
    { code: '3-1001', name: 'Modal Disetor', type: 'ekuitas' },
    { code: '4-1001', name: 'Pendapatan Penjualan', type: 'pendapatan' },
    { code: '5-1001', name: 'Beban Pokok Penjualan', type: 'beban' },
    { code: '5-1002', name: 'Beban Gaji', type: 'beban' },
    { code: '5-1003', name: 'Beban Operasional', type: 'beban' },
  ]) {
    await prisma.chartOfAccount.upsert({ where: { code: coa.code }, update: {}, create: { tenantId: tid, ...coa, active: true } });
  }

  // ─── BANK ACCOUNTS ─────────────────────────────────────────────────────
  for (const ba of [
    { bankName: 'BCA', accountName: 'Gentong Mas', accountNo: 'BCA-1234567890', balance: 120000000, active: true },
    { bankName: 'Mandiri', accountName: 'Gentong Mas', accountNo: 'MDR-0987654321', balance: 45000000, active: true },
  ]) {
    const exists = await prisma.bankAccount.findFirst({ where: { tenantId: tid, accountNo: ba.accountNo } });
    if (!exists) await prisma.bankAccount.create({ data: { tenantId: tid, ...ba } });
  }

  // ─── DRIVER AREAS ──────────────────────────────────────────────────────
  for (const da of [
    { name: 'Eko Prasetyo', areas: [{ wilayah: 'Surabaya Pusat', jadwal: 'Senin-Jumat' }] },
    { name: 'Ahmad Fauzi', areas: [{ wilayah: 'Surabaya Selatan', jadwal: 'Senin-Sabtu' }] },
    { name: 'Bambang Wibowo', areas: [{ wilayah: 'Sidoarjo', jadwal: 'Selasa-Sabtu' }] },
    { name: 'Slamet Riyadi', areas: [{ wilayah: 'Gresik', jadwal: 'Senin-Jumat' }] },
    { name: 'Ridwan Efendi', areas: [{ wilayah: 'Surabaya Utara', jadwal: 'Senin-Sabtu' }] },
  ]) {
    const exists = await prisma.driverArea.findFirst({ where: { tenantId: tid, name: da.name } });
    if (!exists) await prisma.driverArea.create({ data: { tenantId: tid, ...da } });
  }

  // ─── APP SETTINGS ──────────────────────────────────────────────────────
  for (const s of [
    { key: 'company_name', value: 'Gentong Mas' },
    { key: 'company_address', value: 'Jl. Industri No. 1, Surabaya 60123' },
    { key: 'company_phone', value: '031-1234567' },
    { key: 'company_email', value: 'info@gentongmas.com' },
    { key: 'company_npwp', value: '01.234.567.8-901.000' },
    { key: 'currency', value: 'IDR' },
    { key: 'timezone', value: 'Asia/Jakarta' },
  ]) {
    const existing = await prisma.appSetting.findFirst({ where: { tenantId: tid, key: s.key } });
    if (existing) {
      await prisma.appSetting.update({ where: { id: existing.id }, data: { value: s.value } });
    } else {
      await prisma.appSetting.create({ data: { tenantId: tid, ...s } });
    }
  }

  // ─── POS CATEGORIES ────────────────────────────────────────────────────
  for (const cat of [
    { name: 'Sparepart', active: true },
    { name: 'Oli & Pelumas', active: true },
    { name: 'Aksesoris', active: true },
  ]) {
    const exists = await prisma.posCategory.findFirst({ where: { tenantId: tid, name: cat.name } });
    if (!exists) await prisma.posCategory.create({ data: { tenantId: tid, ...cat } });
  }

  // ─── POS USER ──────────────────────────────────────────────────────────
  await prisma.posUser.upsert({
    where: { username: 'kasir1' },
    update: {},
    create: { tenantId: tid, username: 'kasir1', password: await bcrypt.hash('kasir123', 10), name: 'Fitri Handayani', role: 'kasir', active: true },
  });

  // ─── DEMO ORDER ────────────────────────────────────────────────────────
  const prod1 = await prisma.product.findFirst({ where: { tenantId: tid, sku: 'HDA-001' } });
  const cust1 = await prisma.customer.findFirst({ where: { tenantId: tid, name: 'Bengkel Maju Jaya' } });
  if (prod1 && cust1) {
    const existingOrder = await prisma.order.findFirst({ where: { tenantId: tid, customerId: cust1.id } });
    if (!existingOrder) {
      await prisma.order.create({
        data: {
          tenantId: tid,
          namaCustomer: cust1.name,
          salesName: 'Budi Santoso',
          status: 'confirmed',
          totalHarga: Number(prod1.hargaJual) * 5,
          alamat: cust1.address ?? '',
          items: [{ productId: prod1.id, qty: 5, harga: Number(prod1.hargaJual) }],
          customerId: cust1.id,
          orderItems: {
            create: [{ tenantId: tid, productId: prod1.id, nama: prod1.name, qty: 5, harga: prod1.hargaJual, subtotal: Number(prod1.hargaJual) * 5 }],
          },
        },
      });
    }
  }

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────
  const adminUser = await prisma.user.findFirst({ where: { tenantId: tid, email: 'admin@example.com' } });
  if (adminUser) {
    for (const n of [
      { recipient: adminUser.id, title: 'Stok Menipis', message: 'Stok Kampas Kopling Kawasaki tersisa 45 pcs', status: 'unread' },
      { recipient: adminUser.id, title: 'Order Baru', message: 'Order baru dari Bengkel Maju Jaya senilai Rp 275.000', status: 'unread' },
      { recipient: adminUser.id, title: 'Sync Kledo Berhasil', message: 'Sinkronisasi produk Kledo selesai: 24 produk diperbarui', status: 'read' },
    ]) {
      const exists = await prisma.notification.findFirst({ where: { tenantId: tid, title: n.title, recipient: adminUser.id } });
      if (!exists) await prisma.notification.create({ data: { tenantId: tid, ...n } });
    }
  }

  // ─── ACCOUNT COA INDONESIA ─────────────────────────────────────────────
  const coaIndonesia: { code: string; name: string; type: string; parentCode?: string }[] = [
    { code: '1000', name: 'ASET', type: 'ASSET' },
    { code: '1100', name: 'Aset Lancar', type: 'ASSET', parentCode: '1000' },
    { code: '1101', name: 'Kas', type: 'ASSET', parentCode: '1100' },
    { code: '1102', name: 'Bank BCA', type: 'ASSET', parentCode: '1100' },
    { code: '1103', name: 'Bank Mandiri', type: 'ASSET', parentCode: '1100' },
    { code: '1110', name: 'Piutang Dagang', type: 'ASSET', parentCode: '1100' },
    { code: '1111', name: 'Cad. Kerugian Piutang', type: 'ASSET', parentCode: '1100' },
    { code: '1120', name: 'Uang Muka Pembelian', type: 'ASSET', parentCode: '1100' },
    { code: '1130', name: 'PPN Masukan', type: 'ASSET', parentCode: '1100' },
    { code: '1140', name: 'Biaya Dibayar Dimuka', type: 'ASSET', parentCode: '1100' },
    { code: '1150', name: 'Persediaan Barang Dagang', type: 'ASSET', parentCode: '1100' },
    { code: '1200', name: 'Aset Tidak Lancar', type: 'ASSET', parentCode: '1000' },
    { code: '1210', name: 'Tanah', type: 'ASSET', parentCode: '1200' },
    { code: '1220', name: 'Bangunan', type: 'ASSET', parentCode: '1200' },
    { code: '1221', name: 'Akum. Penyusutan Bangunan', type: 'ASSET', parentCode: '1200' },
    { code: '1230', name: 'Peralatan & Mesin', type: 'ASSET', parentCode: '1200' },
    { code: '1231', name: 'Akum. Penyusutan Peralatan', type: 'ASSET', parentCode: '1200' },
    { code: '1240', name: 'Kendaraan', type: 'ASSET', parentCode: '1200' },
    { code: '1241', name: 'Akum. Penyusutan Kendaraan', type: 'ASSET', parentCode: '1200' },
    { code: '2000', name: 'LIABILITAS', type: 'LIABILITY' },
    { code: '2100', name: 'Liabilitas Jangka Pendek', type: 'LIABILITY', parentCode: '2000' },
    { code: '2101', name: 'Hutang Dagang', type: 'LIABILITY', parentCode: '2100' },
    { code: '2102', name: 'Hutang Gaji', type: 'LIABILITY', parentCode: '2100' },
    { code: '2103', name: 'Uang Muka Penjualan', type: 'LIABILITY', parentCode: '2100' },
    { code: '2104', name: 'PPN Keluaran', type: 'LIABILITY', parentCode: '2100' },
    { code: '2105', name: 'Hutang PPh 21', type: 'LIABILITY', parentCode: '2100' },
    { code: '2106', name: 'Hutang PPh 23', type: 'LIABILITY', parentCode: '2100' },
    { code: '2107', name: 'Biaya Masih Harus Dibayar', type: 'LIABILITY', parentCode: '2100' },
    { code: '2200', name: 'Liabilitas Jangka Panjang', type: 'LIABILITY', parentCode: '2000' },
    { code: '2201', name: 'Hutang Bank BCA', type: 'LIABILITY', parentCode: '2200' },
    { code: '2202', name: 'Hutang Bank Mandiri', type: 'LIABILITY', parentCode: '2200' },
    { code: '3000', name: 'EKUITAS', type: 'EQUITY' },
    { code: '3101', name: 'Modal Disetor', type: 'EQUITY', parentCode: '3000' },
    { code: '3102', name: 'Laba Ditahan', type: 'EQUITY', parentCode: '3000' },
    { code: '3103', name: 'Laba Tahun Berjalan', type: 'EQUITY', parentCode: '3000' },
    { code: '4000', name: 'PENDAPATAN', type: 'REVENUE' },
    { code: '4101', name: 'Penjualan', type: 'REVENUE', parentCode: '4000' },
    { code: '4102', name: 'Retur Penjualan', type: 'REVENUE', parentCode: '4000' },
    { code: '4103', name: 'Diskon Penjualan', type: 'REVENUE', parentCode: '4000' },
    { code: '4201', name: 'Pendapatan Lain-lain', type: 'REVENUE', parentCode: '4000' },
    { code: '4202', name: 'Pendapatan Bunga', type: 'REVENUE', parentCode: '4000' },
    { code: '5000', name: 'HARGA POKOK PENJUALAN', type: 'EXPENSE' },
    { code: '5101', name: 'HPP Barang Dagang', type: 'EXPENSE', parentCode: '5000' },
    { code: '5102', name: 'Retur Pembelian', type: 'EXPENSE', parentCode: '5000' },
    { code: '5103', name: 'Diskon Pembelian', type: 'EXPENSE', parentCode: '5000' },
    { code: '6000', name: 'BEBAN OPERASIONAL', type: 'EXPENSE' },
    { code: '6100', name: 'Beban Penjualan', type: 'EXPENSE', parentCode: '6000' },
    { code: '6101', name: 'Beban Gaji Sales', type: 'EXPENSE', parentCode: '6100' },
    { code: '6102', name: 'Beban Komisi', type: 'EXPENSE', parentCode: '6100' },
    { code: '6103', name: 'Beban Transportasi', type: 'EXPENSE', parentCode: '6100' },
    { code: '6104', name: 'Beban Marketing & Promosi', type: 'EXPENSE', parentCode: '6100' },
    { code: '6200', name: 'Beban Umum & Administrasi', type: 'EXPENSE', parentCode: '6000' },
    { code: '6201', name: 'Beban Gaji Karyawan', type: 'EXPENSE', parentCode: '6200' },
    { code: '6202', name: 'Beban Listrik & Air', type: 'EXPENSE', parentCode: '6200' },
    { code: '6203', name: 'Beban Sewa', type: 'EXPENSE', parentCode: '6200' },
    { code: '6204', name: 'Beban Telepon & Internet', type: 'EXPENSE', parentCode: '6200' },
    { code: '6205', name: 'Beban Perlengkapan Kantor', type: 'EXPENSE', parentCode: '6200' },
    { code: '6206', name: 'Beban Penyusutan', type: 'EXPENSE', parentCode: '6200' },
    { code: '6207', name: 'Beban Asuransi', type: 'EXPENSE', parentCode: '6200' },
    { code: '6208', name: 'Beban Pemeliharaan', type: 'EXPENSE', parentCode: '6200' },
    { code: '7000', name: 'BEBAN LAIN-LAIN', type: 'EXPENSE' },
    { code: '7101', name: 'Beban Bunga Bank', type: 'EXPENSE', parentCode: '7000' },
    { code: '7102', name: 'Beban Administrasi Bank', type: 'EXPENSE', parentCode: '7000' },
    { code: '7103', name: 'Beban Pajak', type: 'EXPENSE', parentCode: '7000' },
    { code: '7104', name: 'Kerugian Selisih Kurs', type: 'EXPENSE', parentCode: '7000' },
  ];

  const nb = (t: string) => ['ASSET', 'EXPENSE'].includes(t) ? 'DEBIT' : 'CREDIT';
  const accMap = new Map<string, string>();

  for (const c of coaIndonesia.filter(x => !x.parentCode)) {
    const a = await prisma.account.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: { tenantId: tid, code: c.code, name: c.name, type: c.type as any, isActive: true, normalBalance: nb(c.type) },
    });
    accMap.set(c.code, a.id);
  }

  for (const c of coaIndonesia.filter(x => !!x.parentCode)) {
    const parentId = accMap.get(c.parentCode!);
    const a = await prisma.account.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: { tenantId: tid, code: c.code, name: c.name, type: c.type as any, parentId, isActive: true, normalBalance: nb(c.type) },
    });
    accMap.set(c.code, a.id);
  }

  // ─── FISCAL YEAR ───────────────────────────────────────────────────────
  const yr = new Date().getFullYear();
  const fyName = `Tahun ${yr}`;
  const existFY = await prisma.fiscalYear.findFirst({ where: { tenantId: tid, nama: fyName } });
  if (!existFY) {
    const fy = await prisma.fiscalYear.create({
      data: { tenantId: tid, nama: fyName, startDate: new Date(`${yr}-01-01`), endDate: new Date(`${yr}-12-31`), status: 'OPEN' },
    });
    for (let m = 1; m <= 12; m++) {
      const s = new Date(yr, m - 1, 1);
      const e = new Date(yr, m, 0);
      await prisma.fiscalPeriod.create({
        data: { tenantId: tid, fiscalYearId: fy.id, bulan: m, tahun: yr, startDate: s, endDate: e, status: 'OPEN' },
      });
    }
  }

  console.log('✅ Seed selesai: tenant, admin, produk, pelanggan, supplier, karyawan, COA, POS, notifikasi, fiscal year');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
