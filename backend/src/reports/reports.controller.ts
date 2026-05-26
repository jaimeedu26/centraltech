// src/reports/reports.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('daily')
  daily(@Query('date') date: string, @Query() filters: any) {
    return this.service.daily(date || new Date().toISOString().split('T')[0], filters);
  }

  @Get('weekly')
  weekly(@Query('date') date: string, @Query() filters: any) {
    return this.service.weekly(date || new Date().toISOString().split('T')[0], filters);
  }

  @Get('monthly')
  monthly(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query() filters: any,
  ) {
    return this.service.monthly(
      parseInt(year) || new Date().getFullYear(),
      parseInt(month) || new Date().getMonth() + 1,
      filters,
    );
  }
}
