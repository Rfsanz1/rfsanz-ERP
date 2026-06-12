import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KledoController } from './kledo.controller.js';
import { KledoService } from './kledo.service.js';

@Module({
  imports: [HttpModule],
  controllers: [KledoController],
  providers: [KledoService],
  exports: [KledoService],
})
export class KledoModule {}
