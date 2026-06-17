import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CAN_ACCESS_KEY, CanAccessOptions } from '../decorators/can-access.decorator.js';
import { canAccess } from '../utils/can-access.js';

@Injectable()
export class CanAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    if (!this.reflector) return true;
    const options = this.reflector.getAllAndOverride<CanAccessOptions>(CAN_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return canAccess(user, options);
  }
}
