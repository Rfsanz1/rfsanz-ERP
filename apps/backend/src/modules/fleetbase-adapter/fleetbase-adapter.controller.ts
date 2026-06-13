import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Query,
  Inject,
} from '@nestjs/common';
import { FleetbaseAdapterService } from './fleetbase-adapter.service.js';

@Controller('int/v1')
export class FleetbaseAdapterController {
  constructor(@Inject(FleetbaseAdapterService) private readonly service: FleetbaseAdapterService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { identity: string; password: string; remember?: boolean },
  ): Promise<object> {
    return this.service.login(body.identity, body.password);
  }

  @Get('auth/session')
  session(@Headers('authorization') auth: string): object {
    return this.service.session(auth);
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  logout(): object {
    return this.service.logout();
  }

  @Get('users/me')
  getMe(@Headers('authorization') auth: string): object {
    return this.service.getMe(auth);
  }

  @Get('two-fa/check')
  checkTwoFa(@Query('identity') _identity: string): object {
    return this.service.checkTwoFa();
  }

  @Get('users/locale')
  getLocale(): object {
    return this.service.getLocale();
  }

  @Get('auth/organizations')
  getOrganizations(@Headers('authorization') auth: string): object {
    return this.service.getOrganizations(auth);
  }
}
