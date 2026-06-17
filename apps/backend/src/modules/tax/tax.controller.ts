import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, Res, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { TaxService } from './tax.service.js';
import { EFakturService } from './efaktur.service.js';
import {
  CreateTaxDto, UpdateTaxDto,
  CalculatePPNDto, CalculatePPh21Dto, CalculatePPh23Dto, CalculatePPh4a2Dto,
} from './dto/create-tax.dto.js';
import { EFakturStatus } from '@prisma/client';

@Controller('tax')
export class TaxController {
  constructor(
    private readonly taxService: TaxService,
    private readonly efakturService: EFakturService,
  ) {}

  // ─── CRUD JENIS PAJAK ─────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.taxService.findAll();
  }

  @Get('options/ptkp')
  getPTKPOptions() {
    return this.taxService.getPTKPOptions();
  }

  @Get('options/pph23')
  getPPh23Options() {
    return this.taxService.getPPh23Options();
  }

  @Get('options/pph4a2')
  getPPh4a2Options() {
    return this.taxService.getPPh4a2Options();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taxService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTaxDto) {
    return this.taxService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaxDto) {
    return this.taxService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taxService.remove(id);
  }

  // ─── KALKULATOR PAJAK ─────────────────────────────────────────────────────

  @Post('calculate/ppn')
  calculatePPN(@Body() dto: CalculatePPNDto) {
    return this.taxService.calculatePPN(dto.amount, dto.taxRate);
  }

  @Post('calculate/pph21')
  calculatePPh21(@Body() dto: CalculatePPh21Dto) {
    return this.taxService.calculatePPh21(dto.grossSalary, dto.statusPajak);
  }

  @Post('calculate/pph23')
  calculatePPh23(@Body() dto: CalculatePPh23Dto) {
    return this.taxService.calculatePPh23(dto.amount, dto.jenis);
  }

  @Post('calculate/pph4a2')
  calculatePPh4a2(@Body() dto: CalculatePPh4a2Dto) {
    return this.taxService.calculatePPh4a2(dto.amount, dto.jenis);
  }

  // ─── E-FAKTUR ─────────────────────────────────────────────────────────────

  @Get('efaktur/list')
  getEFakturList(@Query('periode') periode?: string) {
    return this.efakturService.findAll(periode);
  }

  @Get('efaktur/rekap-ppn')
  getRekapPPN(@Query('periode') periode: string) {
    return this.efakturService.getRekapPPN(periode);
  }

  @Get('efaktur/export-csv')
  async exportCSV(@Query('periode') periode: string, @Res() res: Response) {
    const csv = await this.efakturService.exportCSV(periode);
    const filename = `efaktur_${periode}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send('\uFEFF' + csv);
  }

  @Get('efaktur/:id')
  getEFaktur(@Param('id') id: string) {
    return this.efakturService.findOne(id);
  }

  @Post('efaktur')
  createEFaktur(@Body() body: {
    referenceId?: string;
    npwpPembeli?: string;
    namaPembeli?: string;
    nilaiDPP: number;
    nilaiPPN: number;
    taxId?: string;
    tanggal?: string;
  }) {
    return this.efakturService.createEFaktur({
      ...body,
      tanggal: body.tanggal ? new Date(body.tanggal) : undefined,
    });
  }

  @Post('efaktur/from-sale/:saleId')
  createFromSale(@Param('saleId') saleId: string) {
    return this.efakturService.createFromSaleInvoice(saleId);
  }

  @Post('efaktur/generate')
  generateEFaktur(@Body() body: { invoiceIds: string[]; periode: string }) {
    return this.efakturService.generateFromInvoices(body.invoiceIds, body.periode);
  }

  @Get('report/keluaran')
  getLaporanKeluaran(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.efakturService.getLaporanKeluaran(from || '2026-01-01', to || today);
  }

  @Get('report/masukan')
  getLaporanMasukan(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.efakturService.getLaporanMasukan(from || '2026-01-01', to || today);
  }

  @Put('efaktur/:id/status')
  updateEFakturStatus(
    @Param('id') id: string,
    @Body('status') status: EFakturStatus,
  ) {
    return this.efakturService.updateStatus(id, status);
  }

  @Delete('efaktur/:id')
  deleteEFaktur(@Param('id') id: string) {
    return this.efakturService.remove(id);
  }
}
