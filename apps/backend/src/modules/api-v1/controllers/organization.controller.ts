import { Controller, Get, Put, Delete, Post, Body, UseGuards, HttpCode, UploadedFile, UseInterceptors , Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

const multerStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => cb(null, `logo-${Date.now()}${extname(file.originalname)}`),
});

@ApiTags('v1/organization')
@Controller('v1/organization')
@UseGuards(StrictJwtGuard)
export class OrganizationV1Controller {
  constructor(@Inject(OrganizationService) private readonly service: OrganizationService) {}

  @Get('settings')
  getSettings() { return this.service.getSettings(); }

  @Put('settings')
  updateSettings(@Body() body: any) { return this.service.updateSettings(body); }

  @Get('trackable-unit-label')
  getTrackableUnitLabel() { return { label: 'Package' }; }
}

@ApiTags('v1/theme')
@Controller('v1/theme')
@UseGuards(StrictJwtGuard)
export class ThemeV1Controller {
  constructor(@Inject(OrganizationService) private readonly service: OrganizationService) {}

  @Get()
  getTheme() { return this.service.getTheme(); }

  @Put()
  updateTheme(@Body() body: any) { return this.service.updateTheme(body); }

  @Delete()
  @HttpCode(200)
  resetTheme() { return this.service.resetTheme(); }

  @Post('logo')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', { storage: multerStorage }))
  uploadLogo(@UploadedFile() file: Express.Multer.File) { return this.service.uploadLogo(file); }

  @Delete('logo')
  @HttpCode(200)
  removeLogo() { return this.service.removeLogo(); }
}
