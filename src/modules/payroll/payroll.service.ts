import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Employee,
  PayrollRun,
  PayrollLedger,
  EmployeeStatus,
} from '../accounting/entities/payroll.entity';
import {
  RetentionRate,
  RetentionType,
} from '../accounting/entities/retention.entity';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(PayrollRun)
    private payrollRunRepo: Repository<PayrollRun>,
    @InjectRepository(PayrollLedger)
    private payrollLedgerRepo: Repository<PayrollLedger>,
    @InjectRepository(RetentionRate)
    private retentionRateRepo: Repository<RetentionRate>,
    private accountingService: AccountingService,
  ) {}

  // --- EMPLOYEES ---
  async getEmployees(companyId: string, status?: EmployeeStatus) {
    const where: any = { company: { id: companyId } };
    if (status) where.status = status;
    return this.employeeRepo.find({
      where,
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async createEmployee(companyId: string, data: Partial<Employee>) {
    const employee = this.employeeRepo.create({
      ...data,
      company: { id: companyId },
    });
    return this.employeeRepo.save(employee);
  }

  async updateEmployee(id: string, data: Partial<Employee>) {
    await this.employeeRepo.update(id, data);
    return this.employeeRepo.findOneBy({ id });
  }

  async terminateEmployee(id: string, terminationDate: string) {
    return this.employeeRepo.update(id, {
      status: EmployeeStatus.TERMINATED,
      terminationDate,
    });
  }

  // --- RETENTION RATES ---
  async getRetentionRates(companyId: string, type?: RetentionType) {
    const where: any = { company: { id: companyId }, isActive: true };
    if (type) where.type = type;
    return this.retentionRateRepo.find({ where });
  }

  async createRetentionRate(companyId: string, data: Partial<RetentionRate>) {
    const rate = this.retentionRateRepo.create({
      ...data,
      company: { id: companyId },
    });
    return this.retentionRateRepo.save(rate);
  }

  async updateRetentionRate(id: string, data: Partial<RetentionRate>) {
    await this.retentionRateRepo.update(id, data);
    return this.retentionRateRepo.findOneBy({ id });
  }

  async calculateRetention(
    amount: number,
    type: RetentionType,
    companyId: string,
  ): Promise<number> {
    const rates = await this.retentionRateRepo.find({
      where: { company: { id: companyId }, type, isActive: true },
    });
    if (!rates.length) return 0;

    const rate = rates.find((r) => {
      if (r.minValue && amount < Number(r.minValue)) return false;
      if (r.maxValue && amount > Number(r.maxValue)) return false;
      return true;
    });

    if (!rate) return 0;
    return amount * (Number(rate.rate) / 100);
  }

  // --- PAYROLL RUN ---
  async createPayrollRun(
    companyId: string,
    periodStart: string,
    periodEnd: string,
  ) {
    const employees = await this.employeeRepo.find({
      where: { company: { id: companyId }, status: EmployeeStatus.ACTIVE },
    });

    let totalSalary = 0;
    let totalBonuses = 0;
    let totalDeductions = 0;
    let totalEmployerContribution = 0;

    const payrollRun = this.payrollRunRepo.create({
      runNumber: `PR-${Date.now()}`,
      periodStart,
      periodEnd,
      totalEmployees: employees.length,
      totalSalary: 0,
      totalBonuses: 0,
      totalDeductions: 0,
      totalPayroll: 0,
      totalEmployerContribution: 0,
      status: 'DRAFT',
      company: { id: companyId },
    });
    const savedRun = await this.payrollRunRepo.save(payrollRun);

    for (const emp of employees) {
      const ledger = await this.calculatePayrollLedger(
        emp,
        savedRun,
        periodStart,
        periodEnd,
      );
      await this.payrollLedgerRepo.save(ledger);

      totalSalary += Number(ledger.baseSalary);
      totalBonuses += Number(ledger.bonus);
      totalDeductions += Number(ledger.totalDeductions);
      totalEmployerContribution +=
        Number(ledger.employerHealth) +
        Number(ledger.employerPension) +
        Number(ledger.employerArl);
    }

    await this.payrollRunRepo.update(savedRun.id, {
      totalSalary,
      totalBonuses,
      totalDeductions,
      totalPayroll: totalSalary + totalBonuses - totalDeductions,
      totalEmployerContribution,
      status: 'CALCULATED',
    });

    return this.payrollRunRepo.findOneBy({ id: savedRun.id });
  }

  async calculatePayrollLedger(
    employee: Employee,
    payrollRun: PayrollRun,
    periodStart: string,
    periodEnd: string,
  ) {
    const baseSalary = Number(employee.salary);
    const transportAid = Number(employee.transportAid) || 0;

    const daysInPeriod = 30;
    const workedDays = employee.workedDays || daysInPeriod;
    const salaryByDay = baseSalary / daysInPeriod;

    const workedDaysSalary = salaryByDay * workedDays;
    const transportByDay = transportAid / daysInPeriod;
    const transportAllowance = transportByDay * workedDays;

    const healthEmployee = baseSalary * 0.04;
    const pensionEmployee = baseSalary * 0.04;
    const pensionSolidarity = baseSalary > 4160000 ? baseSalary * 0.01 : 0;

    const healthEmployer = baseSalary * 0.085;
    const pensionEmployer = baseSalary * 0.12;
    const arlEmployer = baseSalary * 0.00522;
    const icbfEmployer = baseSalary * 0.03;
    const senaEmployer = baseSalary * 0.02;

    const grossIncome = workedDaysSalary + transportAllowance;
    const totalDeductions =
      healthEmployee + pensionEmployee + pensionSolidarity;
    const netPay = grossIncome - totalDeductions;

    return this.payrollLedgerRepo.create({
      employee,
      payrollRun,
      periodStart,
      periodEnd,
      workedDays,
      workedHours: workedDays * 8,
      baseSalary: workedDaysSalary,
      transportAid: transportAllowance,
      bonus: 0,
      commission: 0,
      overtime: 0,
      extraHours: 0,
      grossIncome,
      healthContribution: healthEmployee,
      pensionContribution: pensionEmployee,
      pensionSolidarity,
      retentionSource: 0,
      otherDeductions: 0,
      totalDeductions,
      netPay,
      employerHealth: healthEmployer,
      employerPension: pensionEmployer,
      employerArl: arlEmployer,
      employerIcbf: icbfEmployer,
      employerSena: senaEmployer,
      company: employee.company,
    });
  }

  async processPayrollRun(runId: string) {
    const run = await this.payrollRunRepo.findOne({
      where: { id: runId },
      relations: ['payrollLedgers', 'company'],
    });
    if (!run) throw new Error('Payroll run no encontrada');

    for (const ledger of run.payrollLedgers) {
      // Aquí se podría integrar con contabilidad si es necesario
      // Por ahora, solo registramos la nómina
    }

    await this.payrollRunRepo.update(runId, { status: 'PROCESSED' });
    return { success: true, payrollRun: runId };
  }

  async getPayrollRuns(companyId: string) {
    return this.payrollRunRepo.find({
      where: { company: { id: companyId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getPayrollLedgerByRun(runId: string) {
    return this.payrollLedgerRepo.find({
      where: { payrollRun: { id: runId } },
      relations: ['employee'],
    });
  }
}
