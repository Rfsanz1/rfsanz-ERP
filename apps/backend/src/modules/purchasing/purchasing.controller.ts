import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, Inject, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { PurchasingService } from './purchasing.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('purchasing')
@UseGuards(JwtAuthGuard)
export class PurchasingController {
  constructor(@Inject(PurchasingService) private readonly svc: PurchasingService) {}

  // ─── STATS ────────────────────────────────────────────────────────────────────
  @Get('stats') getStats() { return this.svc.getStats(); }

  // ─── RFQs ─────────────────────────────────────────────────────────────────────
  @Get('rfqs')              getRFQs(@Query() q: any)                 { return this.svc.getRfqs(q); }
  @Get('rfqs/:id')          getRFQ(@Param('id') id: string)          { return this.svc.getRfq(id); }
  @Post('rfqs')             createRFQ(@Body() dto: any)              { return this.svc.createRfq(dto); }
  @Put('rfqs/:id')          updateRFQ(@Param('id') id: string, @Body() dto: any) { return this.svc.updateRfq(id, dto); }
  @Delete('rfqs/:id')       deleteRFQ(@Param('id') id: string)       { return this.svc.deleteRfq(id); }
  @Post('rfqs/:id/convert-to-po') convertRFQ(@Param('id') id: string, @Body() dto: any) { return this.svc.convertRfqToPo(id, dto); }

  // ─── PURCHASE ORDERS ──────────────────────────────────────────────────────────
  @Get('purchase-orders')            getPOs(@Query() q: any)                        { return this.svc.getPurchaseOrders(q); }
  @Get('purchase-orders/:id')        getPO(@Param('id') id: string)                 { return this.svc.getPurchaseOrder(id); }
  @Post('purchase-orders')           createPO(@Body() dto: any)                     { return this.svc.createPurchaseOrder(dto); }
  @Put('purchase-orders/:id')        updatePO(@Param('id') id: string, @Body() dto: any) { return this.svc.updatePurchaseOrder(id, dto); }
  @Post('purchase-orders/:id/approve') approvePO(@Param('id') id: string, @CurrentUser() user: any) { return this.svc.approvePurchaseOrder(id, user?.sub ?? 'system'); }
  @Post('purchase-orders/:id/cancel') cancelPO(@Param('id') id: string)             { return this.svc.cancelPurchaseOrder(id); }
  @Patch('purchase-orders/:id/status') changeStatus(@Param('id') id: string, @Body('status') status: string) { return this.svc.changeStatus(id, status); }

  // ─── GOODS RECEIPTS ───────────────────────────────────────────────────────────
  @Get('goods-receipts')             getGRs(@Query() q: any)                        { return this.svc.getGoodsReceipts(q); }
  @Get('goods-receipts/:id')         getGR(@Param('id') id: string)                 { return this.svc.getGoodsReceipt(id); }
  @Post('goods-receipts')            createGR(@Body() dto: any)                     { return this.svc.createGoodsReceipt(dto); }
  @Post('goods-receipts/:id/receive') receiveGR(@Param('id') id: string, @Body() dto: any) { return this.svc.receiveGoodsReceipt(id, dto); }
  @Get('goods-receipts/:id/delivery-note') getDeliveryNote(@Param('id') id: string) { return this.svc.getDeliveryNote(id); }

  // ─── VENDOR BILLS ─────────────────────────────────────────────────────────────
  @Get('bills/aging')                    getBillAging()                               { return this.svc.getBillAging(); }
  @Get('bills')                          getBills(@Query() q: any)                    { return this.svc.getVendorBills(q); }
  @Get('bills/:id')                      getBill(@Param('id') id: string)             { return this.svc.getVendorBill(id); }
  @Post('bills')                         createBill(@Body() dto: any)                 { return this.svc.createVendorBill(dto); }
  @Put('bills/:id')                      updateBill(@Param('id') id: string, @Body() dto: any) { return this.svc.updateVendorBill(id, dto); }
  @Delete('bills/:id')                   deleteBill(@Param('id') id: string)          { return this.svc.deleteVendorBill(id); }
  @Post('bills/from-gr/:grId')           createBillFromGr(@Param('grId') grId: string, @Body() dto: any) { return this.svc.createBillFromGr(grId, dto); }
  @Post('bills/:id/payments')            addBillPayment(@Param('id') id: string, @Body() dto: any)       { return this.svc.addBillPayment(id, dto); }
  @Get('bills/:id/payments')             getBillPayments(@Param('id') id: string)     { return this.svc.getBillPayments(id); }
  @Post('bills/:id/approve')             approveBill(@Param('id') id: string)         { return this.svc.approveBill(id); }
  @Get('bills/:id/three-way-match')      threeWayMatch(@Param('id') id: string)       { return this.svc.validateThreeWayMatch(id); }
  @Post('bills/:id/match')               matchBill(@Param('id') id: string)           { return this.svc.matchVendorBill(id); }
  @Get('bills/:id/pdf')                  async getBillPdf(@Param('id') id: string, @Res() res: Response) {
    const html = await this.svc.getBillPdf(id);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  // ─── LANDED COSTS ─────────────────────────────────────────────────────────────
  @Get('landed-costs')                   getLandedCosts(@Query() q: any)              { return this.svc.getLandedCosts(q); }
  @Get('landed-costs/:id')               getLandedCost(@Param('id') id: string)       { return this.svc.getLandedCost(id); }
  @Post('landed-costs')                  createLandedCost(@Body() dto: any)           { return this.svc.createLandedCost(dto); }
  @Put('landed-costs/:id')               updateLandedCost(@Param('id') id: string, @Body() dto: any) { return this.svc.updateLandedCost(id, dto); }
  @Post('landed-costs/:id/validate')     validateLandedCost(@Param('id') id: string)  { return this.svc.validateLandedCost(id); }

  // ─── PURCHASE RETURNS ─────────────────────────────────────────────────────────
  @Get('returns')                        getReturns(@Query() q: any)                  { return this.svc.getPurchaseReturns(q); }
  @Get('returns/:id')                    getReturn(@Param('id') id: string)           { return this.svc.getPurchaseReturn(id); }
  @Post('returns')                       createReturn(@Body() dto: any)               { return this.svc.createPurchaseReturn(dto); }
  @Put('returns/:id')                    updateReturn(@Param('id') id: string, @Body() dto: any) { return this.svc.updatePurchaseReturn(id, dto); }
  @Post('returns/:id/validate')          validateReturn(@Param('id') id: string)      { return this.svc.validatePurchaseReturn(id); }

  // ─── SUPPLIERS ────────────────────────────────────────────────────────────────
  @Get('suppliers')                      getSuppliers(@Query() q: any)                { return this.svc.getSuppliers(q); }
  @Get('suppliers/:id')                  getSupplier(@Param('id') id: string)         { return this.svc.getSupplier(id); }
  @Post('suppliers')                     createSupplier(@Body() dto: any)             { return this.svc.createSupplier(dto); }
  @Put('suppliers/:id')                  updateSupplier(@Param('id') id: string, @Body() dto: any) { return this.svc.updateSupplier(id, dto); }
  @Delete('suppliers/:id')               deleteSupplier(@Param('id') id: string)      { return this.svc.deleteSupplier(id); }
  @Get('suppliers/:id/history')          getSupplierHistory(@Param('id') id: string)  { return this.svc.getSupplierHistory(id); }
  @Get('suppliers/:id/price-list')       getSupplierPricelist(@Param('id') id: string) { return this.svc.getSupplierPricelist(id); }
  @Post('suppliers/:id/price-list')      addSupplierPricelist(@Param('id') id: string, @Body() dto: any) { return this.svc.addSupplierPricelist(id, dto); }
  @Post('suppliers/:id/rating')          rateSupplier(@Param('id') id: string, @Body() dto: any) { return this.svc.rateSupplier(id, dto); }

  // ─── MISC ─────────────────────────────────────────────────────────────────────
  @Get('price-comparison')               compareQuotes(@Query() q: any)               { return this.svc.compareSupplierQuotes(q); }
}
