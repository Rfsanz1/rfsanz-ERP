import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserService } from './user.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.userService.getCurrentUser(user.userId || user.sub || user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'Super Admin', 'Owner')
  async listUsers(@CurrentUser() user: any) {
    return this.userService.findAll(user.tenantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'Super Admin', 'Owner')
  async createUser(
    @CurrentUser() user: any,
    @Body() body: { name: string; email: string; password: string; roleId: string },
  ) {
    return this.userService.create({ ...body, tenantId: user.tenantId });
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'Super Admin', 'Owner')
  async updateUser(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; password?: string; roleId?: string },
  ) {
    return this.userService.update(id, body, user.tenantId);
  }

  @Patch(':id/toggle-active')
  @UseGuards(RolesGuard)
  @Roles('admin', 'Super Admin', 'Owner')
  async toggleActive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.userService.toggleActive(id, user.tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'Super Admin', 'Owner')
  async deleteUser(@CurrentUser() user: any, @Param('id') id: string) {
    return this.userService.remove(id, user.tenantId);
  }
}
