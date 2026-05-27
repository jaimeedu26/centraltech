import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CashService } from '../cash/cash.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private cashService: CashService,
  ) {}

  async findAll(userId: string, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.transaction.findMany({
        include: { user: { select: { name: true } }, cashRegister: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }
    const cash = await this.cashService.getCurrent(userId);
    if (!cash) throw new BadRequestException('Nenhum caixa aberto.');
    return this.prisma.transaction.findMany({
      where: { cashRegisterId: cash.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: {
    type: 'INCOME' | 'EXPENSE' | 'BLEED' | 'REINFORCE';
    category: string;
    paymentMethod?: string;
    amount: number;
    description?: string;
  }) {
    const cash = await this.cashService.getCurrent(userId);
    if (!cash) throw new BadRequestException('Abra o caixa antes de registrar movimentações.');
    if (dto.amount <= 0) throw new BadRequestException('Valor deve ser maior que zero.');

    return this.prisma.transaction.create({
      data: {
        cashRegisterId: cash.id,
        userId,
        type: dto.type,
        category: dto.category,
        paymentMethod: dto.paymentMethod,
        amount: dto.amount,
        description: dto.description,
      },
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });
    if (!t) throw new NotFoundException('Transação não encontrada.');
    return t;
  }

  async cancel(id: string, adminId: string, reason: string) {
    const t = await this.findOne(id);
    if (t.isCancelled) throw new BadRequestException('Transação já cancelada.');
    if (!reason) throw new BadRequestException('Motivo do cancelamento é obrigatório.');

    return this.prisma.transaction.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledBy: adminId,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }
}