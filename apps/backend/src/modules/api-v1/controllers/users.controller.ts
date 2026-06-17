import { Controller, Get, Patch, Post, Param, Body, UseGuards , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from '../../user/user.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/users')
@Controller('v1/users')
@UseGuards(StrictJwtGuard)
export class UsersV1Controller {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Get()
  async findAll() {
    const tenantId = 'default';
    const result = await this.userService.findAll(tenantId);
    return (result as any[]).map((u: any) => ({
      id: u.id, name: u.name, email: u.email, role: u.role?.name ?? null, isActive: u.isActive, createdAt: u.createdAt,
    }));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.userService.update(id, body, 'default');
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body() body: any) {
    return this.userService.update(id, { password: body.newPassword }, 'default');
  }
}
