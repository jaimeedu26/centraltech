// src/pending/pending.controller.ts
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PendingService } from './pending.service';

@UseGuards(JwtAuthGuard)
@Controller('pending')
export class PendingController {
  constructor(private service: PendingService) {}

  @Get()
  findAll(@Request() req) { return this.service.findAll(req.user.id); }

  @Post()
  create(@Request() req, @Body() body: any) { return this.service.create(req.user.id, body); }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.service.resolve(id, req.user.id, body);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) { return this.service.cancel(id); }
}
