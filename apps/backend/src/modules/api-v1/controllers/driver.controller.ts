import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus, Request, UploadedFile, UseInterceptors , Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags } from '@nestjs/swagger';
import { DriverService } from '../services/driver.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

const multerStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => cb(null, `proof-${Date.now()}${extname(file.originalname)}`),
});

@ApiTags('v1/driver')
@Controller('v1/driver')
@UseGuards(StrictJwtGuard)
export class DriverV1Controller {
  constructor(@Inject(DriverService) private readonly service: DriverService) {}

  @Post('location')
  @HttpCode(200)
  saveLocation(@Request() req: any, @Body() body: any) {
    return this.service.saveLocation(req.user.sub, body);
  }

  @Get('location/:driverId')
  getLatestLocation(@Param('driverId') driverId: string) {
    return this.service.getLatestLocation(driverId);
  }

  @Get('location/:driverId/history')
  getLocationHistory(@Param('driverId') driverId: string, @Query() query: any) {
    return this.service.getLocationHistory(driverId, query);
  }

  @Get('orders')
  getOrders(@Request() req: any, @Query() query: any) {
    return this.service.getOrders(req.user.sub, query);
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.service.getOrder(id);
  }

  @Patch('orders/:id/status')
  @HttpCode(200)
  updateOrderStatus(@Param('id') id: string, @Body() body: any) {
    return this.service.updateOrderStatus(id, body);
  }

  @Post('orders/:id/proof')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo', { storage: multerStorage }))
  createProof(@Param('id') id: string, @Request() req: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.service.createProof(id, req.user.sub, file, body);
  }

  @Get('orders/:id/proof')
  getProofs(@Param('id') id: string) {
    return this.service.getProofs(id);
  }

  @Get('earnings')
  getEarnings(@Request() req: any, @Query() query: any) {
    return this.service.getEarnings(req.user.sub, query);
  }
}
