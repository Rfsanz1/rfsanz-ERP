import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TmsCustomersService } from '../services/tms-customers.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/customers')
@Controller('v1/customers')
@UseGuards(StrictJwtGuard)
export class CustomersV1Controller {
  constructor(@Inject(TmsCustomersService) private readonly service: TmsCustomersService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.service.create(body); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
