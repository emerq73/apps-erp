import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Reservation } from './reservation.entity';
import { Guest } from './guest.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum InvoiceStatus {
    DRAFT = 'DRAFT',
    ISSUED = 'ISSUED',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
    PARTIAL = 'PARTIAL',
}

export enum InvoiceType {
    ACCOMMODATION = 'ACCOMMODATION',
    SERVICE = 'SERVICE',
   MIXED = 'MIXED',
}

@Entity('invoices')
export class Invoice extends BaseAuditEntity {
    @Column({ unique: true })
    invoiceNumber: string;

    @ManyToOne(() => Reservation)
    reservation: Reservation;

    @Column({ nullable: true })
    reservationId: string;

    @ManyToOne(() => Guest)
    guest: Guest;

    @Column({ nullable: true })
    guestId: string;

    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;

    @Column({ type: 'date' })
    issueDate: Date;

    @Column({ type: 'date', nullable: true })
    dueDate: Date;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    tax: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    discount: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    total: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    paidAmount: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    pendingAmount: number;

    @Column({
        type: 'enum',
        enum: InvoiceStatus,
        default: InvoiceStatus.DRAFT
    })
    status: InvoiceStatus;

    @Column({
        type: 'enum',
        enum: InvoiceType,
        default: InvoiceType.ACCOMMODATION
    })
    type: InvoiceType;

    @Column({ nullable: true })
    notes: string;

    @Column({ nullable: true })
    paymentMethod: string;
}