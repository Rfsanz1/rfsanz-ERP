import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator.js';

@Controller('tenant')
export class TenantController {
  constructor(@Inject(TenantService) private readonly tenantService: TenantService) {}

  @Get('check-slug')
  async checkSlug(@Query('slug') slug: string) {
    return this.tenantService.checkSlug(slug);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get('me')
  async me(@CurrentTenant() tenantId: string) {
    return this.tenantService.getTenantProfile(tenantId);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Patch('me')
  async updateMe(@CurrentTenant() tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.updateTenantProfile(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get('me/stats')
  async stats(@CurrentTenant() tenantId: string) {
    return this.tenantService.getTenantStats(tenantId);
  }
}
