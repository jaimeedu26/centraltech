// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CashModule } from '../cash/cash.module';

@Module({ imports: [CashModule], controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}

// ─────────────────────────────────────────────────────────────
// src/dashboard/dashboard.service.ts
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CashService } from '../cash/cash.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService, private cashService: CashService) {}

  async today(userId: string, role: string) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      isCancelled: false,
      createdAt: { gte: startOfDay, lte: endOfDay },
    };
    if (role !== 'ADMIN') {
      const cash = await this.cashService.getCurrent(userId);
      if (cash) where.cashRegisterId = cash.id;
    }

    const transactions = await this.prisma.transaction.findMany({ where });

    const entradas  = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
    const saidas    = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
    const sangrias  = transactions.filter(t => t.type === 'BLEED').reduce((s, t) => s + Number(t.amount), 0);
    const reforcos  = transactions.filter(t => t.type === 'REINFORCE').reduce((s, t) => s + Number(t.amount), 0);

    // Agrupamento por categoria
    const porCategoria: Record<string, number> = {};
    transactions.filter(t => t.type === 'INCOME').forEach(t => {
      porCategoria[t.category] = (porCategoria[t.category] || 0) + Number(t.amount);
    });

    // Agrupamento por forma de pagamento
    const porFormaPgto: Record<string, number> = {};
    transactions.filter(t => t.type === 'INCOME' && t.paymentMethod).forEach(t => {
      const m = t.paymentMethod!;
      porFormaPgto[m] = (porFormaPgto[m] || 0) + Number(t.amount);
    });

    const pendencias = await this.prisma.pendingTransaction.count({
      where: { status: 'PENDING', createdAt: { gte: startOfDay } },
    });

    return {
      entradas, saidas, sangrias, reforcos,
      saldo: entradas - saidas,
      totalTransacoes: transactions.length,
      pendenciasAbertas: pendencias,
      porCategoria,
      porFormaPgto,
    };
  }

  async summary(dateFrom: string, dateTo: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        isCancelled: false,
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      include: { cashRegister: { include: { user: { select: { name: true } } } } },
    });
    return transactions;
  }
}

// ─────────────────────────────────────────────────────────────
// src/dashboard/dashboard.controller.ts
// ─────────────────────────────────────────────────────────────
import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('today')
  today(@Request() req) { return this.service.today(req.user.id, req.user.role); }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('summary')
  summary(@Query('dateFrom') from: string, @Query('dateTo') to: string) {
    return this.service.summary(from, to);
  }
}
