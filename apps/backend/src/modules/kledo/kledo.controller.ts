import {
  Controller, Get, Post, Put, Delete,
  Body, Query, Param, Inject, HttpStatus, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { KledoService } from './kledo.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

/** Selalu kirim respons JSON — tidak pernah throw sehingga tidak ada HTML error page. */
function ok(res: Response, data: unknown, status = HttpStatus.OK) {
  return res.status(status).json(data);
}
function fail(res: Response, message: string, status = HttpStatus.INTERNAL_SERVER_ERROR) {
  return res.status(status).json({ success: false, message });
}

@Controller('kledo')
export class KledoController {
  constructor(@Inject(KledoService) private readonly svc: KledoService) {}

  /* ── Status (publik — frontend cek koneksi tanpa auth) ─────────────── */
  @Get('status')
  async getStatus(@Res() res: Response) {
    try { return ok(res, await this.svc.getStatus()); }
    catch (e: any) { return ok(res, { connected: false, message: e?.message ?? 'Gagal cek status' }); }
  }

  /* ── Config — read & write (Settings page) ──────────────────────────── */
  @Get('config')
  @UseGuards(JwtAuthGuard)
  async getConfig(@Res() res: Response) {
    try { return ok(res, await this.svc.getConfig()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil konfigurasi'); }
  }

  @Put('config')
  @UseGuards(JwtAuthGuard)
  async saveConfig(
    @Body() dto: { token?: string; baseUrl?: string },
    @Res() res: Response,
  ) {
    try {
      const token = (dto?.token ?? '').trim();
      if (!token) return fail(res, 'Token tidak boleh kosong', HttpStatus.BAD_REQUEST);
      const result = await this.svc.saveConfig(token, dto?.baseUrl?.trim() || undefined);
      return ok(res, { success: true, ...result });
    } catch (e: any) { return fail(res, e?.message ?? 'Gagal menyimpan konfigurasi'); }
  }

  /* ── SPM Brands (referensi, read-only) ─────────────────────────────── */
  @Get('spm-brands')
  async getSpmBrands(@Res() res: Response) {
    try { return ok(res, this.svc.getSpmBrands()); }
    catch (e: any) { return fail(res, e?.message ?? 'Error'); }
  }

  /* ── Produk ─────────────────────────────────────────────────────────── */
  @Get('products')
  @UseGuards(JwtAuthGuard)
  async getProducts(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getProducts(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil produk Kledo'); }
  }

  /**
   * Import produk dari Kledo ke database lokal ERP.
   * POST /api/kledo/import-products
   */
  @Post('import-products')
  @UseGuards(JwtAuthGuard)
  async importProducts(@Res() res: Response) {
    try { return ok(res, await this.svc.importProducts()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal import produk dari Kledo'); }
  }

  /* ── Kontak ─────────────────────────────────────────────────────────── */
  @Get('contacts')
  @UseGuards(JwtAuthGuard)
  async getContacts(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getContacts(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil kontak Kledo'); }
  }

  @Post('contacts')
  @UseGuards(JwtAuthGuard)
  async createContact(@Body() dto: any, @Res() res: Response) {
    try { return ok(res, await this.svc.createContact(dto), HttpStatus.CREATED); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal membuat kontak Kledo'); }
  }

  @Put('contacts/:id')
  @UseGuards(JwtAuthGuard)
  async updateContact(
    @Param('id') id: string,
    @Body() dto: any,
    @Res() res: Response,
  ) {
    try { return ok(res, await this.svc.updateContact(Number(id), dto)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengupdate kontak'); }
  }

  @Delete('contacts/:id')
  @UseGuards(JwtAuthGuard)
  async deleteContact(@Param('id') id: string, @Res() res: Response) {
    try { return ok(res, await this.svc.deleteContact(Number(id))); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal menghapus kontak'); }
  }

  /* ── Purchase Invoices (Tagihan Pembelian) ──────────────────────────── */
  @Get('purchase-invoices')
  @UseGuards(JwtAuthGuard)
  async getPurchaseInvoices(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getPurchaseInvoices(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil purchase invoice Kledo'); }
  }

  /* ── Expenses ───────────────────────────────────────────────────────── */
  @Get('expenses')
  @UseGuards(JwtAuthGuard)
  async getExpenses(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getExpenses(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil expenses Kledo'); }
  }

  /* ── Invoice ────────────────────────────────────────────────────────── */
  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  async getInvoices(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getInvoices(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil invoice Kledo'); }
  }

  @Post('invoices')
  @UseGuards(JwtAuthGuard)
  async createInvoice(@Body() dto: any, @Res() res: Response) {
    try { return ok(res, await this.svc.createInvoice(dto), HttpStatus.CREATED); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal membuat invoice'); }
  }

  /**
   * Push invoice lokal ERP ke Kledo.
   * POST /api/kledo/push-invoice/:localInvoiceId
   */
  @Post('push-invoice/:localInvoiceId')
  @UseGuards(JwtAuthGuard)
  async pushInvoice(@Param('localInvoiceId') localInvoiceId: string, @Res() res: Response) {
    try { return ok(res, await this.svc.pushInvoice(localInvoiceId)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal push invoice ke Kledo'); }
  }

  /* ── Sync ───────────────────────────────────────────────────────────── */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncProducts(@Res() res: Response) {
    try { return ok(res, await this.svc.syncProducts()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal sync produk'); }
  }

  @Post('sync-contacts')
  @UseGuards(JwtAuthGuard)
  async syncContacts(@Res() res: Response) {
    try { return ok(res, await this.svc.syncContacts()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal sync kontak'); }
  }

  @Post('sync-invoices')
  @UseGuards(JwtAuthGuard)
  async syncInvoices(@Query('limit') limit: string | undefined, @Res() res: Response) {
    try { return ok(res, await this.svc.syncInvoices(limit ? Number(limit) : 500)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal sync invoice'); }
  }

  @Post('sync-all')
  @UseGuards(JwtAuthGuard)
  async syncAll(@Res() res: Response) {
    try { return ok(res, await this.svc.syncAll()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal sync semua'); }
  }

  @Post('auto-sync')
  @UseGuards(JwtAuthGuard)
  async autoSync(@Res() res: Response) {
    try { return ok(res, await this.svc.autoSync()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal auto sync'); }
  }

  @Get('sync-logs')
  @UseGuards(JwtAuthGuard)
  async getSyncLogs(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getSyncLogs(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil log sync'); }
  }
}
