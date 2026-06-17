import { Controller, Get, Put, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmailService } from '../services/email.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/email')
@Controller('v1/email')
@UseGuards(StrictJwtGuard)
export class EmailV1Controller {
  constructor(@Inject(EmailService) private readonly service: EmailService) {}

  @Get('settings')
  getSettings() { return this.service.getSettings(); }

  @Put('settings')
  updateSettings(@Body() body: any) { return this.service.updateSettings(body); }

  @Post('test')
  @HttpCode(200)
  sendTest(@Body() body: any) { return this.service.sendTest(body.to); }

  @Get('templates')
  getTemplates() { return this.service.findTemplates(); }

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  createTemplate(@Body() body: any) { return this.service.createTemplate(body); }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) { return this.service.findTemplate(id); }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: any) { return this.service.updateTemplate(id, body); }

  @Delete('templates/:id')
  @HttpCode(200)
  deleteTemplate(@Param('id') id: string) { return this.service.deleteTemplate(id); }
}

@ApiTags('v1/document-templates')
@Controller('v1/document-templates')
@UseGuards(StrictJwtGuard)
export class DocumentTemplatesV1Controller {
  constructor(@Inject(EmailService) private readonly service: EmailService) {}

  @Get()
  findAll() { return this.service.findDocumentTemplates(); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) { return this.service.createDocumentTemplate(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.updateDocumentTemplate(id, body); }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) { return this.service.deleteDocumentTemplate(id); }
}

@ApiTags('v1/documents')
@Controller('v1/documents')
@UseGuards(StrictJwtGuard)
export class DocumentsV1Controller {
  @Post('generate/bol')
  @HttpCode(200)
  generateBol(@Body() body: any) {
    return { url: `/api/v1/shipments/${body.shipmentId}/bol.pdf`, message: 'BOL generation not yet implemented' };
  }

  @Post('rate-confirmation')
  @HttpCode(200)
  rateConfirmation(@Body() body: any) {
    return { url: `/api/v1/shipments/${body.shipmentId}/rate-confirmation.pdf`, message: 'Rate confirmation not yet implemented' };
  }
}
