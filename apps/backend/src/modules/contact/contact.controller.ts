import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { UpdateContactDto } from './dto/update-contact.dto.js';
import { QueryContactDto } from './dto/query-contact.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('contacts')
@ApiBearerAuth('access-token')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactController {
  constructor(private readonly svc: ContactService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Ringkasan statistik kontak' })
  getSummary() { return this.svc.getSummary(); }

  @Get()
  @ApiOperation({ summary: 'Daftar kontak dengan filter' })
  findAll(@Query() q: QueryContactDto) { return this.svc.findAll(q); }

  @Get(':id')
  @ApiOperation({ summary: 'Detail kontak' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @ApiOperation({ summary: 'Buat kontak baru' })
  create(@Body() dto: CreateContactDto) { return this.svc.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: 'Update kontak' })
  update(@Param('id') id: string, @Body() dto: UpdateContactDto) { return this.svc.update(id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Nonaktifkan kontak (soft delete)' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Semua transaksi kontak' })
  getTransactions(@Param('id') id: string) { return this.svc.getTransactions(id); }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Laporan hutang-piutang kontak' })
  getStatement(@Param('id') id: string) { return this.svc.getStatement(id); }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Saldo hutang/piutang saat ini' })
  getBalance(@Param('id') id: string) { return this.svc.getBalance(id); }
}
