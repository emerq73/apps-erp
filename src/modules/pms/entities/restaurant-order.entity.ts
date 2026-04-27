import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { RestaurantTable } from './restaurant-table.entity';
import { Guest } from './guest.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum OrderStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    PAID = 'PAID',
}

export enum OrderType {
    DINE_IN = 'DINE_IN',
    TAKE_OUT = 'TAKE_OUT',
    ROOM_SERVICE = 'ROOM_SERVICE',
}

export enum PaymentMethod {
    CASH = 'EFECTIVO',
    CARD = 'TARJETA',
    TRANSFER = 'TRANSFERENCIA',
}

@Entity('restaurant_orders')
export class RestaurantOrder extends BaseAuditEntity {
    @Column({ unique: true })
    orderNumber: string;

    @ManyToOne(() => RestaurantTable)
    table: RestaurantTable;

    @Column({ nullable: true })
    tableId: string;

    @ManyToOne(() => Guest)
    guest: Guest;

    @Column({ nullable: true })
    guestId: string;

    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;

    @Column({ type: 'enum', enum: OrderType, default: OrderType.DINE_IN })
    orderType: OrderType;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    taxAmount: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, comment: 'IVA 19% incluido en precio' })
    taxRate: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    tipPercentage: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    tipAmount: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    discount: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    total: number;

    @Column({ type: 'text', nullable: true })
    items: string;

    @Column({ nullable: true })
    notes: string;

    @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
    paymentMethod: PaymentMethod;

    @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
    cashReceived: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
    change: number;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;
}