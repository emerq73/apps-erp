import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { ThirdParty } from './third-party.entity';
import { CostCenter } from './cost-center.entity';

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum RecurrenceStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

@Entity('recurring_entries')
export class RecurringEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Account)
  debitAccount: Account;

  @Column({ nullable: true })
  debitAccountId: string;

  @ManyToOne(() => Account)
  creditAccount: Account;

  @Column({ nullable: true })
  creditAccountId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: RecurrenceFrequency,
    default: RecurrenceFrequency.MONTHLY,
  })
  frequency: RecurrenceFrequency;

  @Column({ type: 'int', nullable: true })
  dayOfMonth: number; // Día del mes para ejecutar (1-31)

  @Column({ type: 'int', nullable: true })
  dayOfWeek: number; // 0=Domingo, 1=Lunes, etc.

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'int', default: 0 })
  executionCount: number; // Veces ejecutada

  @Column({ type: 'int', nullable: true })
  maxExecutions: number; // Límite de ejecuciones (opcional)

  @Column({ type: 'timestamp', nullable: true })
  lastExecutionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextExecutionDate: Date;

  @Column({
    type: 'enum',
    enum: RecurrenceStatus,
    default: RecurrenceStatus.ACTIVE,
  })
  status: RecurrenceStatus;

  @Column({ default: false })
  autoApprove: boolean;

  @ManyToOne(() => ThirdParty, { nullable: true })
  thirdParty: ThirdParty;

  @Column({ nullable: true })
  thirdPartyId: string;

  @ManyToOne(() => CostCenter, { nullable: true })
  costCenter: CostCenter;

  @Column({ nullable: true })
  costCenterId: string;

  @Column({ nullable: true })
  reference: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('recurring_entry_log')
export class RecurringEntryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recurringEntryId: string;

  @Column()
  journalEntryId: string;

  @Column({ type: 'timestamp' })
  executionDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;
}
