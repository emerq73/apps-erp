import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';
import { Room } from './room.entity';
import { Guest } from './guest.entity';

export enum ReservationStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CHECKED_IN = 'CHECKED_IN',
    CHECKED_OUT = 'CHECKED_OUT',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
    BLOCKED = 'BLOCKED',
}

export enum ReservationSource {
    DIRECT = 'DIRECT',
    PHONE = 'PHONE',
    WALK_IN = 'WALK_IN',
    OTA = 'OTA',
    CORPORATE = 'CORPORATE',
    BOOKING_ENGINE = 'BOOKING_ENGINE',
}

@Entity('reservations')
export class Reservation extends BaseAuditEntity {
    @Column({ unique: false })
    reservationNumber: string;

    @ManyToOne(() => Room)
    room: Room;

    @ManyToOne(() => Guest)
    guest: Guest;

    @Column({ nullable: true })
    guestId: string;

    @Column({ nullable: true })
    roomId: string;

    @Column({ type: 'date' })
    checkIn: Date;

    @Column({ type: 'date' })
    checkOut: Date;

    @Column({ type: 'int', default: 1 })
    adults: number;

    @Column({ type: 'int', default: 0 })
    children: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    ratePerNight: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    totalAmount: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    paidAmount: number;

    @Column({
        type: 'enum',
        enum: ReservationStatus,
        default: ReservationStatus.PENDING
    })
    status: ReservationStatus;

    @Column({
        type: 'enum',
        enum: ReservationSource,
        default: ReservationSource.DIRECT
    })
    source: ReservationSource;

    @Column({ nullable: true })
    specialRequests: string;

    @Column({ nullable: true })
    internalNotes: string;

    @Column({ type: 'time', nullable: true })
    earlyCheckIn: string;

    @Column({ type: 'time', nullable: true })
    lateCheckOut: string;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    earlyCheckInFee: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    lateCheckOutFee: number;

    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;

    @Column({ default: false })
    isBlocked: boolean;

    @Column({ default: false })
    isUnassigned: boolean; // Para reservas sin asignar habitación

    @Column({ type: 'timestamp', nullable: true })
    actualCheckInTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    actualCheckOutTime: Date;

    @Column({ type: 'text', nullable: true })
    guestSignature: string;

    @Column({ nullable: true })
    idDocumentType: string;

    @Column({ nullable: true })
    idDocumentNumber: string;

    @Column({ nullable: true })
    keyCardNumber: string;

    @Column({ type: 'timestamp', nullable: true })
    keyCardIssuedAt: Date;

    @Column({ type: 'text', nullable: true })
    checkInNotes: string;

    @Column({ default: false })
    hasRedAlert: boolean;

    @Column({ default: false })
    hasYellowAlert: boolean;

    @Column({ type: 'varchar', nullable: true, length: 500 })
    alertMessage: string | null;
}
