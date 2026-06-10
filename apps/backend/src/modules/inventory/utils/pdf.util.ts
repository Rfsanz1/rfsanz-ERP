import PDFDocument from 'pdfkit';

export function transferToPdfBuffer(transfer: any) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers: any[] = [];
  doc.on('data', (d) => buffers.push(d));
  doc.on('end', () => {});
  doc.fontSize(16).text(`Surat Jalan - ${transfer.noTransfer || transfer.id}`);
  doc.moveDown();
  doc.fontSize(12).text(`Dari: ${transfer.fromWarehouse}`);
  doc.text(`Ke: ${transfer.toWarehouse}`);
  doc.text(`Tanggal: ${new Date(transfer.updatedAt || transfer.createdAt).toLocaleString()}`);
  doc.moveDown();
  doc.text('Items:');
  transfer.items?.forEach((it: any, i: number) => {
    doc.text(`${i + 1}. ${it.product?.name || it.productId} - Qty: ${it.qty}`);
  });
  doc.end();
  return new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
}
