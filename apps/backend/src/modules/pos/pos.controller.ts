import { Controller, Get, Post, Put, Patch, Param, Body, Query, Inject, UseGuards, Request, Res } from '@nestjs/common';
import { PosService } from './pos.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('pos')
export class PosController {
  constructor(@Inject(PosService) private readonly svc: PosService) {}

  @Post('auth/login') login(@Body() dto: any) {
    return this.svc.login(dto.username, dto.password);
  }

  @Get('dashboard') @UseGuards(JwtAuthGuard)
  getDashboard() {
    return this.svc.getDashboard();
  }

  @Get('products') getProducts(@Query() q: any) {
    return this.svc.getProducts(q);
  }

  @Post('products') @UseGuards(JwtAuthGuard)
  createProduct(@Body() dto: any) {
    return this.svc.createProduct(dto);
  }

  @Put('products/:id') @UseGuards(JwtAuthGuard)
  updateProduct(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateProduct(id, dto);
  }

  @Patch('products/:id') @UseGuards(JwtAuthGuard)
  patchProduct(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateProduct(id, dto);
  }

  @Get('categories') getCategories() {
    return this.svc.getCategories();
  }

  @Get('sales') @UseGuards(JwtAuthGuard)
  getSales(@Query() q: any) {
    return this.svc.getSales(q);
  }

  @Post('sales') createSale(@Body() dto: any) {
    return this.svc.createSale(dto);
  }

  // ─── Transactions (alias for sales) ────────────────────────────────────────
  @Get('transactions') @UseGuards(JwtAuthGuard)
  getTransactions(@Query() q: any) {
    return this.svc.getSales(q);
  }

  @Get('transactions/:id') @UseGuards(JwtAuthGuard)
  getTransaction(@Param('id') id: string) {
    return this.svc.getTransaction(id);
  }

  @Post('transactions') createTransaction(@Body() dto: any) {
    return this.svc.createSale(dto);
  }

  @Post('transactions/hold') @UseGuards(JwtAuthGuard)
  holdTransaction(@Body() dto: any) {
    return this.svc.holdTransaction(dto);
  }

  @Get('transactions/held') @UseGuards(JwtAuthGuard)
  getHeldTransactions() {
    return this.svc.getHeldTransactions();
  }

  @Post('transactions/:id/resume') @UseGuards(JwtAuthGuard)
  resumeTransaction(@Param('id') id: string, @Body() dto: any) {
    return this.svc.resumeTransaction(id, dto);
  }

  @Post('transactions/:id/return') @UseGuards(JwtAuthGuard)
  returnTransaction(@Param('id') id: string, @Body() dto: any) {
    return this.svc.returnTransaction(id, dto);
  }

  @Get('transactions/:id/receipt') @UseGuards(JwtAuthGuard)
  getReceipt(@Param('id') id: string) {
    return this.svc.getReceipt(id);
  }

  @Post('transactions/sync') @UseGuards(JwtAuthGuard)
  syncTransactions(@Body() dto: any) {
    return this.svc.syncTransactions(dto.transactions || []);
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────
  @Get('sessions') @UseGuards(JwtAuthGuard)
  getSessions(@Query() q: any) {
    return this.svc.getSessions(q);
  }

  @Get('sessions/active') @UseGuards(JwtAuthGuard)
  getActiveSession(@Request() req: any) {
    return this.svc.getActiveSession(req.user);
  }

  @Post('sessions/open') @UseGuards(JwtAuthGuard)
  openSession(@Body() dto: any, @Request() req: any) {
    return this.svc.openSession(dto, req.user);
  }

  @Post('sessions/:id/close') @UseGuards(JwtAuthGuard)
  closeSession(@Param('id') id: string, @Body() dto: any) {
    return this.svc.closeSession(id, dto);
  }

  @Get('sessions/:id') @UseGuards(JwtAuthGuard)
  getSession(@Param('id') id: string) {
    return this.svc.getSession(id);
  }

  @Get('sessions/:id/report') @UseGuards(JwtAuthGuard)
  getSessionReport(@Param('id') id: string) {
    return this.svc.getSessionReport(id);
  }

  // ─── Loyalty ──────────────────────────────────────────────────────────────
  @Get('loyalty/config') @UseGuards(JwtAuthGuard)
  getLoyaltyConfig() {
    return this.svc.getLoyaltyConfig();
  }

  @Put('loyalty/config') @UseGuards(JwtAuthGuard)
  updateLoyaltyConfig(@Body() dto: any) {
    return this.svc.updateLoyaltyConfig(dto);
  }

  @Get('loyalty/customers/:customerId') @UseGuards(JwtAuthGuard)
  getCustomerLoyalty(@Param('customerId') customerId: string) {
    return this.svc.getCustomerLoyalty(customerId);
  }

  @Post('loyalty/redeem') @UseGuards(JwtAuthGuard)
  redeemLoyalty(@Body() dto: any) {
    return this.svc.redeemLoyalty(dto);
  }

  // ─── Reports ──────────────────────────────────────────────────────────────
  @Get('reports/today') @UseGuards(JwtAuthGuard)
  getTodayReport() {
    return this.svc.getTodayReport();
  }

  @Get('reports/daily') @UseGuards(JwtAuthGuard)
  getDailyReports(@Query() q: any) {
    return this.svc.getReportsDaily(q);
  }

  @Get('reports/products') @UseGuards(JwtAuthGuard)
  getProductReports(@Query() q: any) {
    return this.svc.getReportsProducts(q);
  }

  @Get('reports/payments') @UseGuards(JwtAuthGuard)
  getPaymentReports(@Query() q: any) {
    return this.svc.getReportsPayments(q);
  }

  @Get('reports/cashiers') @UseGuards(JwtAuthGuard)
  getCashierReports(@Query() q: any) {
    return this.svc.getReportsCashiers(q);
  }

  // ─── Management Panel ──────────────────────────────────────────────────
  @Post('management/products/sync-stock') @UseGuards(JwtAuthGuard)
  syncStock() { return this.svc.syncStockFromInventory(); }

  @Get('management/reports/summary') @UseGuards(JwtAuthGuard)
  getMgmtSummary(@Query('period') period: string) { return this.svc.getManagementSummary(period); }

  @Get('management/reports/by-cashier') @UseGuards(JwtAuthGuard)
  getMgmtByCashier(@Query() q: any) { return this.svc.getReportsCashiers(q); }

  @Get('management/reports/by-product') @UseGuards(JwtAuthGuard)
  getMgmtByProduct(@Query() q: any) { return this.svc.getReportsProducts(q); }

  @Get('management/reports/by-payment') @UseGuards(JwtAuthGuard)
  getMgmtByPayment(@Query() q: any) { return this.svc.getReportsPayments(q); }

  @Get('management/reports/export-csv') @UseGuards(JwtAuthGuard)
  async exportCsvReport(@Query() q: any, @Res() res: any) {
    const csv = await this.svc.exportReportCsv(q);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pos_report_${q.from || 'all'}.csv"`);
    res.send('\uFEFF' + csv);
  }

  @Patch('management/transactions/:id/void') @UseGuards(JwtAuthGuard)
  voidTransaction(@Param('id') id: string, @Body() body: any) {
    return this.svc.voidTransaction(id, body.reason);
  }
}
