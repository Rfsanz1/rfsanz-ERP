import ExcelJS from 'exceljs';

export async function productsToExcelBuffer(products: any[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Products');
  ws.columns = [
    { header: 'id', key: 'id', width: 36 },
    { header: 'sku', key: 'sku', width: 20 },
    { header: 'name', key: 'name', width: 40 },
    { header: 'price', key: 'price', width: 12 },
    { header: 'stock', key: 'stock', width: 12 },
    { header: 'unit', key: 'unit', width: 12 },
  ];
  for (const p of products) ws.addRow({ id: p.id, sku: p.sku, name: p.name, price: Number(p.hargaJual ?? p.price ?? 0), stock: p.stok ?? p.stock ?? 0, unit: p.unit?.name ?? p.unit ?? '' });
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function stockOpnameToExcelBuffer(opname: any) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('StockOpname');
  ws.columns = [
    { header: 'productId', key: 'productId', width: 36 },
    { header: 'sku', key: 'sku', width: 20 },
    { header: 'name', key: 'name', width: 40 },
    { header: 'stokSistem', key: 'stokSistem', width: 12 },
    { header: 'stokFisik', key: 'stokFisik', width: 12 },
    { header: 'selisih', key: 'selisih', width: 12 },
    { header: 'note', key: 'note', width: 40 },
  ];
  for (const item of opname.items || []) {
    ws.addRow({
      productId: item.productId,
      sku: item.product?.sku ?? item.product?.barcode ?? '',
      name: item.product?.name ?? '',
      stokSistem: Number(item.stokSistem ?? 0),
      stokFisik: Number(item.stokFisik ?? 0),
      selisih: Number(item.selisih ?? 0),
      note: item.note ?? '',
    });
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function excelBufferToStockOpnameItems(buffer: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);
  const ws = wb.getWorksheet('StockOpname') || wb.worksheets[0];
  const rows: any[] = [];
  ws.eachRow((row, idx) => {
    if (idx === 1) return;
    const productId = row.getCell(1).value?.toString() ?? undefined;
    const sku = row.getCell(2).value?.toString() ?? undefined;
    const name = row.getCell(3).value?.toString() ?? undefined;
    const stokSistem = Number(row.getCell(4).value ?? 0);
    const stokFisik = Number(row.getCell(5).value ?? 0);
    const selisih = Number(row.getCell(6).value ?? stokFisik - stokSistem);
    const note = row.getCell(7).value?.toString() ?? undefined;
    rows.push({ productId, sku, name, stokSistem, stokFisik, selisih, note });
  });
  return rows;
}

export async function excelBufferToProducts(buffer: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);
  const ws = wb.getWorksheet('Products') || wb.worksheets[0];
  const rows: any[] = [];
  ws.eachRow((row, idx) => {
    if (idx === 1) return; // skip header
    const id = row.getCell(1).value?.toString() ?? undefined;
    const sku = row.getCell(2).value?.toString() ?? undefined;
    const name = row.getCell(3).value?.toString() ?? undefined;
    const price = Number(row.getCell(4).value ?? 0);
    const stock = Number(row.getCell(5).value ?? 0);
    rows.push({ id, sku, name, price, stock });
  });
  return rows;
}
