import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DevicesService } from '../services/devices.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/devices')
@Controller('v1/devices')
@UseGuards(StrictJwtGuard)
export class DevicesV1Controller {
  constructor(@Inject(DevicesService) private readonly service: DevicesService) {}

  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.service.create(body); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }

  @Post(':id/assign')
  @HttpCode(HttpStatus.CREATED)
  assign(@Param('id') id: string, @Body() body: any) { return this.service.assign(id, body); }

  @Delete(':id/assign')
  @HttpCode(200)
  unassign(@Param('id') id: string) { return this.service.unassign(id); }

  @Get(':id/readings')
  getReadings(@Param('id') id: string, @Query() query: any) { return this.service.getReadings(id, query); }
}
