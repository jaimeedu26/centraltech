// src/pending/pending.module.ts
import { Module } from '@nestjs/common';
import { PendingController } from './pending.controller';
import { PendingService } from './pending.service';
import { CashModule } from '../cash/cash.module';

@Module({ imports: [CashModule], controllers: [PendingController], providers: [PendingService] })
export class PendingModule {}

// ─────────────────────────────────────────────────────────────
// src/pending/pending.service.ts
// ─────────────────────────────────────────────────────────────
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CashService } from '../cash/cash.service';

@Injectable()
export class PendingService {
  constructor(private prisma: PrismaService, private cashService: CashService) {}

  async findAll(userId: string) {
    const cash = await this.cashService.getCurrent(userId);
    if (!cash) throw new BadRequestException('Nenhum caixa aberto.');
    return this.prisma.pendingTransaction.findMany({
      where: { cashRegisterId: cash.id },
      include: {
        createdBy: { select: { name: true } },
        resolvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: { clientName?: string; amount: number; reason: string }) {
    const cash = await this.cashService.getCurrent(userId);
    if (!cash) throw new BadRequestException('Abra o caixa antes de registrar pendências.');
    return this.prisma.pendingTransaction.create({
      data: { cashRegisterId: cash.id, createdById: userId, ...dto, status: 'PENDING' },
    });
  }

  async resolve(id: string, userId: string, dto: { resolutionNote?: string }) {
    const p = await this.prisma.pendingTransaction.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pendência não encontrada.');
    if (p.status !== 'PENDING') throw new BadRequestException('Pendência já resolvida ou cancelada.');

    const cash = await this.cashService.getCurrent(userId);
    if (!cash) throw new BadRequestException('Nenhum caixa aberto para registrar a resolução.');

    // Gera transação de entrada automaticamente ao resolver
    await this.prisma.transaction.create({
      data: {
        cashRegisterId: cash.id,
        userId,
        type: 'INCOME',
        category: 'Pendência resolvida',
        amount: p.amount,
        description: `Pendência resolvida: ${p.reason}${p.clientName ? ' — ' + p.clientName : ''}`,
      },
    });

    return this.prisma.pendingTransaction.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedById: userId,
        resolvedAt: new Date(),
        resolutionNote: dto.resolutionNote,
      },
    });
  }

  async cancel(id: string) {
    const p = await this.prisma.pendingTransaction.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pendência não encontrada.');
    return this.prisma.pendingTransaction.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
