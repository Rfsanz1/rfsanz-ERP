import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocationsService } from '../services/locations.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/locations')
@Controller('v1/locations')
@UseGuards(StrictJwtGuard)
export class LocationsV1Controller {
  constructor(@Inject(LocationsService) private readonly service: LocationsService) {}

  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('search')
  search(@Query('q') q: string) { return this.service.search(q ?? ''); }

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
}
