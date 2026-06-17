import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AssetService } from './asset.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetController {
  constructor(private readonly svc: AssetService) {}

  // ─── REPORTS (must be before :id) ──────────────────────────────────────────
  @Get('reports/register')              getReportRegister(@Query('asOf') d?: string)      { return this.svc.getAssetRegister(d ? new Date(d) : undefined); }
  @Get('reports/depreciation')          getReportDepreciation(@Query('year') year?: string) { return this.svc.getDepreciationReport(year ? Number(year) : undefined); }

  // ─── CATEGORIES (must be before :id) ───────────────────────────────────────
  @Get('categories')                    getCategories()                                    { return this.svc.getCategories(); }
  @Post('categories')                   createCategory(@Body() dto: any)                   { return this.svc.createCategory(dto); }
  @Get('categories/:id')                getCategory(@Param('id') id: string)               { return this.svc.getCategory(id); }
  @Put('categories/:id')                updateCategory(@Param('id') id: string, @Body() d: any) { return this.svc.updateCategory(id, d); }
  @Delete('categories/:id')             deleteCategory(@Param('id') id: string)            { return this.svc.deleteCategory(id); }

  // ─── DEPRECIATION (must be before :id) ────────────────────────────────────
  @Post('depreciation/run-monthly')     runDepreciation(@Body() dto: { bulan: number; tahun: number }) {
    return this.svc.runMonthlyDepreciation(dto.bulan, dto.tahun);
  }
  @Post('depreciation/calculate')       calcDepreciation(@Body() dto: { assetId: string; bulan: number; tahun: number }) {
    return this.svc.calculateDepreciation(dto.assetId, dto.bulan, dto.tahun);
  }

  // ─── SPECIAL ROUTES (must be before :id) ──────────────────────────────────
  @Get('register')                      getRegister(@Query('asOf') d?: string)             { return this.svc.getAssetRegister(d ? new Date(d) : undefined); }

  // ─── ASSET CRUD ────────────────────────────────────────────────────────────
  @Get()                                getAssets(@Query() q: any)                         { return this.svc.getAssets(q); }
  @Post()                               createAsset(@Body() dto: any)                      { return this.svc.createAsset(dto); }
  @Get(':id')                           getAsset(@Param('id') id: string)                  { return this.svc.getAsset(id); }
  @Put(':id')                           updateAsset(@Param('id') id: string, @Body() d: any) { return this.svc.updateAsset(id, d); }

  // ─── ASSET DISPOSAL & SCHEDULE ────────────────────────────────────────────
  @Get(':id/depreciation-schedule')     getSchedule(@Param('id') id: string)               { return this.svc.getDepreciationSchedule(id); }
  @Post(':id/dispose')                  dispose(@Param('id') id: string, @Body() dto: any) {
    return this.svc.disposeAsset(id, new Date(dto.tanggalDisposal), Number(dto.nilaiDisposal), dto.note);
  }
}
