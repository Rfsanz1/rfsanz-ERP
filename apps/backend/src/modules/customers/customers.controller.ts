import { Controller, Get, Post, Put, Delete, Param, Body, Query, Inject, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(@Inject(CustomersService) private readonly svc: CustomersService) {}

  @Get('summary') getSummary() { return this.svc.getSummary(); }
  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }
}
