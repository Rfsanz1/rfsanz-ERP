import { Controller, Get, Post, Put, Delete, Param, Body, Query, Inject, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExpenseService } from './expense.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('expenses')
@ApiBearerAuth('access-token')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(@Inject(ExpenseService) private readonly svc: ExpenseService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar expense dengan filter' })
  findAll(@Query() q: any) {
    return this.svc.findAll(q);
  }

  @Get('reports/summary')
  @ApiOperation({ summary: 'Ringkasan biaya berdasarkan filter' })
  getSummary(@Query() q: any) {
    return this.svc.summary(q);
  }

  @Get('reports/by-account')
  @ApiOperation({ summary: 'Ringkasan biaya per akun' })
  byAccount(@Query() q: any) {
    return this.svc.byAccount(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail expense' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/journals')
  @ApiOperation({ summary: 'Jurnal terkait expense' })
  findExpenseJournals(@Param('id') id: string) {
    return this.svc.getExpenseJournals(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat expense baru' })
  create(@Body() dto: CreateExpenseDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update expense' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus expense (hanya draft)' })
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit expense untuk approval' })
  submit(@Param('id') id: string) {
    return this.svc.submit(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve expense' })
  approve(@Param('id') id: string) {
    return this.svc.approve(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject expense dan kembali ke draft' })
  reject(@Param('id') id: string) {
    return this.svc.reject(id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Bayar expense yang sudah disetujui' })
  pay(@Param('id') id: string, @Body() dto: { paymentAccountId: string; paidBy?: string }) {
    return this.svc.pay(id, dto.paymentAccountId, dto.paidBy || 'system');
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import expense dari file Excel' })
  import(@UploadedFile() file: any, @Body() body: any) {
    if (file && file.buffer) return this.svc.import(file.buffer);
    if (body && body.fileBase64) return this.svc.import(Buffer.from(body.fileBase64, 'base64'));
    return { message: 'No file provided' };
  }
}
