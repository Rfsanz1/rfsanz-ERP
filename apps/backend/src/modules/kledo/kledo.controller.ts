import {
  Controller, Get, Post, Put, Delete,
  Body, Query, Param, Inject, HttpStatus, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { KledoService } from './kledo.service.js';

function ok(res: Response, data: unknown, status = HttpStatus.OK) {
  return res.status(status).json(data);
}
function fail(res: Response, message: string, status = HttpStatus.INTERNAL_SERVER_ERROR) {
  return res.status(status).json({ success: false, message });
}

@Controller('kledo')
export class KledoController {
  constructor(@Inject(KledoService) private readonly svc: KledoService) {}

  @Get('status')
  async getStatus(@Res() res: Response) {
    try { return ok(res, await this.svc.getStatus()); }
    catch (e: any) { return ok(res, { connected: false, message: e?.message ?? 'Gagal cek status' }); }
  }

  @Get('config')
  async getConfig(@Res() res: Response) {
    try { return ok(res, await this.svc.getConfig()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil konfigurasi'); }
  }

  @Put('config')
  async saveConfig(@Body() dto: { token?: string; baseUrl?: string }, @Res() res: Response) {
    try {
      const token = (dto?.token ?? '').trim();
      if (!token) return fail(res, 'Token tidak boleh kosong', HttpStatus.BAD_REQUEST);
      const result = await this.svc.saveConfig(token, dto?.baseUrl?.trim() || undefined);
      return ok(res, { success: true, ...result });
    } catch (e: any) { return fail(res, e?.message ?? 'Gagal menyimpan konfigurasi'); }
  }

  @Get('spm-brands')
  async getSpmBrands(@Res() res: Response) {
    try { return ok(res, this.svc.getSpmBrands()); }
    catch (e: any) { return fail(res, e?.message ?? 'Error'); }
  }

  @Get('products')
  async getProducts(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getProducts(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil produk Kledo'); }
  }

  @Get('contacts')
  async getContacts(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getContacts(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil kontak Kledo'); }
  }

  @Post('contacts')
  async createContact(@Body() dto: any, @Res() res: Response) {
    try { return ok(res, await this.svc.createContact(dto), HttpStatus.CREATED); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal membuat kontak Kledo'); }
  }

  @Put('contacts/:id')
  async updateContact(@Param('id') id: string, @Body() dto: any, @Res() res: Response) {
    try { return ok(res, await this.svc.updateContact(Number(id), dto)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengupdate kontak'); }
  }

  @Delete('contacts/:id')
  async deleteContact(@Param('id') id: string, @Res() res: Response) {
    try { return ok(res, await this.svc.deleteContact(Number(id))); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal menghapus kontak'); }
  }

  @Get('invoices')
  async getInvoices(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getInvoices(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil invoice Kledo'); }
  }

  @Post('invoices')
  async createInvoice(@Body() dto: any, @Res() res: Response) {
    try { return ok(res, await this.svc.createInvoice(dto), HttpStatus.CREATED); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal membuat invoice'); }
  }

  @Post('sync')
  async syncProducts(@Res() res: Response) {
    try { return ok(res, await this.svc.syncProducts()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal sync produk'); }
  }

  @Post('sync-contacts')
  async syncContacts(@Res() res: Response) {
    try { return ok(res, await this.svc.syncContacts()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal sync kontak'); }
  }

  @Post('sync-invoices')
  async syncInvoices(@Query('limit') limit: string | undefined, @Res() res: Response) {
    try { return ok(res, await this.svc.syncInvoices(limit ? Number(limit) : 500)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal sync invoice'); }
  }

  @Post('sync-all')
  async syncAll(@Res() res: Response) {
    try { return ok(res, await this.svc.syncAll()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal sync semua'); }
  }

  @Post('auto-sync')
  async autoSync(@Res() res: Response) {
    try { return ok(res, await this.svc.autoSync()); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal auto sync'); }
  }

  @Get('sync-logs')
  async getSyncLogs(@Query() q: any, @Res() res: Response) {
    try { return ok(res, await this.svc.getSyncLogs(q)); }
    catch (e: any) { return fail(res, e?.message ?? 'Gagal mengambil log sync'); }
  }
}
