import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

type RoleRule = { pattern: RegExp; roles: string[]; methods?: string[] };

const ROLE_RULES: RoleRule[] = [
  { pattern: /^\/api\/sales/, roles: ['admin', 'owner', 'super admin', 'sales', 'sales manager'] },
  { pattern: /^\/api\/crm/, roles: ['admin', 'owner', 'super admin', 'sales', 'sales manager'] },
  { pattern: /^\/api\/customers/, roles: ['admin', 'owner', 'super admin', 'sales', 'sales manager', 'kasir'] },
  { pattern: /^\/api\/invoice/, roles: ['admin', 'owner', 'super admin', 'sales', 'sales manager'] },
  { pattern: /^\/api\/reports\/sales/, roles: ['admin', 'owner', 'super admin', 'sales', 'sales manager'] },
  { pattern: /^\/api\/inventory/, roles: ['admin', 'owner', 'super admin', 'staff gudang', 'gudang'] },
  { pattern: /^\/api\/purchasing\/goods-receipts/, roles: ['admin', 'owner', 'super admin', 'staff gudang', 'gudang'] },
  { pattern: /^\/api\/delivery/, roles: ['admin', 'owner', 'super admin', 'staff gudang', 'gudang', 'driver'] },
  { pattern: /^\/api\/pos/, roles: ['admin', 'owner', 'super admin', 'kasir'] },
  { pattern: /^\/api\/products/, roles: ['admin', 'owner', 'super admin', 'kasir'] },
];

@Injectable()
export class RouteRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;

    const roles: string[] = (Array.isArray(user.roles) ? user.roles : []).map((r: string) =>
      r.toLowerCase(),
    );

    if (roles.some((r) => ['admin', 'owner', 'super admin'].includes(r))) {
      return true;
    }

    const path: string = request.path ?? '';
    const matchedRule = ROLE_RULES.find((rule) => rule.pattern.test(path));

    if (!matchedRule) return true;

    const allowed = matchedRule.roles.map((r) => r.toLowerCase());
    if (!roles.some((r) => allowed.includes(r))) {
      throw new ForbiddenException('Akses ditolak: role tidak memiliki izin untuk endpoint ini');
    }

    return true;
  }
}
