// src/audit/audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

// Ações que devem ser auditadas (método HTTP + path parcial)
const AUDIT_ACTIONS: Record<string, string> = {
  'POST /auth/login':            'auth.login',
  'POST /auth/logout':           'auth.logout',
  'POST /cash/open':             'cash.open',
  'POST /cash/close':            'cash.close',
  'POST /transactions':          'transaction.create',
  'PATCH /transactions':         'transaction.cancel',
  'POST /pending':               'pending.create',
  'PATCH /pending':              'pending.resolve',
  'POST /users':                 'user.create',
  'PATCH /users':                'user.update',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req    = context.switchToHttp().getRequest();
    const method = req.method;
    const path   = req.route?.path || req.url;
    const key    = `${method} ${path.split('/').slice(0, 3).join('/')}`;
    const action = AUDIT_ACTIONS[key];

    return next.handle().pipe(
      tap(async (response) => {
        if (!action || !req.user) return;
        try {
          await this.prisma.auditLog.create({
            data: {
              userId:    req.user.id,
              action,
              entity:    path.split('/')[1] || null,
              entityId:  response?.id || req.params?.id || null,
              payload:   { body: req.body, response: response?.id },
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });
        } catch (_) {
          // audit nunca deve quebrar a requisição
        }
      }),
    );
  }
}
