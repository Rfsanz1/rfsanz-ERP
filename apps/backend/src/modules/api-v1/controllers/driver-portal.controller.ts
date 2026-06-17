import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus, Request,
  UploadedFile, UseInterceptors, Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags } from '@nestjs/swagger';
import { DriverPortalService } from '../services/driver-portal.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

const tmpStorage = diskStorage({
  destination: '/tmp/driver-portal-uploads',
  filename: (_req, file, cb) => cb(null, `tmp-${Date.now()}${extname(file.originalname)}`),
});

@ApiTags('v1/driver-portal')
@Controller('v1/driver-portal')
export class DriverPortalController {
  constructor(@Inject(DriverPortalService) private readonly service: DriverPortalService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const { identifier, password } = body ?? {};
    const result = await this.service.login(identifier, password);
    return { token: result.token, user: result.user, data: result, error: null };
  }

  @Get('my-loads')
  @UseGuards(StrictJwtGuard)
  async getMyLoads(@Request() req: any, @Query() query: any) {
    const loads = await this.service.getMyLoads(req.user.sub, query);
    return loads;
  }

  @Get('loads/:id')
  @UseGuards(StrictJwtGuard)
  async getLoad(@Param('id') id: string) {
    return this.service.getLoad(id);
  }

  @Post('loads/:id/status')
  @UseGuards(StrictJwtGuard)
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.service.updateLoadStatus(id, req.user.sub, body);
  }

  @Get('loads/:id/documents')
  @UseGuards(StrictJwtGuard)
  async getLoadDocuments(@Param('id') id: string) {
    return this.service.getLoadDocuments(id);
  }

  @Post('loads/:id/documents')
  @UseGuards(StrictJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: tmpStorage, limits: { fileSize: 50 * 1024 * 1024 } }))
  async uploadDocument(
    @Param('id') id: string,
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.service.uploadLoadDocument(id, req.user.sub, file, body.documentType);
  }

  @Post('stops/:stopId/signature')
  @UseGuards(StrictJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('signature', { storage: tmpStorage, limits: { fileSize: 50 * 1024 * 1024 } }))
  async uploadSignature(
    @Param('stopId') stopId: string,
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.service.uploadStopSignature(stopId, req.user.sub, file, body.recipientName);
  }

  @Post('loads/:id/location')
  @UseGuards(StrictJwtGuard)
  @HttpCode(HttpStatus.OK)
  async saveLocation(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.service.saveLocation(id, req.user.sub, body);
  }

  @Get('documents')
  @UseGuards(StrictJwtGuard)
  async getAllDocuments(@Request() req: any) {
    return this.service.getAllDocuments(req.user.sub);
  }

  @Get('report')
  @UseGuards(StrictJwtGuard)
  async getReport(@Request() req: any, @Query('period') period: string) {
    return this.service.getReport(req.user.sub, period ?? 'all');
  }

  @Post('change-password')
  @UseGuards(StrictJwtGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: any, @Body() body: any) {
    return this.service.changePassword(req.user.sub, body);
  }
}
