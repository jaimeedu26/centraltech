// src/dashboard/dashboard.controller.ts
import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('today')
  today(@Request() req) {
    return this.service.today(req.user.id, req.user.role);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('summary')
  summary(
    @Query('dateFrom') from: string,
    @Query('dateTo') to: string,
  ) {
    return this.service.summary(from, to);
  }
}
