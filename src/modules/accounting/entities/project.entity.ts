import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { ThirdParty } from './third-party.entity';

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ProjectType {
  CONSTRUCTION = 'CONSTRUCTION',
  MAINTENANCE = 'MAINTENANCE',
  RENOVATION = 'RENOVATION',
  IT_PROJECT = 'IT_PROJECT',
  MARKETING = 'MARKETING',
  EVENT = 'EVENT',
  OTHER = 'OTHER',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Company)
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @ManyToOne(() => ThirdParty)
  client: ThirdParty;

  @Column({ nullable: true })
  clientId: string;

  @Column({ type: 'enum', enum: ProjectType })
  projectType: ProjectType;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'date', nullable: true })
  plannedEndDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  budgetedCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  actualCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  budgetedRevenue: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  actualRevenue: number;

  @Column({ default: false })
  trackRevenue: boolean;

  @Column({ default: false })
  trackCost: boolean;

  @Column({ nullable: true })
  managerId: string;

  @Column({ type: 'simple-array', nullable: true })
  memberIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('project_transactions')
export class ProjectTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project)
  project: Project;

  @Column()
  transactionId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cost: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('project_budget_lines')
export class ProjectBudgetLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project)
  project: Project;

  @Column()
  category: string; // ej: Materiales, Mano de Obra, Equipos

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  budgetedAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  actualAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  committedAmount: number;

  @CreateDateColumn()
  createdAt: Date;
}
