import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Company } from '../../accounting/entities/company.entity';

export enum AlertType {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  INTERNAL_NOTE = 'INTERNAL_NOTE',
  SPECIAL_REQUEST = 'SPECIAL_REQUEST',
  ID_EXPIRED = 'ID_EXPIRED',
  NO_SHOW_RISK = 'NO_SHOW_RISK',
  MAINTENANCE = 'MAINTENANCE',
}

export enum AlertSeverity {
  RED = 'RED',
  YELLOW = 'YELLOW',
  INFO = 'INFO',
}

@Entity('reservation_alerts')
export class ReservationAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reservationId: string;

  @Column({ type: 'enum', enum: AlertType })
  alertType: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity: AlertSeverity;

  @Column()
  message: string;

  @Column({ default: false })
  isResolved: boolean;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolutionNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('payment_splits')
export class PaymentSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoiceId: string;

  @Column()
  reservationId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['CASH', 'CARD', 'TRANSFER', 'CREDIT_ON_FILE'],
  })
  paymentMethod: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  authorizationCode: string;

  @Column({ nullable: true })
  cardLast4: string;

  @Column({ default: false })
  isPreAuthorization: boolean;

  @Column({ default: false })
  isCaptured: boolean;

  @Column({ type: 'timestamp', nullable: true })
  capturedAt: Date;

  @Column({ default: false })
  isReversed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reversedAt: Date;

  @Column({ nullable: true })
  reversalReason: string;

  @ManyToOne(() => Company)
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('deposit_transfers')
export class DepositTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fromReservationId: string;

  @Column()
  toReservationId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  approvedBy: string;

  @ManyToOne(() => Company)
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('shared_inventory_links')
export class SharedInventoryLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  primaryRoomTypeId: string;

  @Column()
  secondaryRoomTypeId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  autoBlock: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
