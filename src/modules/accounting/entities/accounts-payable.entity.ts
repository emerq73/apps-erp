import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from './company.entity';
import { ThirdParty } from './third-party.entity';

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('accounts_payable')
export class AccountsPayable extends BaseAuditEntity {
  @Column()
  invoiceNumber: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  balance: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => ThirdParty)
  @JoinColumn({ name: 'vendorId' })
  vendor: ThirdParty;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;
}
