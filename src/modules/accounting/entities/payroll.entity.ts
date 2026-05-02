import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Company } from './company.entity';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export enum ContractType {
  FIXED_TERM = 'FIXED_TERM', // Término fijo
  INDEFINITE_TERM = 'INDEFINITE_TERM', // Término indefinido
  LABOR_HOURS = 'LABOR_HOURS', // Por horas
  SERVICE = 'SERVICE', // Prestación de servicios
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  documentType: string;

  @Column()
  documentNumber: string;

  @Column({ type: 'date' })
  birthDate: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ nullable: true })
  emergencyPhone: string;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @Column({ type: 'date' })
  hireDate: string;

  @Column({ type: 'date', nullable: true })
  terminationDate: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  salary: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  transportAid: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  extraHoursRate: number;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column({ type: 'int', nullable: true })
  workedDays: number;

  @ManyToOne(() => Company)
  company: Company;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('payroll_runs')
export class PayrollRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runNumber: string;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  @Column({ type: 'int' })
  totalEmployees: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalSalary: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalBonuses: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalDeductions: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalPayroll: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalEmployerContribution: number;

  @Column()
  status: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => PayrollLedger, (ledger) => ledger.payrollRun)
  payrollLedgers: PayrollLedger[];

  @ManyToOne(() => Company)
  company: Company;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('payroll_ledger')
export class PayrollLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  @Column({ type: 'int' })
  workedDays: number;

  @Column({ type: 'int' })
  workedHours: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  baseSalary: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  transportAid: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  bonus: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  commission: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  overtime: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  extraHours: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  grossIncome: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  healthContribution: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  pensionContribution: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  pensionSolidarity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  retentionSource: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  otherDeductions: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalDeductions: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  netPay: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  employerHealth: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  employerPension: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  employerArl: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  employerIcbf: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  employerSena: number;

  @ManyToOne(() => Employee)
  employee: Employee;

  @ManyToOne(() => PayrollRun)
  payrollRun: PayrollRun;

  @ManyToOne(() => Company)
  company: Company;

  @CreateDateColumn()
  createdAt: Date;
}
