import { Injectable, ExecutionContext } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
