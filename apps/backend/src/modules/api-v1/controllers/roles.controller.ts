import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleService } from '../../role/role.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/roles')
@Controller('v1/roles')
@UseGuards(StrictJwtGuard)
export class RolesV1Controller {
  constructor(@Inject(RoleService) private readonly roleService: RoleService) {}

  @Get()
  async findAll() {
    const result = await this.roleService.findAll('default');
    return (result as any).data;
  }

  @Get('permissions')
  async getPermissions() {
    const result = await this.roleService.findPermissions();
    return (result as any).data.map((p: any) => `${p.module}.${p.action}`);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.roleService.findOne(id, 'default');
    return (result as any).data;
  }

  @Post()
  async create(@Body() body: any) {
    const result = await this.roleService.create(body, 'default');
    return (result as any).data;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const result = await this.roleService.update(id, body, 'default');
    return (result as any).data;
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    await this.roleService.remove(id, 'default');
    return { success: true };
  }

  @Post(':roleId/users/:userId')
  async assignUser(@Param('roleId') roleId: string, @Param('userId') userId: string) {
    await this.roleService.assignPermissions(roleId, [userId], 'default');
    return { assigned: true };
  }

  @Delete(':roleId/users/:userId')
  @HttpCode(200)
  async removeUser(@Param('roleId') roleId: string, @Param('userId') _userId: string) {
    await this.roleService.assignPermissions(roleId, [], 'default');
    return { removed: true };
  }
}
