import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  POST = 'POST',
  UNPOST = 'UNPOST',
  CANCEL = 'CANCEL',
  RECONCILE = 'RECONCILE',
}

export enum AuditEntityType {
  VOUCHER = 'VOUCHER',
  JOURNAL_ENTRY = 'JOURNAL_ENTRY',
  ACCOUNT = 'ACCOUNT',
  THIRD_PARTY = 'THIRD_PARTY',
  COST_CENTER = 'COST_CENTER',
  COMPANY = 'COMPANY',
  TAX = 'TAX',
  PERIOD = 'PERIOD',
  BUDGET = 'BUDGET',
  ASSET = 'ASSET',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  CASH_BOX = 'CASH_BOX',
  INVENTORY = 'INVENTORY',
}

@Entity('audit_trail')
export class AuditTrail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuditEntityType })
  entityType: AuditEntityType;

  @Column()
  entityId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  previousValue: any;

  @Column({ type: 'jsonb', nullable: true })
  newValue: any;

  @Column({ type: 'simple-array', nullable: true })
  changedFields: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  sessionId: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('audit_session')
export class AuditSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sessionId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp' })
  loginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  logoutAt: Date;

  @Column({ type: 'int', default: 0 })
  actionsCount: number;

  @Column({ default: true })
  isActive: boolean;
}
