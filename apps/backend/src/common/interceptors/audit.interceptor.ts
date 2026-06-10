import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../database/prisma.service.js';

const AUDIT_MODULES = ['finance', 'inventory', 'sales', 'purchasing', 'payroll', 'assets', 'accounting', 'tax'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method as string;
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next.handle();

    const url: string = req.url ?? '';
    const isAuditTarget = AUDIT_MODULES.some(m => url.includes(`/api/${m}`));
    if (!isAuditTarget) return next.handle();

    const user = req.user;
    const actorId: string | null = user?.id ?? user?.sub ?? null;
    const ipAddress: string = String(req.ip ?? req.headers['x-forwarded-for'] ?? '').slice(0, 100);
    const userAgent: string = String(req.headers['user-agent'] ?? '').slice(0, 250);
    const branchId: string | undefined = req.headers['x-branch-id'] ?? undefined;

    const segments = url.replace('/api/', '').split('?')[0].split('/').filter(Boolean);
    const resource = segments[0] ?? url;
    const action = method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE';

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              actorId,
              action,
              resource,
              tableName: segments[0] ?? null,
              recordId: segments[1] ?? null,
              newData: result && typeof result === 'object' ? result : null,
              ipAddress,
              userAgent,
              branchId: branchId ?? null,
              metadata: { method, url: url.slice(0, 200) },
            },
          });
        } catch { /* audit failure tidak boleh break operation utama */ }
      }),
    );
  }
}
