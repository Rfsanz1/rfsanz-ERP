import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { EFakturStatus } from '@prisma/client';

export interface EFakturCSVRow {
  FK: string;
  KD_JENIS_TRANSAKSI: string;
  FG_PENGGANTI: string;
  NOMOR_FAKTUR: string;
  MASA_PAJAK: string;
  TAHUN_PAJAK: string;
  TANGGAL_FAKTUR: string;
  NPWP: string;
  NAMA: string;
  ALAMAT_LENGKAP: string;
  JUMLAH_DPP: string;
  JUMLAH_PPN: string;
  JUMLAH_PPNBM: string;
  IS_CREDITABLE: string;
}

@Injectable()
export class EFakturService {
  constructor(private prisma: PrismaService) {}

  async findAll(periode?: string) {
    const where: any = {};
    if (periode) {
      const [year, month] = periode.split('-').map(Number);
      where.tanggal = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }
    return this.prisma.eFaktur.findMany({
      where,
      include: { tax: true },
      orderBy: { tanggal: 'desc' },
    });
  }

  async findOne(id: string) {
    const ef = await this.prisma.eFaktur.findUnique({ where: { id }, include: { tax: true } });
    if (!ef) throw new NotFoundException(`E-Faktur ID ${id} tidak ditemukan`);
    return ef;
  }

  async generateNomorFaktur(): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const last = await this.prisma.eFaktur.findFirst({ orderBy: { createdAt: 'desc' } });

    let seq = 1;
    if (last) {
      const parts = last.nomorFaktur.split('.');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    const seqStr = String(seq).padStart(8, '0');
    const seqFront = seqStr.slice(0, 3);
    const seqMid = seqStr.slice(3, 6);
    return `${seqFront}.${seqMid}-${yy}.${seqStr}`;
  }

  async createEFaktur(data: {
    referenceId?: string;
    npwpPembeli?: string;
    namaPembeli?: string;
    nilaiDPP: number;
    nilaiPPN: number;
    taxId?: string;
    tanggal?: Date;
  }) {
    const nomorFaktur = await this.generateNomorFaktur();
    return this.prisma.eFaktur.create({
      data: {
        nomorFaktur,
        tanggal: data.tanggal ?? new Date(),
        referenceId: data.referenceId,
        npwpPembeli: data.npwpPembeli,
        namaPembeli: data.namaPembeli,
        nilaiDPP: data.nilaiDPP,
        nilaiPPN: data.nilaiPPN,
        taxId: data.taxId,
        status: EFakturStatus.DRAFT,
      },
      include: { tax: true },
    });
  }

  async createFromSaleInvoice(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { customer: true },
    });
    if (!sale) throw new NotFoundException(`Invoice ${saleId} tidak ditemukan`);

    const dpp = Number(sale.totalHarga) - Number(sale.diskon);
    const ppn = Number(sale.pajak);

    if (ppn <= 0) throw new BadRequestException('Invoice ini tidak memiliki PPN');

    return this.createEFaktur({
      referenceId: saleId,
      npwpPembeli: sale.customer?.npwp ?? '',
      namaPembeli: sale.customer?.name ?? sale.salesName ?? 'Umum',
      nilaiDPP: dpp,
      nilaiPPN: ppn,
      tanggal: sale.tanggal,
    });
  }

  async updateStatus(id: string, status: EFakturStatus) {
    await this.findOne(id);
    return this.prisma.eFaktur.update({ where: { id }, data: { status } });
  }

  async exportCSV(periode: string): Promise<string> {
    const efakturs = await this.findAll(periode);
    if (efakturs.length === 0) throw new BadRequestException(`Tidak ada e-Faktur untuk periode ${periode}`);

    const header = [
      'FK', 'KD_JENIS_TRANSAKSI', 'FG_PENGGANTI', 'NOMOR_FAKTUR',
      'MASA_PAJAK', 'TAHUN_PAJAK', 'TANGGAL_FAKTUR',
      'NPWP', 'NAMA', 'ALAMAT_LENGKAP',
      'JUMLAH_DPP', 'JUMLAH_PPN', 'JUMLAH_PPNBM', 'IS_CREDITABLE',
    ].join(',');

    const rows = efakturs.map((ef) => {
      const tgl = new Date(ef.tanggal);
      const masa = String(tgl.getMonth() + 1).padStart(2, '0');
      const tahun = String(tgl.getFullYear());
      const tanggalFmt = `${String(tgl.getDate()).padStart(2, '0')}/${masa}/${tahun}`;
      const npwp = (ef.npwpPembeli ?? '').replace(/\D/g, '').padEnd(15, '0');

      return [
        'FK',
        '01',
        '0',
        ef.nomorFaktur,
        masa,
        tahun,
        tanggalFmt,
        npwp,
        `"${ef.namaPembeli ?? ''}"`,
        '""',
        String(Math.round(Number(ef.nilaiDPP))),
        String(Math.round(Number(ef.nilaiPPN))),
        '0',
        '1',
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  async getRekapPPN(periode: string) {
    const [year, month] = periode.split('-').map(Number);
    if (!year || !month) throw new BadRequestException('Format periode harus YYYY-MM');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const [masukan, keluaran] = await Promise.all([
      this.prisma.taxLine.findMany({
        where: {
          tipe: 'PAID',
          createdAt: { gte: startDate, lt: endDate },
          tax: { tipe: 'PPN' },
        },
        include: { tax: true },
      }),
      this.prisma.taxLine.findMany({
        where: {
          tipe: 'COLLECTED',
          createdAt: { gte: startDate, lt: endDate },
          tax: { tipe: 'PPN' },
        },
        include: { tax: true },
      }),
    ]);

    const totalMasukan = masukan.reduce((s, l) => s + Number(l.taxAmount), 0);
    const totalKeluaran = keluaran.reduce((s, l) => s + Number(l.taxAmount), 0);
    const kurangLebih = totalKeluaran - totalMasukan;

    return {
      periode,
      ppnMasukan: { items: masukan, total: totalMasukan },
      ppnKeluaran: { items: keluaran, total: totalKeluaran },
      kurangLebih,
      status: kurangLebih > 0 ? 'KURANG_BAYAR' : kurangLebih < 0 ? 'LEBIH_BAYAR' : 'NIHIL',
    };
  }

  async generateFromInvoices(invoiceIds: string[], periode: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { id: { in: invoiceIds } },
      include: { customer: true, items: true },
    });

    const created: any[] = [];
    for (const inv of invoices) {
      const ppn = Number(inv.pajak);
      if (ppn <= 0) continue;
      const dpp = Number(inv.grandTotal) - ppn;
      const ef = await this.createEFaktur({
        referenceId: inv.id,
        npwpPembeli: (inv.customer as any)?.npwp ?? '',
        namaPembeli: (inv.customer as any)?.name ?? inv.salesName ?? 'Umum',
        nilaiDPP: dpp,
        nilaiPPN: ppn,
        tanggal: inv.tanggal,
      });
      created.push(ef);
    }

    const csv = created.length > 0 ? await this.exportCSV(periode) : '';
    return { count: created.length, csv, efakturs: created };
  }

  async getLaporanKeluaran(from: string, to: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tanggal: { gte: new Date(from), lte: new Date(to) },
        pajak: { gt: 0 },
      },
      include: { customer: true },
      orderBy: { tanggal: 'asc' },
    });

    const items = invoices.map((inv) => ({
      id: inv.id,
      noInvoice: inv.noInvoice,
      tanggal: inv.tanggal,
      namaPembeli: (inv.customer as any)?.name ?? inv.salesName ?? '-',
      npwpPembeli: (inv.customer as any)?.npwp ?? '-',
      dpp: Number(inv.grandTotal) - Number(inv.pajak),
      ppn: Number(inv.pajak),
    }));

    const totalDPP = items.reduce((s, i) => s + i.dpp, 0);
    const totalPPN = items.reduce((s, i) => s + i.ppn, 0);
    return { items, totalDPP, totalPPN, count: items.length };
  }

  async getLaporanMasukan(from: string, to: string) {
    const bills = await this.prisma.vendorBill.findMany({
      where: {
        tanggal: { gte: new Date(from), lte: new Date(to) },
        ppn: { gt: 0 },
      },
      include: { supplier: true },
      orderBy: { tanggal: 'asc' },
    }).catch(() => [] as any[]);

    const items = bills.map((b: any) => ({
      id: b.id,
      noBill: b.noBill,
      tanggal: b.tanggal,
      namaVendor: b.supplier?.name ?? '-',
      npwpVendor: b.supplier?.npwp ?? '-',
      dpp: Number(b.totalHarga) - Number(b.ppn ?? 0),
      ppn: Number(b.ppn ?? 0),
    }));

    const totalDPP = items.reduce((s: number, i: any) => s + i.dpp, 0);
    const totalPPN = items.reduce((s: number, i: any) => s + i.ppn, 0);
    return { items, totalDPP, totalPPN, count: items.length };
  }

  async remove(id: string) {
    const ef = await this.findOne(id);
    if (ef.status !== EFakturStatus.DRAFT) {
      throw new BadRequestException('Hanya e-Faktur berstatus DRAFT yang dapat dihapus');
    }
    return this.prisma.eFaktur.delete({ where: { id } });
  }
}
