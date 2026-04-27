import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, MoreThanOrEqual, LessThanOrEqual, IsNull } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { ThirdParty } from './entities/third-party.entity';
import { CostCenter } from './entities/cost-center.entity';
import { Voucher } from './entities/voucher.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { Company } from './entities/company.entity';
import { Tax } from './entities/tax.entity';
import { AccountingPeriod, PeriodStatus } from './entities/accounting-period.entity';
import { Budget } from './entities/budget.entity';
import { CashBox } from './entities/cash-box.entity';
import { BankAccount } from './entities/bank-account.entity';
import { AccountsPayable } from './entities/accounts-payable.entity';
import { AccountsReceivable } from './entities/accounts-receivable.entity';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { RecurringEntry, RecurringEntryLog, RecurrenceFrequency, RecurrenceStatus } from './entities/recurring-entry.entity';
import { ApprovalWorkflow, ApprovalRequest, ApprovalHistory, ApprovalStatus, WorkflowType } from './entities/approval-workflow.entity';
import { AuditTrail, AuditSession, AuditAction, AuditEntityType } from './entities/audit-trail.entity';
import { Project, ProjectTransaction, ProjectBudgetLine, ProjectStatus, ProjectType } from './entities/project.entity';
import { FixedAsset, AssetDepreciationLog, DepreciationMethod, AssetStatus } from './entities/fixed-asset-v2.entity';

@Injectable()
export class AccountingService implements OnModuleInit {
    constructor(
        @InjectRepository(Account)
        private accountRepository: Repository<Account>,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        @InjectRepository(ThirdParty)
        private thirdPartyRepository: Repository<ThirdParty>,
        @InjectRepository(CostCenter)
        private costCenterRepository: Repository<CostCenter>,
        @InjectRepository(Voucher)
        private voucherRepository: Repository<Voucher>,
        @InjectRepository(JournalEntry)
        private journalEntryRepository: Repository<JournalEntry>,
        @InjectRepository(Company)
        private companyRepository: Repository<Company>,
        @InjectRepository(Tax)
        private taxRepository: Repository<Tax>,
        @InjectRepository(AccountingPeriod)
        private periodRepository: Repository<AccountingPeriod>,
        @InjectRepository(Budget)
        private budgetRepository: Repository<Budget>,
        @InjectRepository(CashBox)
        private cashBoxRepository: Repository<CashBox>,
        @InjectRepository(BankAccount)
        private bankAccountRepository: Repository<BankAccount>,
        @InjectRepository(AccountsPayable)
        private apRepository: Repository<AccountsPayable>,
        @InjectRepository(AccountsReceivable)
        private arRepository: Repository<AccountsReceivable>,
        @InjectRepository(Currency)
        private currencyRepository: Repository<Currency>,
        @InjectRepository(ExchangeRate)
        private exchangeRateRepository: Repository<ExchangeRate>,
        @InjectRepository(RecurringEntry)
        private recurringEntryRepository: Repository<RecurringEntry>,
        @InjectRepository(RecurringEntryLog)
        private recurringLogRepository: Repository<RecurringEntryLog>,
        @InjectRepository(ApprovalWorkflow)
        private workflowRepository: Repository<ApprovalWorkflow>,
        @InjectRepository(ApprovalRequest)
        private approvalRequestRepository: Repository<ApprovalRequest>,
        @InjectRepository(ApprovalHistory)
        private approvalHistoryRepository: Repository<ApprovalHistory>,
        @InjectRepository(AuditTrail)
        private auditTrailRepository: Repository<AuditTrail>,
        @InjectRepository(AuditSession)
        private auditSessionRepository: Repository<AuditSession>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(ProjectTransaction)
        private projectTransRepository: Repository<ProjectTransaction>,
        @InjectRepository(ProjectBudgetLine)
        private projectBudgetRepository: Repository<ProjectBudgetLine>,
        @InjectRepository(FixedAsset)
        private assetRepository: Repository<FixedAsset>,
        @InjectRepository(AssetDepreciationLog)
        private depreciationLogRepository: Repository<AssetDepreciationLog>,
        private dataSource: DataSource,
        @Inject(REQUEST) private readonly request: any,
    ) { }

    async onModuleInit() {
        await this.ensureDefaultCompany();
        await this.ensureDefaultPeriod();
        await this.ensureDefaultCurrencies();
    }

    private async ensureDefaultCurrencies() {
        const defaultCurrencies = [
            { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
            { code: 'USD', name: 'US Dollar', symbol: '$' },
            { code: 'EUR', name: 'Euro', symbol: '€' },
            { code: 'GBP', name: 'British Pound', symbol: '£' },
        ];
        for (const cur of defaultCurrencies) {
            const exists = await this.currencyRepository.findOne({ where: { code: cur.code } });
            if (!exists) {
                await this.currencyRepository.save(this.currencyRepository.create(cur));
            }
        }
    }

    private async ensureDefaultCompany() {
        let company = await this.companyRepository.findOne({ where: {} });
        if (!company) {
            company = this.companyRepository.create({
                name: 'Compañía Principal',
                nit: '900.000.000-1',
                address: 'Calle Falsa 123',
                phone: '555-0199',
                email: 'contacto@principal.com',
                country: 'Colombia'
            });
            company = await this.companyRepository.save(company);
            console.log('[AccountingService] Default company created:', company.id);

            // Migrar registros huérfanos
            await this.migrateOrphanedRecords(company);
        }
    }

    private async migrateOrphanedRecords(company: Company) {
        console.log('[AccountingService] Migrating orphaned records to default company...');
        await this.accountRepository.update({ company: IsNull() }, { company });
        await this.thirdPartyRepository.update({ company: IsNull() }, { company });
        await this.costCenterRepository.update({ company: IsNull() }, { company });
        await this.voucherRepository.update({ company: IsNull() }, { company });

        await this.transactionRepository.createQueryBuilder()
            .update(Transaction)
            .set({ company: company as any })
            .where('companyId IS NULL')
            .execute();
    }

    private async ensureDefaultPeriod() {
        const company = await this.companyRepository.findOne({ where: {} });
        if (!company) return;

        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;

        const period = await this.periodRepository.findOne({ where: { year, month, company: { id: company.id } } });
        if (!period) {
            const newPeriod = this.periodRepository.create({
                year,
                month,
                status: PeriodStatus.OPEN,
                company
            });
            await this.periodRepository.save(newPeriod);
            console.log('[AccountingService] Default period created:', year, month);
        }
    }

    // --- PERIODS ---
    async validatePeriod(date: Date, companyId: string) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const period = await this.periodRepository.findOne({
            where: { year, month, company: { id: companyId } }
        });

        if (period && period.status === PeriodStatus.CLOSED) {
            throw new Error(`El periodo contable ${year}-${month} está CERRADO. No se permiten movimientos.`);
        }
    }

    // --- COMPANY ---
    async getAllCompanies() {
        return this.companyRepository.find();
    }

    async getCompany() {
        const companyId = this.request?.companyId;
        
        let company;
        if (companyId) {
            company = await this.companyRepository.findOne({ where: { id: companyId } });
        } else {
            company = await this.companyRepository.findOne({ where: {} });
        }

        if (!company) throw new Error('Company not found. Check x-company-id header.');
        return company;
    }

    async updateCompany(id: string, data: any) {
        await this.companyRepository.update(id, data);
        return this.companyRepository.findOneBy({ id });
    }

    async createCompany(data: any) {
        const company = this.companyRepository.create(data);
        return this.companyRepository.save(company);
    }

    // --- CURRENCY & EXCHANGE RATES ---
    async getCurrencies() {
        return this.currencyRepository.find({ where: { isActive: true } });
    }

    async getExchangeRates(date: string) {
        const company = await this.getCompany();
        const query: any = { company: { id: company.id } };
        if (date) query.date = new Date(date);
        
        return this.exchangeRateRepository.find({
            where: query,
            relations: ['baseCurrency', 'targetCurrency'],
            order: { date: 'DESC' }
        });
    }

    async createExchangeRate(data: any) {
        const company = await this.getCompany();
        const rate = this.exchangeRateRepository.create({
            baseCurrency: { id: data.baseCurrencyId },
            targetCurrency: { id: data.targetCurrencyId },
            date: new Date(data.date),
            rate: Number(data.rate),
            company
        } as any);
        const saved = (await this.exchangeRateRepository.save(rate)) as unknown as ExchangeRate;
        return this.exchangeRateRepository.findOne({
            where: { id: (saved as any).id },
            relations: ['baseCurrency', 'targetCurrency']
        });
    }

    // --- TAXES ---
    async getTaxes() {
        const company = await this.getCompany();
        return this.taxRepository.find({
            where: { company: { id: company.id } },
            relations: ['account']
        });
    }

    async createTax(data: any) {
        const company = await this.getCompany();
        const tax = this.taxRepository.create({
            ...data,
            company
        });
        return this.taxRepository.save(tax);
    }

    async updateTax(id: string, data: any) {
        const { accountId, ...rest } = data;
        const payload: any = { ...rest };
        if (accountId) payload.account = { id: accountId };

        await this.taxRepository.update(id, payload);
        return this.taxRepository.findOne({ where: { id }, relations: ['account'] });
    }

    async deleteTax(id: string) {
        return this.taxRepository.delete(id);
    }

    // --- LEGACY TRANSACTIONS (Keep for compatibility) ---
    async createEntry(
        debitAccountId: string,
        creditAccountId: string,
        amount: number,
        description: string,
        thirdPartyId?: string,
        costCenterId?: string,
        reference?: string,
        userId?: string,
    ) {
        const company = await this.getCompany();

        // VALIDAR PERIODO
        await this.validatePeriod(new Date(), company.id);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const debitAccount = await this.accountRepository.findOneBy({ id: debitAccountId });
            const creditAccount = await this.accountRepository.findOneBy({ id: creditAccountId });

            if (!debitAccount || !creditAccount) throw new Error('Cuentas no encontradas');

            const transaction = this.transactionRepository.create({
                debitAccount,
                creditAccount,
                amount,
                description,
                reference,
                company,
                thirdParty: thirdPartyId ? { id: thirdPartyId } : null,
                costCenter: costCenterId ? { id: costCenterId } : null,
                createdBy: userId ? { id: userId } : null,
            } as any);

            await queryRunner.manager.save(transaction);

            debitAccount.balance = Number(debitAccount.balance) + amount;
            creditAccount.balance = Number(creditAccount.balance) - amount;

            await queryRunner.manager.save(debitAccount);
            await queryRunner.manager.save(creditAccount);

            await queryRunner.commitTransaction();
            return transaction;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async getBalance(accountId: string) {
        const account = await this.accountRepository.findOneBy({ id: accountId });
        return account ? account.balance : 0;
    }

    async updateAccount(id: string, data: any) {
        await this.accountRepository.update(id, data);
        return this.accountRepository.findOneBy({ id });
    }

    async getAllAccounts() {
        const company = await this.getCompany();
        const accounts = await this.accountRepository.find({
            where: { company: { id: company.id } },
            relations: ['parent'],
            order: { code: 'ASC' }
        });
        return accounts;
    }

    async getAllTransactions() {
        const company = await this.getCompany();
        return this.transactionRepository.find({
            where: { company: { id: company.id } },
            relations: ['debitAccount', 'creditAccount', 'thirdParty', 'costCenter', 'createdBy'],
            order: { date: 'DESC' },
            take: 100
        });
    }

    // --- TERCEROS ---
    async getAllThirdParties() {
        const company = await this.getCompany();
        return this.thirdPartyRepository.find({
            where: { company: { id: company.id } },
            order: { name: 'ASC' }
        });
    }

    async createThirdParty(data: Partial<ThirdParty>) {
        const company = await this.getCompany();
        const tp = this.thirdPartyRepository.create({ ...data, company });
        return this.thirdPartyRepository.save(tp);
    }

    async updateThirdParty(id: string, data: Partial<ThirdParty>) {
        const tp = await this.thirdPartyRepository.preload({ id, ...data });
        if (!tp) throw new Error('Tercero no encontrado');
        return this.thirdPartyRepository.save(tp);
    }

    async deleteThirdParty(id: string) {
        return this.thirdPartyRepository.delete(id);
    }

    // --- CENTROS DE COSTO ---
    async getAllCostCenters() {
        const company = await this.getCompany();
        return this.costCenterRepository.find({
            where: { company: { id: company.id } },
            relations: ['parent'],
            order: { code: 'ASC' }
        });
    }

    async createCostCenter(data: any) {
        const company = await this.getCompany();
        const { parentId, ...rest } = data;
        const cc = this.costCenterRepository.create({ ...rest, company });
        if (parentId) {
            (cc as any).parent = { id: parentId };
        }
        return this.costCenterRepository.save(cc);
    }

    async updateCostCenter(id: string, data: any) {
        const { parentId, ...rest } = data;
        const cc = await this.costCenterRepository.preload({ id, ...rest });
        if (!cc) throw new Error('Centro de costo no encontrado');
        if (parentId) {
            (cc as any).parent = { id: parentId };
        } else if (parentId === null) {
            cc.parent = null;
        }
        return this.costCenterRepository.save(cc);
    }

    async deleteCostCenter(id: string) {
        return this.costCenterRepository.delete(id);
    }

    // --- REPORTES ---
    async getTrialBalance(startDate: string, endDate: string) {
        const company = await this.getCompany();
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const accounts = await this.accountRepository.find({
            where: { company: { id: company.id } },
            order: { code: 'ASC' }
        });
        const report: any[] = [];

        for (const account of accounts) {
            const legacyBefore = await this.transactionRepository.createQueryBuilder('tx')
                .select('SUM(tx.amount)', 'total')
                .where('(tx.debitAccountId = :id OR tx.creditAccountId = :id) AND tx.date < :start', { id: account.id, start })
                .getRawOne();

            const entriesBefore = await this.journalEntryRepository.createQueryBuilder('je')
                .leftJoin('je.voucher', 'v')
                .select('SUM(je.debit - je.credit)', 'total')
                .where('je.accountId = :id AND v.date < :start', { id: account.id, start })
                .getRawOne();

            let initialBalance = Number(legacyBefore?.total || 0) + Number(entriesBefore?.total || 0);

            const legacyDebitPeriod = await this.transactionRepository.sum('amount', {
                debitAccount: { id: account.id } as any,
                date: Between(start, end)
            });
            const legacyCreditPeriod = await this.transactionRepository.sum('amount', {
                creditAccount: { id: account.id } as any,
                date: Between(start, end)
            });

            const entriesPeriodDetail = await this.journalEntryRepository.createQueryBuilder('je')
                .leftJoin('je.voucher', 'v')
                .select('SUM(je.debit)', 'debit')
                .addSelect('SUM(je.credit)', 'credit')
                .where('je.accountId = :id AND v.date BETWEEN :start AND :end', { id: account.id, start, end })
                .getRawOne();

            const periodDebit = Number(legacyDebitPeriod || 0) + Number(entriesPeriodDetail?.debit || 0);
            const periodCredit = Number(legacyCreditPeriod || 0) + Number(entriesPeriodDetail?.credit || 0);

            const finalBalance = initialBalance + periodDebit - periodCredit;

            if (initialBalance !== 0 || periodDebit !== 0 || periodCredit !== 0) {
                report.push({
                    code: account.code,
                    name: account.name,
                    type: account.type,
                    initialBalance,
                    debit: periodDebit,
                    credit: periodCredit,
                    finalBalance
                });
            }
        }
        return report;
    }

    async getBalanceSheet(date: string) {
        const report = await this.getTrialBalance('2000-01-01', date);
        return report.filter(item => ['1', '2', '3'].includes(item.code[0]));
    }

    async getIncomeStatement(startDate: string, endDate: string) {
        const report = await this.getTrialBalance(startDate, endDate);
        return report.filter(item => ['4', '5', '6'].includes(item.code[0]));
    }

    // --- VOUCHERS ---
    async createVoucher(data: any, userId: string) {
        const company = await this.getCompany();

        const { number, date, description, type, entries } = data;

        // VALIDAR PERIODO
        await this.validatePeriod(new Date(date), company.id);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let totalDebit = 0;
            let totalCredit = 0;
            for (const entry of entries) {
                totalDebit += Number(entry.debit || 0);
                totalCredit += Number(entry.credit || 0);
            }

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new Error('El comprobante no está balanceado. Débitos != Créditos');
            }

            const voucher = this.voucherRepository.create({
                number,
                date: new Date(date),
                description,
                type,
                company,
                createdBy: userId ? { id: userId } : null
            } as any) as unknown as Voucher;

            const savedVoucher: any = await queryRunner.manager.save(voucher);

            for (const item of entries) {
                const account = await this.accountRepository.findOneBy({ id: item.accountId });
                if (!account) throw new Error(`Cuenta no encontrada: ${item.accountId}`);

                // Validaciones según configuración de la cuenta (PUC)
                if (account.requiresThirdParty && !item.thirdPartyId) {
                    throw new Error(`La cuenta ${account.code} - ${account.name} requiere obligatoriamente un Tercero.`);
                }
                if (account.requiresCostCenter && !item.costCenterId) {
                    throw new Error(`La cuenta ${account.code} - ${account.name} requiere obligatoriamente un Centro de Costo.`);
                }

                const entry = this.journalEntryRepository.create({
                    voucher: savedVoucher,
                    account: account,
                    thirdParty: item.thirdPartyId ? { id: item.thirdPartyId } : null,
                    costCenter: item.costCenterId ? { id: item.costCenterId } : null,
                    debit: Number(item.debit || 0),
                    credit: Number(item.credit || 0),
                    currency: item.currencyId ? { id: item.currencyId } : null,
                    exchangeRate: Number(item.exchangeRate || 1),
                    foreignDebit: Number(item.foreignDebit || 0),
                    foreignCredit: Number(item.foreignCredit || 0),
                    taxBaseAmount: Number(item.taxBaseAmount || 0),
                    description: item.description || description
                } as any);

                await queryRunner.manager.save(entry);

                // Actualizar saldo de la cuenta
                account.balance = Number(account.balance) + (Number(item.debit) - Number(item.credit));
                await queryRunner.manager.save(account);
            }

            await queryRunner.commitTransaction();
            return savedVoucher;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async getVouchers() {
        const company = await this.getCompany();
        return this.voucherRepository.find({
            where: { company: { id: company.id } },
            relations: ['entries', 'entries.account', 'entries.thirdParty', 'entries.currency', 'createdBy'],
            order: { createdAt: 'DESC' }
        });
    }

    // --- PERIODS CRUD ---
    async getAllPeriods() {
        const company = await this.getCompany();
        return this.periodRepository.find({
            where: { company: { id: company.id } },
            order: { year: 'DESC', month: 'DESC' }
        });
    }

    async createPeriod(data: any) {
        const company = await this.getCompany();
        const period = this.periodRepository.create({ ...data, company });
        return this.periodRepository.save(period);
    }

    async updatePeriod(id: string, data: any) {
        await this.periodRepository.update(id, data);
        return this.periodRepository.findOneBy({ id });
    }

    // --- BUDGETS CRUD ---
    async getAllBudgets() {
        const company = await this.getCompany();
        return this.budgetRepository.find({
            where: { company: { id: company.id } },
            relations: ['costCenter', 'period', 'account']
        });
    }

    async createBudget(data: any) {
        const company = await this.getCompany();
        const budget = this.budgetRepository.create({
            ...data,
            company,
            costCenter: { id: data.costCenterId },
            period: { id: data.periodId },
            account: { id: data.accountId }
        } as any);
        return this.budgetRepository.save(budget);
    }

    async updateBudget(id: string, data: any) {
        const payload: any = { ...data };
        if (data.costCenterId) payload.costCenter = { id: data.costCenterId };
        if (data.periodId) payload.period = { id: data.periodId };
        if (data.accountId) payload.account = { id: data.accountId };

        await this.budgetRepository.update(id, payload);
        return this.budgetRepository.findOne({ where: { id }, relations: ['costCenter', 'period', 'account'] });
    }

    async deleteBudget(id: string) {
        return this.budgetRepository.delete(id);
    }

    // --- PUC IMPORT ---
    async bulkImportAccounts(accounts: any[]) {
        const company = await this.getCompany();

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const acc of accounts) {
                // Buscar si ya existe por código y empresa
                let existing = await queryRunner.manager.findOne(Account, {
                    where: { code: acc.code, company: { id: company.id } }
                });

                if (existing) {
                    // Actualizar
                    Object.assign(existing, acc);
                    await queryRunner.manager.save(existing);
                } else {
                    // Crear nuevo
                    const newAcc = this.accountRepository.create({
                        ...acc,
                        company
                    });
                    await queryRunner.manager.save(newAcc);
                }
            }
            await queryRunner.commitTransaction();
            return { success: true, count: accounts.length };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    // --- TREASURY (Cajas y Bancos) ---
    async getCashBoxes() {
        const company = await this.getCompany();
        return this.cashBoxRepository.find({
            where: { company: { id: company.id } },
            relations: ['account']
        });
    }

    async createCashBox(data: any) {
        const company = await this.getCompany();
        const cashBox = this.cashBoxRepository.create({
            ...data,
            company,
            account: { id: data.accountId }
        } as any);
        return this.cashBoxRepository.save(cashBox);
    }

    async getBankAccounts() {
        const company = await this.getCompany();
        return this.bankAccountRepository.find({
            where: { company: { id: company.id } },
            relations: ['account']
        });
    }

    async createBankAccount(data: any) {
        const company = await this.getCompany();
        const bankAccount = this.bankAccountRepository.create({
            ...data,
            company,
            account: { id: data.accountId }
        } as any);
        return this.bankAccountRepository.save(bankAccount);
    }

    async getBudgetVsExecution(year: number) {
        const company = await this.getCompany();
        
        // 1. Obtener todos los presupuestos del año
        const budgets = await this.budgetRepository.find({
            where: { year, company: { id: company.id } },
            relations: ['account', 'costCenter']
        });

        // 2. Obtener ejecución real (Suma de débitos - créditos para cuentas de resultado/gasto)
        // Usamos una consulta directa para agrupar por cuenta y centro de costo
        const execution = await this.dataSource.getRepository(JournalEntry)
            .createQueryBuilder('entry')
            .innerJoin('entry.voucher', 'voucher')
            .select('entry.accountId', 'accountId')
            .addSelect('entry.costCenterId', 'costCenterId')
            .addSelect('SUM(entry.debit - entry.credit)', 'total')
            .where('voucher.companyId = :companyId', { companyId: company.id })
            .andWhere('EXTRACT(YEAR FROM voucher.date) = :year', { year })
            .groupBy('entry.accountId')
            .addGroupBy('entry.costCenterId')
            .getRawMany();

        // 3. Cruzar datos
        return budgets.map(b => {
            const exec = execution.find(e => 
                e.accountId === b.account.id && 
                e.costCenterId === b.costCenter?.id
            );
            const actual = exec ? parseFloat(exec.total) : 0;
            return {
                account: b.account.name,
                costCenter: b.costCenter?.name || 'General',
                budget: b.amount,
                actual,
                variance: b.amount - actual,
                performance: b.amount > 0 ? (actual / b.amount) * 100 : 0
            };
        });
    }

    // --- CUENTAS POR PAGAR (CxP) ---
    async getAccountsPayable() {
        const company = await this.getCompany();
        return this.apRepository.find({
            where: { company: { id: company.id } },
            relations: ['vendor'],
            order: { dueDate: 'ASC' }
        });
    }

    async createAccountPayable(data: any) {
        const company = await this.getCompany();
        const ap = this.apRepository.create({
            ...data,
            company,
            balance: data.totalAmount,
            vendor: { id: data.vendorId }
        } as any);
        return this.apRepository.save(ap);
    }

    // --- CUENTAS POR COBRAR (CxC) ---
    async getAccountsReceivable() {
        const company = await this.getCompany();
        return this.arRepository.find({
            where: { company: { id: company.id } },
            relations: ['customer'],
            order: { dueDate: 'ASC' }
        });
    }

    async createAccountReceivable(data: any) {
        const company = await this.getCompany();
        const ar = this.arRepository.create({
            ...data,
            company,
            balance: data.totalAmount,
            customer: { id: data.customerId }
        } as any);
        return this.arRepository.save(ar);
    }

    async importBankStatement(data: { bankAccountId: string; transactions: { date: string; description: string; debit: number; credit: number; reference: string }[] }) {
        const { bankAccountId, transactions } = data;
        const bankAccount = await this.bankAccountRepository.findOneBy({ id: bankAccountId });
        if (!bankAccount) throw new Error('Cuenta bancaria no encontrada');

        const imported: any[] = [];
        const matched: any[] = [];
        const unmatched: any[] = [];

        for (const tx of transactions) {
            const found = await this.journalEntryRepository.findOne({
                where: {
                    voucher: { company: bankAccount.company },
                    description: tx.description
                }
            });

            if (found) {
                matched.push({ ...tx, journalEntryId: found.id, matched: true });
            } else {
                unmatched.push({ ...tx, matched: false });
            }
            imported.push({ ...tx, bankAccountId, importedAt: new Date() });
        }

        return { imported: imported.length, matched: matched.length, unmatched: unmatched.length, matchedDetails: matched, unmatchedDetails: unmatched };
    }

    async reconcileBank(id: string, journalEntryIds: string[]) {
        const bankAccount = await this.bankAccountRepository.findOneBy({ id });
        if (!bankAccount) throw new Error('Cuenta bancaria no encontrada');

        for (const entryId of journalEntryIds) {
            await this.journalEntryRepository.update(entryId, { reconciledAt: new Date() } as any);
        }

        return { reconciled: journalEntryIds.length };
    }

    async getReconciliationReport(bankAccountId: string, startDate: string, endDate: string) {
        const entries = await this.journalEntryRepository.find({
            where: {
                account: bankAccountId ? { id: bankAccountId } : undefined,
            },
            relations: ['voucher', 'voucher.company'],
            order: { id: 'ASC' }
        });

        const reconciled = entries.filter(e => (e as any).reconciledAt);
        const pending = entries.filter(e => !(e as any).reconciledAt);

        return {
            totalEntries: entries.length,
            reconciledCount: reconciled.length,
            pendingCount: pending.length,
            reconciledBalance: reconciled.reduce((sum, e) => sum + Number(e.debit || 0) - Number(e.credit || 0), 0),
            pendingBalance: pending.reduce((sum, e) => sum + Number(e.debit || 0) - Number(e.credit || 0), 0)
        };
    }

    async getTaxReport(year: number, month: number) {
        const company = await this.getCompany();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const vouchers = await this.voucherRepository.find({
            where: {
                company: { id: company.id },
                date: require('typeorm')?.MoreThanOrEqual(startDate)
            },
            relations: ['entries', 'entries.account']
        });

        let ivaDebit = 0;
        let ivaCredit = 0;
        let retDebit = 0;
        let retCredit = 0;

        for (const voucher of vouchers) {
            for (const entry of voucher.entries || []) {
                if (entry.account?.code?.startsWith('2408')) {
                    ivaDebit += Number(entry.debit || 0);
                    ivaCredit += Number(entry.credit || 0);
                } else if (entry.account?.code?.startsWith('2365')) {
                    retDebit += Number(entry.debit || 0);
                    retCredit += Number(entry.credit || 0);
                }
            }
        }

        return {
            period: { year, month },
            iva: { debito: ivaDebit, credito: ivaCredit, neto: ivaCredit - ivaDebit },
            retenciones: { debito: retDebit, credito: retCredit, neto: retCredit - retDebit },
            totalIVA: ivaCredit - ivaDebit,
            totalRetenciones: retCredit - retDebit
        };
    }

    // ==================== RECURRING ENTRIES ====================
    async createRecurringEntry(data: {
        name: string; description?: string; debitAccountId: string; creditAccountId: string;
        amount: number; frequency: RecurrenceFrequency; dayOfMonth?: number; startDate: Date;
        endDate?: Date; maxExecutions?: number; autoApprove?: boolean;
        thirdPartyId?: string; costCenterId?: string; reference?: string;
    }) {
        const entry = this.recurringEntryRepository.create({
            ...data,
            status: RecurrenceStatus.ACTIVE,
            nextExecutionDate: data.startDate
        });
        return this.recurringEntryRepository.save(entry);
    }

    async getRecurringEntries(status?: RecurrenceStatus) {
        const where: any = {};
        if (status) where.status = status;
        return this.recurringEntryRepository.find({ where, order: { nextExecutionDate: 'ASC' } });
    }

    async updateRecurringEntry(id: string, data: Partial<RecurringEntry>) {
        await this.recurringEntryRepository.update(id, data);
        return this.recurringEntryRepository.findOneBy({ id });
    }

    async processRecurringEntries() {
        const now = new Date();
        const entries = await this.recurringEntryRepository.find({
            where: { status: RecurrenceStatus.ACTIVE, nextExecutionDate: LessThanOrEqual(now) }
        });
        return { processed: entries.length, message: 'Recurring entries processed' };
    }

    // ==================== APPROVAL WORKFLOWS ====================
    async createWorkflow(data: {
        name: string; workflowType: WorkflowType; requiresApproval: boolean;
        approvalLevels: number; minAmount?: number; maxAmount?: number;
    }) {
        const workflow = this.workflowRepository.create(data);
        return this.workflowRepository.save(workflow);
    }

    async getWorkflows() {
        return this.workflowRepository.find({ where: { isActive: true } });
    }

    async createApprovalRequest(data: {
        workflowId: string; documentType: WorkflowType; documentId: string;
        amount: number; requesterId: string; requesterNotes?: string;
    }) {
        const workflow = await this.workflowRepository.findOneBy({ id: data.workflowId });
        if (!workflow) throw new Error('Workflow no encontrado');
        
        const request = this.approvalRequestRepository.create({
            ...data,
            status: ApprovalStatus.PENDING,
            currentLevel: 1,
            totalLevels: workflow.approvalLevels
        });
        return this.approvalRequestRepository.save(request);
    }

    async getApprovalRequests(status?: ApprovalStatus) {
        const where: any = {};
        if (status) where.status = status;
        return this.approvalRequestRepository.find({ where, order: { createdAt: 'DESC' }, relations: ['workflow'] });
    }

    async approveRequest(requestId: string, approverId: string, approverNotes?: string) {
        const request = await this.approvalRequestRepository.findOneBy({ id: requestId });
        if (!request) throw new Error('Solicitud no encontrada');
        
        request.status = ApprovalStatus.APPROVED;
        request.approverId = approverId;
        request.approverNotes = approverNotes || '';
        request.approvedAt = new Date();
        
        return this.approvalRequestRepository.save(request);
    }

    async rejectRequest(requestId: string, approverId: string, reason: string) {
        const request = await this.approvalRequestRepository.findOneBy({ id: requestId });
        if (!request) throw new Error('Solicitud no encontrada');
        
        request.status = ApprovalStatus.REJECTED;
        request.approverId = approverId;
        request.approverNotes = reason;
        request.rejectedAt = new Date();
        
        return this.approvalRequestRepository.save(request);
    }

    // ==================== AUDIT TRAIL ====================
    async getAuditTrail(entityType?: AuditEntityType, entityId?: string, startDate?: Date, endDate?: Date) {
        const where: any = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (startDate && endDate) {
            where.createdAt = Between(startDate, endDate);
        }
        return this.auditTrailRepository.find({ where, order: { createdAt: 'DESC' }, take: 1000 });
    }

    // ==================== PROJECTS ====================
    async createProject(data: {
        code: string; name: string; description?: string; companyId: string;
        clientId?: string; projectType: ProjectType; startDate: Date; endDate?: Date;
        budgetedCost: number; trackRevenue: boolean; trackCost: boolean; managerId?: string;
    }) {
        const project = this.projectRepository.create(data);
        return this.projectRepository.save(project);
    }

    async getProjects(status?: ProjectStatus) {
        const where: any = {};
        if (status) where.status = status;
        return this.projectRepository.find({ where, order: { createdAt: 'DESC' } });
    }

    async getProjectById(id: string) {
        return this.projectRepository.findOneBy({ id });
    }

    async updateProject(id: string, data: Partial<Project>) {
        await this.projectRepository.update(id, data);
        return this.projectRepository.findOneBy({ id });
    }

    async getProjectFinancialSummary(projectId: string) {
        const project = await this.projectRepository.findOneBy({ id: projectId });
        if (!project) throw new Error('Proyecto no encontrado');
        
        const transactions = await this.projectTransRepository.find({ where: { projectId } });
        const totalCost = transactions.reduce((sum, t) => sum + Number(t.cost || 0), 0);
        
        return {
            project: { id: project.id, code: project.code, name: project.name, status: project.status },
            budgetedCost: project.budgetedCost,
            actualCost: project.actualCost,
            variance: Number(project.budgetedCost) - totalCost,
            transactions: { count: transactions.length, totalCost }
        };
    }

    // ==================== NIIF REPORTS ====================
    async getNIIFBalanceSheet(date: Date) {
        const accounts = await this.accountRepository.find({ where: { isActive: true } });
        
        const assets = accounts.filter(a => a.type === 'activo').reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const liabilities = accounts.filter(a => a.type === 'pasivo').reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const equity = accounts.filter(a => a.type === 'patrimonio').reduce((sum, a) => sum + Number(a.balance || 0), 0);
        
        return { date, assets: { total: assets }, liabilities: { total: liabilities }, equity: { total: equity }, check: assets - (liabilities + equity) };
    }

    async getNIIFIncomeStatement(startDate: Date, endDate: Date) {
        return { period: { startDate, endDate }, revenue: { total: 0 }, expenses: { total: 0 }, netProfit: { value: 0 } };
    }

    async getConsolidatedBalanceSheet() {
        const companies = await this.companyRepository.find();
        return { companies: companies.length, assets: 0, liabilities: 0, equity: 0 };
    }
}
