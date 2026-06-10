import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  status() {
    return {
      status: 'ok',
      service: 'erp-modern-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
