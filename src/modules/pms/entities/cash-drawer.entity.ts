import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum DrawerStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  AUDITED = 'AUDITED',
}

export enum AuditType {
  SHIFT = 'SHIFT',
  HOURLY = 'HOURLY',
  END_OF_DAY = 'END_OF_DAY',
}

@Entity('cash_drawers')
export class CashDrawer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  drawerNumber: string;

  @ManyToOne(() => User)
  openedBy: User;

  @Column({ nullable: true })
  openedById: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  openingAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  expectedAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  actualAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  difference: number;

  @Column({ type: 'enum', enum: DrawerStatus, default: DrawerStatus.OPEN })
  status: DrawerStatus;

  @Column({ type: 'enum', enum: AuditType })
  auditType: AuditType;

  @Column({ type: 'timestamp' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @ManyToOne(() => User)
  closedBy: User;

  @Column({ nullable: true })
  closedById: string;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Company)
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('cash_drawer_transactions')
export class CashDrawerTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  drawerId: string;

  @Column({ type: 'enum', enum: ['IN', 'OUT', 'ADJUSTMENT'] })
  type: 'IN' | 'OUT' | 'ADJUSTMENT';

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['CASH', 'CARD', 'TRANSFER', 'ADJUSTMENT'] })
  paymentMethod: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  reservationId: string;

  @Column({ nullable: true })
  invoiceId: string;

  @ManyToOne(() => User)
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
