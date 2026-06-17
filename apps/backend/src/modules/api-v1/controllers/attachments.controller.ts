import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus, Request, UploadedFile, UseInterceptors, StreamableFile, Res , Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags } from '@nestjs/swagger';
import { AttachmentsService } from '../services/attachments.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';
import * as fs from 'fs';
import { Response } from 'express';

const multerStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`),
});

@ApiTags('v1/attachments')
@Controller('v1/attachments')
@UseGuards(StrictJwtGuard)
export class AttachmentsV1Controller {
  constructor(@Inject(AttachmentsService) private readonly service: AttachmentsService) {}

  @Get()
  findAll(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.service.findAll(entityType, entityId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: multerStorage, limits: { fileSize: 50 * 1024 * 1024 } }))
  create(@UploadedFile() file: Express.Multer.File, @Body() body: any, @Request() req: any) {
    return this.service.create(file, body, req.user?.sub);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const att = await this.service.findOne(id);
    const filePath = this.service.getFilePath(att.storagePath);
    res.setHeader('Content-Disposition', `attachment; filename="${att.fileName}"`);
    res.setHeader('Content-Type', att.mimeType);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
