// src/pending/pending.module.ts
import { Module } from '@nestjs/common';
import { PendingController } from './pending.controller';
import { PendingService } from './pending.service';
import { CashModule } from '../cash/cash.module';

@Module({
  imports: [CashModule],
  controllers: [PendingController],
  providers: [PendingService],
})
export class PendingModule {}
