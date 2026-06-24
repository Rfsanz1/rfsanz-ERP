import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CanAccessGuard } from '../../common/guards/can-access.guard.js';
import { CanAccess } from '../../common/decorators/can-access.decorator.js';

@ApiTags('sales')
@ApiBearerAuth('access-token')
@Controller('sales')
@UseGuards(JwtAuthGuard, CanAccessGuard)
@CanAccess({ roles: ['Super Admin', 'Owner', 'Admin', 'Sales'] })
export class SalesController {
  constructor(@Inject(SalesService) private readonly svc: SalesService) {}

  @Get('summary')               getSummary(@Query() q: any)               { return this.svc.getSalesSummary(q); }
  @Get('list')                  getSalesList()                            { return this.svc.getSalesList(); }

  // ─── Orders ─────────────────────────────────────────────────────────────────
  @Get('orders')                getOrders(@Query() q: any)                { return this.svc.getOrders(q); }
  @Get('orders/:id')            getOrder(@Param('id') id: string)         { return this.svc.getOrder(Number(id)); }
  @Post('orders')               createOrder(@Body() dto: any)             { return this.svc.createOrder(dto); }
  @Post('orders/:id/kledo-retry') kledoRetry(@Param('id') id: string)    { return this.svc.kledoRetry(Number(id)); }
  @Put('orders/:id')            updateOrder(@Param('id') id: string, @Body() dto: any) { return this.svc.updateOrder(Number(id), dto); }
  @Delete('orders/:id')         deleteOrder(@Param('id') id: string)     { return this.svc.deleteOrder(Number(id)); }
  @Patch('orders/:id/pengiriman') updatePengiriman(@Param('id') id: string, @Body() dto: any) { return this.svc.updatePengiriman(Number(id), dto); }
  @Post('orders/:id/bukti-transfer') uploadBukti(@Param('id') id: string, @Body('base64') b64: string, @Body('bankTujuan') bank: string) { return this.svc.uploadBuktiTransfer(Number(id), b64, { bankTujuan: bank }); }
  @Post('orders/:id/whatsapp')  sendWa(@Param('id') id: string, @Body() dto: any) { return this.svc.sendWhatsAppNotification({ ...dto, id }); }
  @Get('faktur')                getSales(@Query() q: any)                 { return this.svc.getSales(q); }

  @Get('customer-location/:token') getCustomerLoc(@Param('token') t: string) { return this.svc.getCustomerLocation(t); }
  @Post('customer-location/:token') saveCustomerLoc(@Param('token') t: string, @Body() dto: any) { return this.svc.saveCustomerLocation(t, dto.lat, dto.lng); }

  // ─── Quotations ──────────────────────────────────────────────────────────────
  @Get('quotations')            @ApiOperation({ summary: 'Daftar quotation' })
  getQuotations(@Query() q: any)                                          { return this.svc.getQuotations(q); }

  @Get('quotations/:id')        @ApiOperation({ summary: 'Detail quotation' })
  getQuotation(@Param('id') id: string)                                   { return this.svc.getQuotation(id); }

  @Post('quotations')           @ApiOperation({ summary: 'Buat quotation baru' })
  createQuotation(@Body() dto: any)                                       { return this.svc.createQuotation(dto); }

  @Put('quotations/:id')        @ApiOperation({ summary: 'Update quotation' })
  updateQuotation(@Param('id') id: string, @Body() dto: any)             { return this.svc.updateQuotation(id, dto); }

  @Delete('quotations/:id')     @ApiOperation({ summary: 'Hapus quotation' })
  deleteQuotation(@Param('id') id: string)                               { return this.svc.deleteQuotation(id); }

  @Post('quotations/:id/confirm') @ApiOperation({ summary: 'Konfirmasi quotation → Sales Order' })
  confirmQuotation(@Param('id') id: string)                              { return this.svc.confirmQuotation(id); }

  @Post('quotations/:id/convert-to-order') @ApiOperation({ summary: 'Konversi quotation ke order' })
  convertQuotationToOrder(@Param('id') id: string)                       { return this.svc.convertQuotationToOrder(id); }

  @Post('quotations/:id/convert-invoice') @ApiOperation({ summary: 'Konversi quotation langsung ke invoice' })
  convertQuotationToInvoice(@Param('id') id: string)                     { return this.svc.convertQuotationToInvoice(id); }

  @Post('quotations/:id/send-whatsapp') @ApiOperation({ summary: 'Kirim quotation via WhatsApp' })
  sendQuotationWa(@Param('id') id: string, @Body() dto: any)             { return this.svc.sendQuotationWhatsApp(id, dto); }

  @Post('quotations/:id/send-email') @ApiOperation({ summary: 'Kirim quotation via email' })
  sendQuotationEmail(@Param('id') id: string, @Body() dto: any)          { return this.svc.sendQuotationEmail(id, dto); }

  // ─── Sales Returns ───────────────────────────────────────────────────────────
  @Get('returns')               @ApiOperation({ summary: 'Daftar retur penjualan' })
  getSalesReturns(@Query() q: any)                                        { return this.svc.getSalesReturns(q); }

  @Get('returns/:id')           @ApiOperation({ summary: 'Detail retur penjualan' })
  getSalesReturn(@Param('id') id: string)                                 { return this.svc.getSalesReturn(id); }

  @Post('returns')              @ApiOperation({ summary: 'Buat retur penjualan' })
  createSalesReturn(@Body() dto: any)                                     { return this.svc.createSalesReturn(dto); }

  @Put('returns/:id')           @ApiOperation({ summary: 'Update retur penjualan' })
  updateSalesReturn(@Param('id') id: string, @Body() dto: any)           { return this.svc.updateSalesReturn(id, dto); }

  @Post('returns/:id/validate') @ApiOperation({ summary: 'Validasi/approve retur → kembalikan stok' })
  validateReturn(@Param('id') id: string)                                 { return this.svc.validateSalesReturn(id); }

  // ─── Pricelists ──────────────────────────────────────────────────────────────
  @Get('pricelists')            @ApiOperation({ summary: 'Daftar pricelist' })
  getPricelists(@Query() q: any)                                          { return this.svc.getPricelists(q); }

  @Get('pricelists/:id')        @ApiOperation({ summary: 'Detail pricelist' })
  getPricelist(@Param('id') id: string)                                   { return this.svc.getPricelist(id); }

  @Post('pricelists')           @ApiOperation({ summary: 'Buat pricelist baru' })
  createPricelist(@Body() dto: any)                                       { return this.svc.createPricelist(dto); }

  @Put('pricelists/:id')        @ApiOperation({ summary: 'Update pricelist' })
  updatePricelist(@Param('id') id: string, @Body() dto: any)             { return this.svc.updatePricelist(id, dto); }

  @Delete('pricelists/:id')     @ApiOperation({ summary: 'Hapus pricelist' })
  deletePricelist(@Param('id') id: string)                               { return this.svc.deletePricelist(id); }

  @Get('pricelists/:id/items')  @ApiOperation({ summary: 'Daftar item dalam pricelist' })
  getPricelistItems(@Param('id') id: string)                             { return this.svc.getPricelistItems(id); }

  @Post('pricelists/:id/items') @ApiOperation({ summary: 'Tambah item ke pricelist' })
  addPricelistItem(@Param('id') id: string, @Body() dto: any)           { return this.svc.addPricelistItem(id, dto); }
}
