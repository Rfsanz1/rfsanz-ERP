import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { NotificationGateway } from './notification.gateway.js';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationGateway) private readonly notificationGateway: NotificationGateway,
  ) {}

  async findAll(recipient: string) {
    return this.prisma.notification.findMany({
      where: { recipient },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date(), status: 'read' },
    });
  }

  async create(recipient: string, title: string, message: string) {
    const notification = await this.prisma.notification.create({
      data: { recipient, title, message, status: 'pending' } as any,
    });
    this.notificationGateway.broadcastNotification({ recipient, title, message });
    return notification;
  }

  async markAllAsRead(recipient: string) {
    await this.prisma.notification.updateMany({
      where: { recipient, readAt: null },
      data: { readAt: new Date(), status: 'read' },
    });
    return { data: null, message: 'Semua notifikasi telah dibaca' };
  }

  async deleteOne(id: string) {
    await this.prisma.notification.delete({ where: { id } });
    return { data: null, message: 'Notifikasi berhasil dihapus' };
  }

  async sendWhatsApp(target: string, message: string) {
    if (!process.env.FONNTE_TOKEN) return { skipped: true, reason: 'FONNTE_TOKEN tidak dikonfigurasi' };
    try {
      const resp = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: process.env.FONNTE_TOKEN },
        body: JSON.stringify({ target, message }),
      });
      const result: any = await resp.json();
      await this.prisma.notification.create({
        data: {
          recipient: target,
          title: 'WhatsApp',
          message,
          status: result.status ? 'sent' : 'failed',
        } as any,
      });
      return result;
    } catch (e: any) {
      return { error: e.message };
    }
  }

  private async sendFonnte(target: string, message: string): Promise<any> {
    if (!process.env.FONNTE_TOKEN || !target) return { skipped: true };
    try {
      const resp = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: process.env.FONNTE_TOKEN },
        body: JSON.stringify({ target, message }),
      });
      return await resp.json();
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async notifyGrupInvoice(data: {
    orderId: string | number;
    noInvoice?: string | null;
    namaCustomer: string;
    noHp?: string | null;
    salesName?: string | null;
    items: Array<{ nama: string; qty: number; harga: number }>;
    totalHarga: number;
    metodePembayaran?: string | null;
    pembayaranAwal?: number | null;
    status?: string | null;
  }) {
    const groupId = process.env.FONNTE_GROUP_INVOICE;
    if (!groupId) return { skipped: true, reason: 'FONNTE_GROUP_INVOICE tidak dikonfigurasi' };
    const fmt = (v: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    const now = new Date().toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const noInv = data.noInvoice ?? `#${data.orderId}`;
    const statusLabel = (data.status === 'paid' || data.status === 'lunas') ? '✅ Lunas' : data.status === 'partial' ? '⏳ Sebagian' : '🕐 Pending';
    const detailItems = (data.items ?? [])
      .map(it => `  • ${it.nama} ×${it.qty} = ${fmt(Number(it.harga) * Number(it.qty))}`)
      .join('\n');
    const message =
      `🛒 *Order Baru Masuk!*\n\n` +
      `📋 Invoice     : *${noInv}*\n` +
      `👤 Customer    : *${data.namaCustomer}${data.noHp ? ' ' + data.noHp : ''}*\n` +
      (data.noHp ? `📞 Telepon     : ${data.noHp}\n` : '') +
      (data.salesName ? `👨‍💼 Sales       : ${data.salesName}\n` : '') +
      `\n📦 *Detail Order:*\n${detailItems}\n\n` +
      `💰 Total       : *${fmt(data.totalHarga)}*\n` +
      (data.metodePembayaran ? `💳 Pembayaran  : ${data.metodePembayaran}${data.pembayaranAwal ? ': ' + fmt(data.pembayaranAwal) : ''}\n` : '') +
      `📌 Status      : ${statusLabel}\n\n` +
      `_RFSANZ ERP • ${now}_`;
    return this.sendFonnte(groupId, message);
  }

  async notifyGrupBuktiTF(data: {
    orderId: string | number;
    namaCustomer: string;
    noHp?: string | null;
    totalHarga: number;
    bankTujuan?: string | null;
    salesName?: string | null;
    fotoUrl?: string | null;
  }) {
    const groupId = process.env.FONNTE_GROUP_BUKTI_TF;
    if (!groupId) return { skipped: true, reason: 'FONNTE_GROUP_BUKTI_TF tidak dikonfigurasi' };
    const fmt = (v: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    const idStr = String(data.orderId).toUpperCase();
    const message =
      `💸 *Bukti Transfer Masuk*\n\n` +
      `Order: #${idStr}\n` +
      `Customer: ${data.namaCustomer}${data.noHp ? ' – ' + data.noHp : ''}\n` +
      `Total: ${fmt(data.totalHarga)}\n` +
      (data.bankTujuan ? `Bank Tujuan: ${data.bankTujuan}\n` : '') +
      (data.salesName ? `Sales: ${data.salesName}\n` : '') +
      (data.fotoUrl
        ? `\n🖼️ *Foto Bukti Transfer:*\n${data.fotoUrl}\n\n_(Tap link di atas untuk lihat foto. Tersimpan permanen — bisa dibuka kapan saja.)_`
        : '');
    return this.sendFonnte(groupId, message);
  }

  async notifyCustomerOrder(data: {
    noHp: string;
    namaCustomer: string;
    items: Array<{ nama: string; qty: number; harga: number }>;
    totalHarga: number;
    ongkir?: number | null;
    alamat?: string | null;
    metodePembayaran?: string | null;
    status?: string | null;
    lokasiToken?: string | null;
  }) {
    if (!process.env.FONNTE_TOKEN || !data.noHp) return { skipped: true, reason: 'FONNTE_TOKEN atau nomor HP tidak tersedia' };
    const fmt = (v: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    const statusLabel = (data.status === 'paid' || data.status === 'lunas') ? 'Lunas' : data.status === 'partial' ? 'Sebagian' : 'Pending';
    const firstItem = data.items?.[0];
    const appUrl = process.env.APP_URL ?? `http://${process.env.SERVER_IP ?? 'localhost'}:6000`;
    const lokasiUrl = data.lokasiToken ? `${appUrl}/loc/${data.lokasiToken}` : null;

    let message = `Halo Kak 👋\n\nTerima kasih sudah mengisi form Purchase Order 🙏\n\n`;
    if (firstItem) {
      message += `📦 *Nama Produk:* ${firstItem.nama}\n`;
      message += `🔢 *Jumlah:* ${firstItem.qty} unit\n`;
      message += `💰 *Harga:* ${fmt(Number(firstItem.harga))}\n`;
    }
    if (data.ongkir) message += `🚚 *Ongkir:* ${fmt(data.ongkir)}\n`;
    if (data.alamat) message += `📍 *Alamat:* ${data.alamat}\n`;
    message += `\n💳 *Total: ${fmt(data.totalHarga)}*\n`;
    message += `✅ *Status Pembayaran:* ${statusLabel}\n`;
    if (lokasiUrl) {
      message +=
        `\n📍 *Bagikan Lokasi Anda*\n` +
        `Agar driver kami mudah menemukan rumah Anda, mohon bagikan titik lokasi GPS Anda:\n` +
        `👉 ${lokasiUrl}\n`;
    }
    message += `\nJika ada pertanyaan, jangan ragu menghubungi kami 😊\nTerima kasih 🙌`;
    return this.sendFonnte(data.noHp, message);
  }
}
