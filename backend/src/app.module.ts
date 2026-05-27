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
import { AppController } from './app.controller';

@Module({
  imports: [
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
  controllers: [AppController],
})
export class AppModule {}