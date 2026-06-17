import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CarriersService } from '../services/carriers.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/carriers')
@Controller('v1/carriers')
@UseGuards(StrictJwtGuard)
export class CarriersV1Controller {
  constructor(@Inject(CarriersService) private readonly service: CarriersService) {}

  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.service.create(body); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) { return this.service.archive(id); }

  @Post(':id/validate')
  @HttpCode(200)
  validate(@Param('id') id: string, @Body() body: any) { return this.service.validate(id, body); }

  @Get(':id/shipments')
  getShipments(@Param('id') id: string) { return this.service.getShipments(id); }
}
