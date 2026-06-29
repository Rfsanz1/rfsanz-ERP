import { Controller, Get, Post, Put, Delete, Param, Body, Query, Inject, UseGuards, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { InventoryService } from './inventory.service.js';
import { CostingService } from './costing.service.js';
import { LandedCostService } from './landed-cost.service.js';
import { ValuationService } from './valuation.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    @Inject(InventoryService) private readonly svc: InventoryService,
    @Inject(CostingService) private readonly costing: CostingService,
    @Inject(LandedCostService) private readonly landedCost: LandedCostService,
    @Inject(ValuationService) private readonly valuation: ValuationService,
  ) {}

  // ─── EXISTING ROUTES (tidak diubah) ───────────────────────────────────────
  @Get('stats') getStats() { return this.svc.getStats(); }
  @Get('products') getProducts(@Query() q: any) { return this.svc.getProducts(q); }
  @Get('brands') getBrands() { return this.svc.getBrands(); }
  @Get('products/:id') getProduct(@Param('id') id: string) { return this.svc.getProduct(id); }
  @Post('products') createProduct(@Body() dto: any) { return this.svc.createProduct(dto); }
  @Put('products/:id') updateProduct(@Param('id') id: string, @Body() dto: any) { return this.svc.updateProduct(id, dto); }
  @Delete('products/:id') deleteProduct(@Param('id') id: string) { return this.svc.deleteProduct(id); }
  @Post('products/:id/stok') updateStok(
    @Param('id') id: string,
    @Body() dto: { qty: number; type: 'in' | 'out'; note?: string },
  ) { return this.svc.updateStok(id, dto.qty, dto.type, dto.note); }
  // Product variants
  @Get('products/:id/variants') getVariants(@Param('id') id: string) { return this.svc.getVariants(id); }
  @Post('products/:id/variants') createVariant(@Param('id') id: string, @Body() dto: any) { return this.svc.createVariant(id, dto); }
  @Put('products/:id/variants/:variantId') updateVariant(@Param('id') id: string, @Param('variantId') variantId: string, @Body() dto: any) { return this.svc.updateVariant(id, variantId, dto); }
  @Delete('products/:id/variants/:variantId') deleteVariant(@Param('id') id: string, @Param('variantId') variantId: string) { return this.svc.deleteVariant(id, variantId); }

  // Product bundle components
  @Get('products/:id/bundle-components') getBundleComponents(@Param('id') id: string) { return this.svc.getBundleComponents(id); }
  @Post('products/:id/bundle-components') addBundleComponent(@Param('id') id: string, @Body() dto: any) { return this.svc.addBundleComponent(id, dto); }

  // Tier prices
  @Get('products/:id/tier-prices') getTierPrices(@Param('id') id: string) { return this.svc.getTierPrices(id); }
  @Post('products/:id/tier-prices') addTierPrice(@Param('id') id: string, @Body() dto: any) { return this.svc.addTierPrice(id, dto); }

  // Unit conversions
  @Get('unit-conversions') getUnitConversions() { return this.svc.getUnitConversions(); }
  @Post('unit-conversions') addUnitConversion(@Body() dto: any) { return this.svc.addUnitConversion(dto); }

  // Import / Export products
  @Post('products/import') @UseInterceptors(FileInterceptor('file')) importProducts(@UploadedFile() file: any, @Body() body: any) {
    if (file && file.buffer) return this.svc.importProducts(file.buffer);
    if (body && body.fileBase64) return this.svc.importProducts(body.fileBase64);
    return { message: 'No file provided' };
  }
  @Get('products/export') async exportProducts(@Query() q: any, @Res({ passthrough: true }) res: Response) {
    const out = await this.svc.exportProducts(q);
    if (q && q.download === 'true') {
      const buf = Buffer.from(out.content, 'base64');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
      return res.send(buf);
    }
    return out;
  }
  @Get('products/import-template') async importTemplate(@Res({ passthrough: true }) res: Response, @Query() q: any) {
    const out = await this.svc.importTemplate();
    if (q && q.download === 'true') {
      const buf = Buffer.from(out.content, 'base64');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
      return res.send(buf);
    }
    return out;
  }
  @Get('stock-movements') getMovements(@Query() q: any) { return this.svc.getStockMovements(q); }
  @Get('stock-opnames') getOpnames(@Query() q: any) { return this.svc.getStockOpnames(q); }
  @Post('stock-opnames') createOpname(@Body() dto: any) { return this.svc.createStockOpname(dto); }
  @Post('stock-opnames/:id/validate') validateOpname(@Param('id') id: string) { return this.svc.validateStockOpname(id); }
  @Get('stock-opnames/:id/export') async exportOpname(@Param('id') id: string, @Query() q: any, @Res({ passthrough: true }) res: Response) {
    const out = await this.svc.exportStockOpname(id);
    if (q && q.download === 'true') {
      const buf = Buffer.from(out.content, 'base64');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
      return res.send(buf);
    }
    return out;
  }
  @Post('stock-opnames/:id/import') @UseInterceptors(FileInterceptor('file')) importOpname(@Param('id') id: string, @UploadedFile() file: any, @Body() body: any) {
    if (file && file.buffer) return this.svc.importStockOpname(id, file.buffer);
    if (body && body.fileBase64) return this.svc.importStockOpname(id, body.fileBase64);
    return { message: 'No file provided' };
  }
  @Get('warehouses') getWarehouses() { return this.svc.getWarehouses(); }
  @Get('categories') getCategories() { return this.svc.getCategories(); }
  @Post('categories') createCategory(@Body() dto: any) { return this.svc.createCategory(dto); }
  @Put('categories/:id') updateCategory(@Param('id') id: string, @Body() dto: any) { return this.svc.updateCategory(id, dto); }
  @Delete('categories/:id') deleteCategory(@Param('id') id: string) { return this.svc.deleteCategory(id); }
  @Get('units') getUnits() { return this.svc.getUnits(); }

  // ─── COSTING ROUTES ───────────────────────────────────────────────────────
  @Post('costing/fifo/calculate')
  calculateFIFO(@Body() dto: { productId: string; qty: number }) {
    return this.costing.calculateFIFO(dto.productId, dto.qty);
  }

  @Post('costing/fifo/commit')
  commitFIFO(@Body() dto: { productId: string; qty: number; referenceId?: string }) {
    return this.costing.commitFIFO(dto.productId, dto.qty, dto.referenceId);
  }

  @Post('costing/average')
  updateAverageCost(@Body() dto: { productId: string; qtyMasuk: number; unitCost: number }) {
    return this.costing.calculateAverageCost(dto.productId, dto.qtyMasuk, dto.unitCost);
  }

  @Post('costing/revaluate')
  revaluate(@Body() dto: { productId: string; newCost: number; note?: string }) {
    return this.costing.revaluateStock(dto.productId, dto.newCost, dto.note);
  }

  @Post('costing/lots')
  createCostLot(@Body() dto: {
    productId: string; nomorLot: string; qtyAwal: number;
    unitCost: number; expiryDate?: string; referenceId?: string;
  }) {
    return this.costing.createLot({
      ...dto,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    });
  }

  // ─── LANDED COST ROUTES ───────────────────────────────────────────────────
  @Get('landed-costs')
  getLandedCosts(@Query() q: any) {
    return this.landedCost.findAll(q);
  }

  @Get('landed-costs/:id')
  getLandedCost(@Param('id') id: string) {
    return this.landedCost.findOne(id);
  }

  @Post('landed-costs')
  createLandedCost(@Body() dto: {
    purchaseId: string; deskripsi: string;
    amount: number; splitMethod: any;
  }) {
    return this.landedCost.createDraft(dto);
  }

  @Post('landed-costs/apply')
  applyLandedCosts(@Body() dto: {
    purchaseId: string;
    costs: { deskripsi: string; amount: number; splitMethod: any }[];
  }) {
    return this.landedCost.applyLandedCost(dto.purchaseId, dto.costs);
  }

  @Post('landed-costs/:id/validate')
  validateLandedCost(@Param('id') id: string) {
    return this.landedCost.validate(id);
  }

  // ─── VALUATION ROUTES ─────────────────────────────────────────────────────
  @Get('valuation/stats')
  getValuationStats(@Query('warehouseId') warehouseId?: string) {
    return this.valuation.getValuationStats(warehouseId);
  }

  @Get('valuation/stock')
  getStockValuation(
    @Query('date') date?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.valuation.getStockValuation(date ? new Date(date) : undefined, warehouseId);
  }

  @Get('valuation/aging')
  getStockAging(@Query('warehouseId') warehouseId?: string) {
    return this.valuation.getStockAgingReport(warehouseId);
  }

  @Get('valuation/slow-moving')
  getSlowMoving(
    @Query('days') days?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.valuation.getSlowMovingItems(days ? Number(days) : 90, warehouseId);
  }

  @Get('valuation/lots')
  getStockLots(@Query() q: any) {
    return this.valuation.getStockLots(q);
  }

  // Lots / Serials
  @Get('lots') getLots(@Query() q: any) { return this.svc.getLots(q); }
  @Get('lots/:id') getLot(@Param('id') id: string) { return this.svc.getLot(id); }
  @Post('lots') createLot(@Body() dto: any) { return this.svc.createLot(dto); }
  @Get('lots/:id/trace') traceLot(@Param('id') id: string) { return this.svc.getLotTrace(id); }
  @Get('products/:id/lots') getProductLots(@Param('id') id: string) { return this.svc.getProductLots(id); }

  @Get('valuation/history/:productId')
  getValuationHistory(@Param('productId') productId: string) {
    return this.valuation.getValuationHistory(productId);
  }

  // Reports
  @Get('reports/stock-current') getReportStockCurrent(@Query() q: any) { return this.svc.getStockCurrent(q); }
  @Get('reports/stock-movement') getReportStockMovement(@Query() q: any) { return this.svc.getStockMovementReport(q); }
  @Get('reports/stock-aging') getReportStockAging(@Query() q: any) { return this.svc.getStockAging(q); }
  @Get('reports/stock-valuation') getReportStockValuation(@Query() q: any) { return this.svc.getStockValuationReport(q); }
  @Get('reports/product-performance') getReportProductPerformance(@Query() q: any) { return this.svc.getProductPerformance(q); }

  // ─── Stock Transfers ───────────────────────────────────────────────────────
  @Get('stock-transfers')
  getTransfers(@Query() q: any) { return this.svc.getTransfers(q); }

  @Get('stock-transfers/:id')
  getTransfer(@Param('id') id: string) { return this.svc.getTransfer(id); }

  @Post('stock-transfers')
  createTransfer(@Body() dto: any) { return this.svc.createTransfer(dto); }

  @Post('stock-transfers/:id/confirm')
  confirmTransfer(@Param('id') id: string) { return this.svc.confirmTransfer(id); }

  // Aliases with simpler paths as requested
  @Get('transfers') getTransfersV2(@Query() q: any) { return this.svc.getTransfers(q); }
  @Get('transfers/:id') getTransferV2(@Param('id') id: string) { return this.svc.getTransfer(id); }
  @Post('transfers') createTransferV2(@Body() dto: any) { return this.svc.createTransfer(dto); }
  @Put('transfers/:id') updateTransferV2(@Param('id') id: string, @Body() dto: any) { return this.svc.updateTransfer(id, dto); }
  @Post('transfers/:id/validate') validateTransfer(@Param('id') id: string) { return this.svc.validateTransfer(id); }
  @Post('transfers/:id/cancel') cancelTransfer(@Param('id') id: string) { return this.svc.cancelTransfer(id); }
  @Get('transfers/:id/pdf') async getTransferPdf(@Param('id') id: string, @Query() q: any, @Res({ passthrough: true }) res: Response) {
    const out = await this.svc.generateTransferPdf(id);
    if (q && q.download === 'true') {
      const buf = Buffer.from(out.content, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
      return res.send(buf);
    }
    return out;
  }

  // ─── Stock Adjustments ─────────────────────────────────────────────────────
  @Get('stock-adjustments')
  getAdjustments(@Query() q: any) { return this.svc.getAdjustments(q); }

  @Get('stock-adjustments/:id')
  getAdjustment(@Param('id') id: string) { return this.svc.getAdjustment(id); }

  @Post('stock-adjustments')
  createAdjustment(@Body() dto: any) { return this.svc.createAdjustment(dto); }

  @Post('stock-adjustments/:id/validate')
  validateAdjustment(@Param('id') id: string) { return this.svc.validateAdjustment(id); }

  // ─── Reorder Rules ─────────────────────────────────────────────────────────
  @Get('reorder-rules')
  getReorderRules(@Query() q: any) { return this.svc.getReorderRules(q); }

  @Post('reorder-rules')
  createReorderRule(@Body() dto: any) { return this.svc.createReorderRule(dto); }

  @Put('reorder-rules/:id')
  updateReorderRule(@Param('id') id: string, @Body() dto: any) { return this.svc.updateReorderRule(id, dto); }

  @Delete('reorder-rules/:id')
  deleteReorderRule(@Param('id') id: string) { return this.svc.deleteReorderRule(id); }
}
