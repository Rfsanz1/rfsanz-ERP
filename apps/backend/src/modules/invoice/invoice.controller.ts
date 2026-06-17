import { Body, Controller, Delete, Get, Header, Inject, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { Response } from 'express';

@ApiTags('invoices')
@ApiBearerAuth('access-token')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(@Inject(InvoiceService) private readonly svc: InvoiceService) {}

  @Get('stats')                    @ApiOperation({ summary: 'Statistik invoice' })
  getStats()                                                         { return this.svc.getStats(); }

  @Get('aging')                    @ApiOperation({ summary: 'AR aging report' })
  getAging()                                                         { return this.svc.getAging(); }

  @Get()                           @ApiOperation({ summary: 'Daftar invoice' })
  findAll(@Query() q: any)                                           { return this.svc.findAll(q); }

  @Get(':id')                      @ApiOperation({ summary: 'Detail invoice' })
  findOne(@Param('id') id: string)                                   { return this.svc.findOne(id); }

  @Post()                          @ApiOperation({ summary: 'Buat invoice baru' })
  create(@Body() dto: any)                                           { return this.svc.create(dto); }

  @Put(':id')                      @ApiOperation({ summary: 'Update invoice' })
  update(@Param('id') id: string, @Body() dto: any)                 { return this.svc.update(id, dto); }

  @Delete(':id')                   @ApiOperation({ summary: 'Hapus invoice draft' })
  remove(@Param('id') id: string)                                    { return this.svc.delete(id); }

  @Post(':id/send')                @ApiOperation({ summary: 'Kirim invoice (status → sent)' })
  send(@Param('id') id: string)                                      { return this.svc.send(id); }

  @Get(':id/payments')             @ApiOperation({ summary: 'Daftar pembayaran invoice' })
  getPayments(@Param('id') id: string)                               { return this.svc.getPayments(id); }

  @Post(':id/payments')            @ApiOperation({ summary: 'Catat pembayaran' })
  addPayment(@Param('id') id: string, @Body() dto: any)             { return this.svc.addPayment(id, dto); }

  @Get(':id/credit-notes')         @ApiOperation({ summary: 'Daftar credit note' })
  getCreditNotes(@Param('id') id: string)                            { return this.svc.getCreditNotes(id); }

  @Post(':id/credit-notes')        @ApiOperation({ summary: 'Terbitkan credit note' })
  issueCreditNote(@Param('id') id: string, @Body() dto: any)        { return this.svc.issueCreditNote(id, dto); }

  @Post(':id/send-reminder')       @ApiOperation({ summary: 'Kirim reminder pembayaran' })
  sendReminder(@Param('id') id: string, @Body() dto: any)           { return this.svc.sendReminder(id, dto); }

  @Post(':id/send-whatsapp')       @ApiOperation({ summary: 'Kirim invoice via WhatsApp' })
  sendWhatsApp(@Param('id') id: string, @Body() dto: any)           { return this.svc.sendWhatsApp(id, dto); }

  @Post(':id/set-recurring')       @ApiOperation({ summary: 'Aktifkan recurring invoice' })
  setRecurring(@Param('id') id: string, @Body() dto: any)           { return this.svc.setRecurring(id, dto); }

  @Delete(':id/recurring')         @ApiOperation({ summary: 'Nonaktifkan recurring invoice' })
  deleteRecurring(@Param('id') id: string)                           { return this.svc.deleteRecurring(id); }

  @Post(':id/payment-link')        @ApiOperation({ summary: 'Buat payment link' })
  createPaymentLink(@Param('id') id: string, @Body() dto: any)      { return this.svc.createPaymentLink(id, dto); }

  @Get(':id/pdf')                  @ApiOperation({ summary: 'Preview HTML invoice (PDF-ready)' })
  @Header('Content-Type', 'text/html')
  async getPdf(@Param('id') id: string, @Res() res: Response)       {
    const html = await this.svc.getPdfHtml(id);
    res.send(html);
  }
}
