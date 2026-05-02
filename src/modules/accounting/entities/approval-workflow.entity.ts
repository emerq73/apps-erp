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
import { User } from '../../auth/entities/user.entity';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum WorkflowType {
  VOUCHER = 'VOUCHER',
  JOURNAL_ENTRY = 'JOURNAL_ENTRY',
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  SALES_ORDER = 'SALES_ORDER',
  EXPENSE_REPORT = 'EXPENSE_REPORT',
}

@Entity('approval_workflows')
export class ApprovalWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: WorkflowType })
  workflowType: WorkflowType;

  @Column({ default: false })
  requiresApproval: boolean;

  @Column({ type: 'int', default: 1 })
  approvalLevels: number; // Número de niveles de aprobación

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  minAmount: number; // Monto mínimo para requerir aprobación

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  maxAmount: number; // Monto máximo hasta el cual aplica este workflow

  @Column({ type: 'simple-array', nullable: true })
  approverUserIds: string[]; // Usuarios approvees específicos (opcional)

  @Column({ type: 'simple-array', nullable: true })
  approverRoleIds: string[]; // Roles que pueden aprobar

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Company)
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('approval_requests')
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @ManyToOne(() => ApprovalWorkflow)
  workflow: ApprovalWorkflow;

  @Column({ type: 'enum', enum: WorkflowType })
  documentType: WorkflowType;

  @Column()
  documentId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'int', default: 1 })
  currentLevel: number; // Nivel actual de aprobación

  @Column({ type: 'int', default: 1 })
  totalLevels: number; // Total de niveles requeridos

  @ManyToOne(() => User)
  requester: User;

  @Column({ nullable: true })
  requesterId: string;

  @Column({ nullable: true })
  requesterNotes: string;

  @ManyToOne(() => User)
  approver: User;

  @Column({ nullable: true })
  approverId: string;

  @Column({ nullable: true })
  approverNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('approval_history')
export class ApprovalHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requestId: string;

  @ManyToOne(() => ApprovalRequest)
  request: ApprovalRequest;

  @Column({ type: 'enum', enum: ApprovalStatus })
  previousStatus: ApprovalStatus;

  @Column({ type: 'enum', enum: ApprovalStatus })
  newStatus: ApprovalStatus;

  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  comments: string;

  @CreateDateColumn()
  createdAt: Date;
}
