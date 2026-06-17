import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus, UploadedFile, UseInterceptors, Request , Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags } from '@nestjs/swagger';
import { ShipmentsService } from '../services/shipments.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

const multerStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`),
});

@ApiTags('v1/shipments')
@Controller('v1/shipments')
@UseGuards(StrictJwtGuard)
export class ShipmentsV1Controller {
  constructor(@Inject(ShipmentsService) private readonly service: ShipmentsService) {}

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
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/events')
  getEvents(@Param('id') id: string) { return this.service.getEvents(id); }

  @Post(':id/events')
  @HttpCode(HttpStatus.CREATED)
  createEvent(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.service.createEvent(id, body, req.user?.sub);
  }

  @Get(':id/items')
  getItems(@Param('id') id: string) { return this.service.getItems(id); }

  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  createItem(@Param('id') id: string, @Body() body: any) { return this.service.createItem(id, body); }

  @Get(':id/telemetry')
  getTelemetry(@Param('id') id: string, @Query() query: any) { return this.service.getTelemetry(id, query); }

  @Get(':id/comments')
  getComments(@Param('id') id: string) { return this.service.getComments(id); }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  createComment(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.service.createComment(id, body, req.user?.sub ?? 'anon');
  }

  @Get(':id/attachments')
  getAttachments(@Param('id') id: string) { return this.service.getAttachments(id); }

  @Post(':id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: multerStorage }))
  createAttachment(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() body: any, @Request() req: any) {
    return this.service.createAttachment(id, file, body.description, req.user?.sub);
  }

  @Get(':id/devices')
  getDevices(@Param('id') id: string) { return this.service.getDevices(id); }

  @Post(':id/devices')
  @HttpCode(HttpStatus.CREATED)
  assignDevice(@Param('id') id: string, @Body() body: any) { return this.service.assignDevice(id, body.deviceId); }

  @Delete(':id/devices/:deviceId')
  @HttpCode(200)
  unassignDevice(@Param('id') id: string, @Param('deviceId') deviceId: string) { return this.service.unassignDevice(id, deviceId); }
}
