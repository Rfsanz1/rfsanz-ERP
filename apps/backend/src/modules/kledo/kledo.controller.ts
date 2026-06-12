import { Controller, Get, Post, Put, Delete, Body, Query, Param, Inject, UseGuards } from '@nestjs/common';
import { KledoService } from './kledo.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('kledo')
export class KledoController {
  constructor(@Inject(KledoService) private readonly svc: KledoService) {}

  @Get('status')
  getStatus() { return this.svc.getStatus(); }

  @Get('spm-brands')
  getSpmBrands() { return this.svc.getSpmBrands(); }

  @Get('products')
  @UseGuards(JwtAuthGuard)
  getProducts(@Query() q: any) { return this.svc.getProducts(q); }

  @Get('contacts')
  @UseGuards(JwtAuthGuard)
  getContacts(@Query() q: any) { return this.svc.getContacts(q); }

  @Post('contacts')
  @UseGuards(JwtAuthGuard)
  createContact(@Body() dto: any) { return this.svc.createContact(dto); }

  @Put('contacts/:id')
  @UseGuards(JwtAuthGuard)
  updateContact(@Param('id') id: string, @Body() dto: any) { return this.svc.updateContact(Number(id), dto); }

  @Delete('contacts/:id')
  @UseGuards(JwtAuthGuard)
  deleteContact(@Param('id') id: string) { return this.svc.deleteContact(Number(id)); }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  getInvoices(@Query() q: any) { return this.svc.getInvoices(q); }

  @Post('invoices')
  @UseGuards(JwtAuthGuard)
  createInvoice(@Body() dto: any) { return this.svc.createInvoice(dto); }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  syncProducts() { return this.svc.syncProducts(); }

  @Post('sync-contacts')
  @UseGuards(JwtAuthGuard)
  syncContacts() { return this.svc.syncContacts(); }

  @Post('sync-invoices')
  @UseGuards(JwtAuthGuard)
  syncInvoices(@Query('limit') limit?: string) {
    return this.svc.syncInvoices(limit ? Number(limit) : 500);
  }

  @Post('sync-all')
  @UseGuards(JwtAuthGuard)
  syncAll() { return this.svc.syncAll(); }

  @Post('auto-sync')
  @UseGuards(JwtAuthGuard)
  autoSync() { return this.svc.autoSync(); }

  @Get('sync-logs')
  @UseGuards(JwtAuthGuard)
  getSyncLogs(@Query() q: any) { return this.svc.getSyncLogs(q); }
}
