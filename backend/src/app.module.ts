// src/app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CashModule } from './cash/cash.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PendingModule } from './pending/pending.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    // Rate limiting: 100 req por IP a cada 15 minutos
    ThrottlerModule.forRoot([{ ttl: 900000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CashModule,
    TransactionsModule,
    PendingModule,
    DashboardModule,
    ReportsModule,
  ],
})
export class AppModule {}
