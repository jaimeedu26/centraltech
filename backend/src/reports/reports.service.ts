import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async getTransactions(from: Date, to: Date, filters: any = {}) {
    return this.prisma.transaction.findMany({
      where: {
        isCancelled: false,
        createdAt: { gte: from, lte: to },
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.category && { category: filters.category }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
        ...(filters.type && { type: filters.type }),
      },
      include: {
        user: { select: { name: true } },
        cashRegister: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async daily(date: string, filters: any) {
    const day = new Date(date);
    const from = new Date(day); from.setHours(0, 0, 0, 0);
    const to   = new Date(day); to.setHours(23, 59, 59, 999);
    const transactions = await this.getTransactions(from, to, filters);
    return this.buildSummary(transactions, from, to);
  }

  async weekly(date: string, filters: any) {
    const day = new Date(date);
    const from = new Date(day); from.setDate(day.getDate() - day.getDay());
    from.setHours(0, 0, 0, 0);
    const to = new Date(from); to.setDate(from.getDate() + 6); to.setHours(23, 59, 59, 999);
    const transactions = await this.getTransactions(from, to, filters);
    return this.buildSummary(transactions, from, to);
  }

  async monthly(year: number, month: number, filters: any) {
    const from = new Date(year, month - 1, 1);
    const to   = new Date(year, month, 0, 23, 59, 59, 999);
    const transactions = await this.getTransactions(from, to, filters);
    return this.buildSummary(transactions, from, to);
  }

  private buildSummary(transactions: any[], from: Date, to: Date) {
    const entradas = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
    const saidas   = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
    const sangrias = transactions.filter(t => t.type === 'BLEED').reduce((s, t) => s + Number(t.amount), 0);
    const reforcos = transactions.filter(t => t.type === 'REINFORCE').reduce((s, t) => s + Number(t.amount), 0);

    return {
      periodo: { de: from, ate: to },
      resumo: { entradas, saidas, sangrias, reforcos, saldo: entradas - saidas },
      transacoes: transactions,
    };
  }
}