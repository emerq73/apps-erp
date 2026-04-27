import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Accounting')
@ApiBearerAuth()
@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) { }

    @Get('accounts')
    async getAccounts() {
        return this.accountingService.getAllAccounts();
    }

    @Post('accounts/bulk-import')
    async bulkImportAccounts(@Body() body: any) {
        return this.accountingService.bulkImportAccounts(body.accounts);
    }

    @Put('accounts/:id')
    async updateAccount(@Param('id') id: string, @Body() data: any) {
        return this.accountingService.updateAccount(id, data);
    }

    @Get('accounts/:id/balance')
    async getBalance(@Param('id') id: string) {
        return { balance: await this.accountingService.getBalance(id) };
    }

    @Get('transactions')
    async getTransactions() {
        return this.accountingService.getAllTransactions();
    }

    @Post('entries')
    async createEntry(@Body() body: any, @Req() req: any) {
        return this.accountingService.createEntry(
            body.debitAccountId,
            body.creditAccountId,
            body.amount,
            body.description,
            body.thirdPartyId,
            body.costCenterId,
            body.reference,
            req.user.userId
        );
    }

    // --- TERCEROS ---
    @Get('third-parties')
    async getThirdParties() {
        return this.accountingService.getAllThirdParties();
    }

    @Post('third-parties')
    async createThirdParty(@Body() body: any) {
        return this.accountingService.createThirdParty(body);
    }

    @Put('third-parties/:id')
    async updateThirdParty(@Param('id') id: string, @Body() body: any) {
        return this.accountingService.updateThirdParty(id, body);
    }

    @Delete('third-parties/:id')
    async deleteThirdParty(@Param('id') id: string) {
        return this.accountingService.deleteThirdParty(id);
    }

    // --- CENTROS DE COSTO ---
    @Get('cost-centers')
    async getCostCenters() {
        return this.accountingService.getAllCostCenters();
    }

    @Post('cost-centers')
    async createCostCenter(@Body() body: any) {
        return this.accountingService.createCostCenter(body);
    }

    @Put('cost-centers/:id')
    async updateCostCenter(@Param('id') id: string, @Body() body: any) {
        return this.accountingService.updateCostCenter(id, body);
    }

    @Delete('cost-centers/:id')
    async deleteCostCenter(@Param('id') id: string) {
        return this.accountingService.deleteCostCenter(id);
    }
    @Get('vouchers')
    async getVouchers() {
        return this.accountingService.getVouchers();
    }

    @Post('vouchers')
    async createVoucher(@Body() body: any, @Req() req: any) {
        return this.accountingService.createVoucher(body, req.user.userId);
    }

    @Get('reports/trial-balance')
    async getTrialBalance(@Req() req: any) {
        const { startDate, endDate } = req.query;
        return this.accountingService.getTrialBalance(startDate, endDate);
    }

    @Get('reports/balance-sheet')
    async getBalanceSheet(@Req() req: any) {
        const { date } = req.query;
        return this.accountingService.getBalanceSheet(date);
    }

    @Get('reports/income-statement')
    async getIncomeStatement(@Req() req: any) {
        const { startDate, endDate } = req.query;
        return this.accountingService.getIncomeStatement(startDate, endDate);
    }

    // --- EMPRESA ---
    @Get('companies')
    async getCompanies() {
        return this.accountingService.getAllCompanies();
    }

    @Get('company')
    async getCompany() {
        return this.accountingService.getCompany();
    }

    @Put('company/:id')
    async updateCompany(@Param('id') id: string, @Body() body: any) {
        return this.accountingService.updateCompany(id, body);
    }

    @Post('companies')
    async createCompany(@Body() body: any) {
        return this.accountingService.createCompany(body);
    }

    // --- MONEDAS ---
    @Get('currencies')
    async getCurrencies() {
        return this.accountingService.getCurrencies();
    }

    @Get('exchange-rates')
    async getExchangeRates(@Query('date') date: string) {
        return this.accountingService.getExchangeRates(date);
    }

    @Post('exchange-rates')
    async createExchangeRate(@Body() body: any) {
        return this.accountingService.createExchangeRate(body);
    }

    // --- Impuestos ---
    @Get('taxes')
    async getTaxes() {
        return this.accountingService.getTaxes();
    }

    @Post('taxes')
    async createTax(@Body() body: any) {
        return this.accountingService.createTax(body);
    }

    @Put('taxes/:id')
    async updateTax(@Param('id') id: string, @Body() body: any) {
        return this.accountingService.updateTax(id, body);
    }

    @Delete('taxes/:id')
    async deleteTax(@Param('id') id: string) {
        return this.accountingService.deleteTax(id);
    }

    // --- PERIODOS CONTABLES ---
    @Get('periods')
    async getPeriods() {
        return this.accountingService.getAllPeriods();
    }

    @Post('periods')
    async createPeriod(@Body() body: any) {
        return this.accountingService.createPeriod(body);
    }

    @Put('periods/:id')
    async updatePeriod(@Param('id') id: string, @Body() body: any) {
        return this.accountingService.updatePeriod(id, body);
    }

    // --- PRESUPUESTOS ---
    @Get('budgets')
    async getBudgets() {
        return this.accountingService.getAllBudgets();
    }

    @Post('budgets')
    async createBudget(@Body() body: any) {
        return this.accountingService.createBudget(body);
    }

    @Put('budgets/:id')
    async updateBudget(@Param('id') id: string, @Body() body: any) {
        return this.accountingService.updateBudget(id, body);
    }

    @Delete('budgets/:id')
    async deleteBudget(@Param('id') id: string) {
        return this.accountingService.deleteBudget(id);
    }

    // --- TREASURY ---
    @Get('treasury/cash-boxes')
    async getCashBoxes() {
        return this.accountingService.getCashBoxes();
    }

    @Post('treasury/cash-boxes')
    async createCashBox(@Body() body: any) {
        return this.accountingService.createCashBox(body);
    }

    @Get('treasury/bank-accounts')
    async getBankAccounts() {
        return this.accountingService.getBankAccounts();
    }

    @Post('treasury/bank-accounts')
    async createBankAccount(@Body() body: any) {
        return this.accountingService.createBankAccount(body);
    }

    @Post('treasury/bank-reconciliation/import')
    @ApiOperation({ summary: 'Import bank statement for reconciliation' })
    async importBankStatement(@Body() body: { bankAccountId: string; transactions: { date: string; description: string; debit: number; credit: number; reference: string }[] }) {
        return this.accountingService.importBankStatement(body);
    }

    @Post('treasury/bank-reconciliation/:id/reconcile')
    @ApiOperation({ summary: 'Reconcile selected journal entries' })
    async reconcileBank(@Param('id') id: string, @Body() body: { journalEntryIds: string[] }) {
        return this.accountingService.reconcileBank(id, body.journalEntryIds);
    }

    @Get('treasury/bank-reconciliation/report')
    @ApiOperation({ summary: 'Get bank reconciliation report' })
    async getReconciliationReport(@Query('bankAccountId') bankAccountId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.accountingService.getReconciliationReport(bankAccountId, startDate, endDate);
    }

    @Get('reports/tax')
    @ApiOperation({ summary: 'Get tax report (IVA and withholdings)' })
    async getTaxReport(@Query('year') year: number, @Query('month') month: number) {
        return this.accountingService.getTaxReport(year || new Date().getFullYear(), month || new Date().getMonth() + 1);
    }

    @Get('reports/budget-vs-execution')
    async getBudgetVsExecution(@Query('year') year: number) {
        return this.accountingService.getBudgetVsExecution(year || new Date().getFullYear());
    }

    // --- CxP (Cuentas por Pagar) ---
    @Get('accounts-payable')
    async getAccountsPayable() {
        return this.accountingService.getAccountsPayable();
    }

    @Post('accounts-payable')
    async createAccountPayable(@Body() body: any) {
        return this.accountingService.createAccountPayable(body);
    }

    // --- CxC (Cuentas por Cobrar) ---
    @Get('accounts-receivable')
    async getAccountsReceivable() {
        return this.accountingService.getAccountsReceivable();
    }

    @Post('accounts-receivable')
    async createAccountReceivable(@Body() body: any) {
        return this.accountingService.createAccountReceivable(body);
    }

    // --- RECURRING ENTRIES ---
    @Get('recurring-entries')
    async getRecurringEntries(@Query('status') status?: string) {
        return this.accountingService.getRecurringEntries(status as any);
    }

    @Post('recurring-entries')
    async createRecurringEntry(@Body() body: any) {
        return this.accountingService.createRecurringEntry(body);
    }

    @Put('recurring-entries/:id')
    async updateRecurringEntry(@Param('id') id: string, @Body() body: any) {
        return this.accountingService.updateRecurringEntry(id, body);
    }

    @Post('recurring-entries/process')
    @ApiOperation({ summary: 'Process due recurring entries' })
    async processRecurringEntries() {
        return this.accountingService.processRecurringEntries();
    }

    // --- APPROVAL WORKFLOWS ---
    @Get('workflows')
    async getWorkflows() {
        return this.accountingService.getWorkflows();
    }

    @Post('workflows')
    async createWorkflow(@Body() body: any) {
        return this.accountingService.createWorkflow(body);
    }

    @Get('approval-requests')
    async getApprovalRequests(@Query('status') status?: string) {
        return this.accountingService.getApprovalRequests(status as any);
    }

    @Post('approval-requests')
    async createApprovalRequest(@Body() body: any) {
        return this.accountingService.createApprovalRequest(body);
    }

    @Post('approval-requests/:id/approve')
    @ApiOperation({ summary: 'Approve a request' })
    async approveRequest(@Param('id') id: string, @Body() body: { approverId: string; notes?: string }) {
        return this.accountingService.approveRequest(id, body.approverId, body.notes);
    }

    @Post('approval-requests/:id/reject')
    @ApiOperation({ summary: 'Reject a request' })
    async rejectRequest(@Param('id') id: string, @Body() body: { approverId: string; reason: string }) {
        return this.accountingService.rejectRequest(id, body.approverId, body.reason);
    }

    // --- AUDIT TRAIL ---
    @Get('audit-trail')
    @ApiOperation({ summary: 'Get audit trail' })
    async getAuditTrail(
        @Query('entityType') entityType?: string,
        @Query('entityId') entityId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.accountingService.getAuditTrail(
            entityType as any,
            entityId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );
    }

    // --- PROJECTS ---
    @Get('projects')
    async getProjects(@Query('status') status?: string) {
        return this.accountingService.getProjects(status as any);
    }

    @Post('projects')
    async createProject(@Body() body: any) {
        return this.accountingService.createProject(body);
    }

    @Get('projects/:id')
    async getProjectById(@Param('id') id: string) {
        return this.accountingService.getProjectById(id);
    }

    @Put('projects/:id')
    async updateProject(@Param('id') id: string, @Body() body: any) {
        return this.accountingService.updateProject(id, body);
    }

    @Get('projects/:id/financial-summary')
    @ApiOperation({ summary: 'Get project financial summary' })
    async getProjectFinancialSummary(@Param('id') id: string) {
        return this.accountingService.getProjectFinancialSummary(id);
    }

    // --- ADVANCED REPORTS ---
    @Get('reports/niif-balance-sheet')
    @ApiOperation({ summary: 'Get NIIF balance sheet' })
    async getNIIFBalanceSheet(@Query('date') date: string) {
        return this.accountingService.getNIIFBalanceSheet(date ? new Date(date) : new Date());
    }

    @Get('reports/niif-income-statement')
    @ApiOperation({ summary: 'Get NIIF income statement' })
    async getNIIFIncomeStatement(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.accountingService.getNIIFIncomeStatement(
            new Date(startDate),
            new Date(endDate)
        );
    }

    @Get('reports/consolidated')
    @ApiOperation({ summary: 'Get consolidated balance sheet' })
    async getConsolidatedBalanceSheet() {
        return this.accountingService.getConsolidatedBalanceSheet();
    }
}
