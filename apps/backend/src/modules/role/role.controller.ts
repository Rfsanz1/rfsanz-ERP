import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super admin', 'owner')
export class RoleController {
  constructor(@Inject(RoleService) private readonly roleService: RoleService) {}

  @Get()
  getRoles(@CurrentUser() user: any) {
    return this.roleService.findAll(user.tenantId);
  }

  @Get('permissions')
  getPermissions() {
    return this.roleService.findPermissions();
  }

  @Get(':id')
  getRole(@CurrentUser() user: any, @Param('id') id: string) {
    return this.roleService.findOne(id, user.tenantId);
  }

  @Post()
  createRole(@CurrentUser() user: any, @Body() dto: CreateRoleDto) {
    return this.roleService.create(dto, user.tenantId);
  }

  @Put(':id')
  updateRole(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateRoleDto) {
    return this.roleService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  deleteRole(@CurrentUser() user: any, @Param('id') id: string) {
    return this.roleService.remove(id, user.tenantId);
  }

  @Post(':id/assign-permissions')
  assignPermissions(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    return this.roleService.assignPermissions(id, dto.permissionIds, user.tenantId);
  }
}
