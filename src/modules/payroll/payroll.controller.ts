import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';

@ApiTags('payroll')
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  private getCompanyId(req: any) {
    return (
      req.user?.companyId ||
      req.session?.companyId ||
      req.headers['x-company-id']
    );
  }

  // --- EMPLOYEES ---
  @Get('employees')
  @ApiOperation({ summary: 'Get all employees' })
  async getEmployees(@Req() req: any, @Query('status') status?: string) {
    return this.payrollService.getEmployees(
      this.getCompanyId(req),
      status as any,
    );
  }

  @Post('employees')
  @ApiOperation({ summary: 'Create employee' })
  async createEmployee(@Req() req: any, @Body() body: any) {
    return this.payrollService.createEmployee(this.getCompanyId(req), body);
  }

  @Put('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  async updateEmployee(@Param('id') id: string, @Body() body: any) {
    return this.payrollService.updateEmployee(id, body);
  }

  @Post('employees/:id/terminate')
  @ApiOperation({ summary: 'Terminate employee' })
  async terminateEmployee(
    @Param('id') id: string,
    @Body('terminationDate') terminationDate: string,
  ) {
    return this.payrollService.terminateEmployee(id, terminationDate);
  }

  // --- RETENTION RATES ---
  @Get('retention-rates')
  @ApiOperation({ summary: 'Get retention rates' })
  async getRetentionRates(@Req() req: any, @Query('type') type?: string) {
    return this.payrollService.getRetentionRates(
      this.getCompanyId(req),
      type as any,
    );
  }

  @Post('retention-rates')
  @ApiOperation({ summary: 'Create retention rate' })
  async createRetentionRate(@Req() req: any, @Body() body: any) {
    return this.payrollService.createRetentionRate(
      this.getCompanyId(req),
      body,
    );
  }

  @Put('retention-rates/:id')
  @ApiOperation({ summary: 'Update retention rate' })
  async updateRetentionRate(@Param('id') id: string, @Body() body: any) {
    return this.payrollService.updateRetentionRate(id, body);
  }

  // --- PAYROLL RUN ---
  @Post('run')
  @ApiOperation({ summary: 'Create payroll run' })
  async createPayrollRun(
    @Req() req: any,
    @Body('periodStart') periodStart: string,
    @Body('periodEnd') periodEnd: string,
  ) {
    return this.payrollService.createPayrollRun(
      this.getCompanyId(req),
      periodStart,
      periodEnd,
    );
  }

  @Post('run/:id/process')
  @ApiOperation({ summary: 'Process payroll run' })
  async processPayrollRun(@Param('id') id: string) {
    return this.payrollService.processPayrollRun(id);
  }

  @Get('runs')
  @ApiOperation({ summary: 'Get all payroll runs' })
  async getPayrollRuns(@Req() req: any) {
    return this.payrollService.getPayrollRuns(this.getCompanyId(req));
  }

  @Get('run/:id/ledger')
  @ApiOperation({ summary: 'Get payroll ledger by run' })
  async getPayrollLedgerByRun(@Param('id') id: string) {
    return this.payrollService.getPayrollLedgerByRun(id);
  }
}
