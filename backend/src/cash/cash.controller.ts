// src/cash/cash.controller.ts
import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CashService } from './cash.service';

@UseGuards(JwtAuthGuard)
@Controller('cash')
export class CashController {
  constructor(private cashService: CashService) {}

  @Get('current')
  current(@Request() req) {
    return this.cashService.getCurrent(req.user.id);
  }

  @Post('open')
  open(@Request() req, @Body() body: any) {
    return this.cashService.open(req.user.id, body);
  }

  @Post('close')
  close(@Request() req, @Body() body: any) {
    return this.cashService.close(req.user.id, body);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('history')
  history(@Query() query: any) {
    return this.cashService.history(query);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get(':id/summary')
  summary(@Param('id') id: string) {
    return this.cashService.summary(id);
  }
}
