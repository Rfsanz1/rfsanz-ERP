import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LanesService } from '../services/lanes.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/lanes')
@Controller('v1/lanes')
@UseGuards(StrictJwtGuard)
export class LanesV1Controller {
  constructor(@Inject(LanesService) private readonly service: LanesService) {}

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

  @Post(':id/carriers')
  @HttpCode(HttpStatus.CREATED)
  addCarrier(@Param('id') id: string, @Body() body: any) { return this.service.addCarrier(id, body); }

  @Put(':id/carriers/:carrierId')
  updateCarrier(@Param('id') id: string, @Param('carrierId') carrierId: string, @Body() body: any) {
    return this.service.updateCarrier(id, carrierId, body);
  }

  @Post(':id/carriers/:carrierId/assign')
  @HttpCode(200)
  assignCarrier(@Param('id') id: string, @Param('carrierId') carrierId: string) {
    return this.service.assignCarrier(id, carrierId);
  }

  @Delete(':id/carriers/:carrierId')
  @HttpCode(200)
  removeCarrier(@Param('id') id: string, @Param('carrierId') carrierId: string) {
    return this.service.removeCarrier(id, carrierId);
  }

  @Post(':id/customers')
  @HttpCode(HttpStatus.CREATED)
  addCustomer(@Param('id') id: string, @Body() body: any) { return this.service.addCustomer(id, body.customerId); }

  @Delete(':id/customers/:customerId')
  @HttpCode(200)
  removeCustomer(@Param('id') id: string, @Param('customerId') customerId: string) {
    return this.service.removeCustomer(id, customerId);
  }
}
