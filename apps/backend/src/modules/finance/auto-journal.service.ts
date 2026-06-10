import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AutoJournalService {
  private readonly logger = new Logger(AutoJournalService.name);
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private genNomor(prefix = 'AJE'): string {
    const d = new Date();
    return `${prefix}/${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}/${String(Date.now()).slice(-6)}`;
  }

  private async findAccount(codePrefix: string): Promise<string | null> {
    const acc = await this.prisma.account.findFirst({
      where: { code: { startsWith: codePrefix }, isActive: true },
      orderBy: { code: 'asc' },
    });
    return acc?.id ?? null;
  }

  private async createAutoJournal(
    nomor: string,
    tanggal: Date,
    deskripsi: string,
    lines: { accountId: string; debit: number; kredit: number; deskripsi?: string }[],
  ) {
    try {
      return await this.prisma.journal.create({
        data: {
          nomor,
          tanggal,
          deskripsi,
          status: 'POSTED',
          lines: { create: lines },
        },
      });
    } catch (err) {
      this.logger.error(`Auto journal gagal: ${deskripsi}`, err);
      return null;
    }
  }

  /** Saat Sales Invoice POSTED → Debit Piutang (1200), Kredit Pendapatan (4000) */
  async onSalesInvoicePosted(invoiceId: string, amount: number, tanggal: Date, ref: string) {
    const [piutang, pendapatan] = await Promise.all([
      this.findAccount('12'),
      this.findAccount('40'),
    ]);
    if (!piutang || !pendapatan) {
      this.logger.warn('Auto journal sales: akun 12xx atau 40xx tidak ditemukan');
      return;
    }
    await this.createAutoJournal(
      this.genNomor('SINV'),
      tanggal,
      `Invoice Penjualan: ${ref}`,
      [
        { accountId: piutang, debit: amount, kredit: 0, deskripsi: `Piutang - ${ref}` },
        { accountId: pendapatan, debit: 0, kredit: amount, deskripsi: `Pendapatan - ${ref}` },
      ],
    );
  }

  /** Saat Purchase Invoice POSTED → Debit Pembelian (50xx), Kredit Hutang Dagang (21xx) */
  async onPurchaseInvoicePosted(invoiceId: string, amount: number, tanggal: Date, ref: string) {
    const [pembelian, hutang] = await Promise.all([
      this.findAccount('50'),
      this.findAccount('21'),
    ]);
    if (!pembelian || !hutang) {
      this.logger.warn('Auto journal purchase: akun 50xx atau 21xx tidak ditemukan');
      return;
    }
    await this.createAutoJournal(
      this.genNomor('PINV'),
      tanggal,
      `Invoice Pembelian: ${ref}`,
      [
        { accountId: pembelian, debit: amount, kredit: 0, deskripsi: `Pembelian - ${ref}` },
        { accountId: hutang, debit: 0, kredit: amount, deskripsi: `Hutang - ${ref}` },
      ],
    );
  }

  /** Payment diterima → Debit Kas/Bank (10xx/11xx), Kredit Piutang (12xx) */
  async onPaymentReceived(paymentId: string, amount: number, tanggal: Date, ref: string, isBankPayment = true) {
    const [kasBank, piutang] = await Promise.all([
      this.findAccount(isBankPayment ? '11' : '10'),
      this.findAccount('12'),
    ]);
    if (!kasBank || !piutang) {
      this.logger.warn('Auto journal payment received: akun tidak ditemukan');
      return;
    }
    await this.createAutoJournal(
      this.genNomor('RCV'),
      tanggal,
      `Penerimaan Pembayaran: ${ref}`,
      [
        { accountId: kasBank, debit: amount, kredit: 0, deskripsi: `Terima - ${ref}` },
        { accountId: piutang, debit: 0, kredit: amount, deskripsi: `Lunasi Piutang - ${ref}` },
      ],
    );
  }

  /** Payment dibayar → Debit Hutang Dagang (21xx), Kredit Kas/Bank (10xx/11xx) */
  async onPaymentMade(paymentId: string, amount: number, tanggal: Date, ref: string, isBankPayment = true) {
    const [hutang, kasBank] = await Promise.all([
      this.findAccount('21'),
      this.findAccount(isBankPayment ? '11' : '10'),
    ]);
    if (!hutang || !kasBank) {
      this.logger.warn('Auto journal payment made: akun tidak ditemukan');
      return;
    }
    await this.createAutoJournal(
      this.genNomor('PMT'),
      tanggal,
      `Pembayaran Hutang: ${ref}`,
      [
        { accountId: hutang, debit: amount, kredit: 0, deskripsi: `Lunasi Hutang - ${ref}` },
        { accountId: kasBank, debit: 0, kredit: amount, deskripsi: `Bayar - ${ref}` },
      ],
    );
  }

  /** Barang keluar inventory → Debit HPP (50xx), Kredit Persediaan (14xx) */
  async onInventoryOut(moveId: string, amount: number, tanggal: Date, ref: string) {
    const [hpp, persediaan] = await Promise.all([
      this.findAccount('50'),
      this.findAccount('14'),
    ]);
    if (!hpp || !persediaan) {
      this.logger.warn('Auto journal inventory out: akun 50xx atau 14xx tidak ditemukan');
      return;
    }
    await this.createAutoJournal(
      this.genNomor('COGS'),
      tanggal,
      `HPP Barang Keluar: ${ref}`,
      [
        { accountId: hpp, debit: amount, kredit: 0, deskripsi: `HPP - ${ref}` },
        { accountId: persediaan, debit: 0, kredit: amount, deskripsi: `Persediaan keluar - ${ref}` },
      ],
    );
  }
}
