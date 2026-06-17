import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { SelectTenantDto } from './dto/select-tenant.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register tenant dan owner' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Tenant dan owner berhasil dibuat.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login pengguna' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login berhasil — accessToken, refreshToken, user.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  @ApiResponse({ status: 401, description: 'Kredensial tidak valid.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('select-tenant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pilih tenant untuk pengguna dengan beberapa tenant' })
  @ApiBody({ type: SelectTenantDto })
  @ApiResponse({ status: 200, description: 'Tenant berhasil dipilih dan token diterbitkan.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  @ApiResponse({ status: 401, description: 'Tenant tidak valid atau kredensial salah.' })
  async selectTenant(@Body() dto: SelectTenantDto) {
    return this.authService.selectTenant(dto.email, dto.password, dto.tenantId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout — invalidate session' })
  @ApiResponse({ status: 200, description: 'Logout berhasil.' })
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user?.sub ?? user?.id ?? '');
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kirim link reset password ke email' })
  @ApiResponse({ status: 200, description: 'Email reset dikirim (jika terdaftar).' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password dengan token' })
  @ApiResponse({ status: 200, description: 'Password berhasil direset.' })
  @ApiResponse({ status: 400, description: 'Token tidak valid / kadaluarsa.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ganti password (user yang sedang login)' })
  @ApiResponse({ status: 200, description: 'Password berhasil diubah.' })
  @ApiResponse({ status: 401, description: 'Password lama salah.' })
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user?.sub ?? user?.id, dto.oldPassword, dto.newPassword);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token baru.' })
  async refresh(@Body() payload: { refreshToken: string }) {
    return this.authService.refreshToken(payload.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Profil pengguna aktif' })
  async me(@CurrentUser() user: any) {
    return user;
  }
}
