import {
  Injectable, BadRequestException, NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(userId: string) {
    return this.prisma.cashRegister.findFirst({
      where: { userId, status: 'OPEN' },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { transactions: true, pendingTransactions: true } },
      },
    });
  }

  async open(userId: string, dto: { openingAmount: number; openingNote?: string }) {
    const existing = await this.getCurrent(userId);
    if (existing) throw new BadRequestException('Já existe um caixa aberto para este operador.');
    return this.prisma.cashRegister.create({
      data: {
        userId,
        openingAmount: dto.openingAmount,
        openingNote: dto.openingNote,
        status: 'OPEN',
      },
    });
  }

  async close(userId: string, dto: { physicalAmount: number; closingNote?: string }) {
    const cash = await this.getCurrent(userId);
    if (!cash) throw new NotFoundException('Nenhum caixa aberto encontrado.');

    const transactions = await this.prisma.transaction.findMany({
      where: { cashRegisterId: cash.id, isCancelled: false },
    });

    const entradas  = this.sumType(transactions, 'INCOME');
    const saidas    = this.sumType(transactions, 'EXPENSE');
    const sangrias  = this.sumType(transactions, 'BLEED');
    const reforcos  = this.sumType(transactions, 'REINFORCE');

    const expectedAmount = Number(cash.openingAmount) + entradas + reforcos - saidas - sangrias;
    const differenceAmount = dto.physicalAmount - expectedAmount;

    if (differenceAmount !== 0 && !dto.closingNote) {
      throw new BadRequestException(
        `Diferença de R$ ${differenceAmount.toFixed(2)} detectada. Justificativa obrigatória no campo closingNote.`
      );
    }

    const pendencias = await this.prisma.pendingTransaction.count({
      where: { cashRegisterId: cash.id, status: 'PENDING' },
    });

    return this.prisma.cashRegister.update({
      where: { id: cash.id },
      data: {
        status: 'CLOSED',
        closingAmount: dto.physicalAmount,
        expectedAmount,
        physicalAmount: dto.physicalAmount,
        differenceAmount,
        closingNote: dto.closingNote,
        closedAt: new Date(),
      },
      include: { user: { select: { name: true } } },
    }).then(result => ({
      ...result,
      summary: { entradas, saidas, sangrias, reforcos, expectedAmount, differenceAmount },
      pendenciasEmAberto: pendencias,
    }));
  }

  async history(filters: { userId?: string; dateFrom?: string; dateTo?: string }) {
    return this.prisma.cashRegister.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.dateFrom && { openedAt: { gte: new Date(filters.dateFrom) } }),
        ...(filters.dateTo && { closedAt: { lte: new Date(filters.dateTo) } }),
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { openedAt: 'desc' },
    });
  }

  async summary(id: string) {
    const cash = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        transactions: { where: { isCancelled: false } },
        pendingTransactions: true,
      },
    });
    if (!cash) throw new NotFoundException('Caixa não encontrado.');

    const entradas = this.sumType(cash.transactions, 'INCOME');
    const saidas   = this.sumType(cash.transactions, 'EXPENSE');
    const sangrias = this.sumType(cash.transactions, 'BLEED');
    const reforcos = this.sumType(cash.transactions, 'REINFORCE');

    return { ...cash, summary: { entradas, saidas, sangrias, reforcos } };
  }

  private sumType(transactions: any[], type: string) {
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }
}