import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Room } from './room.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum CleaningStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    VERIFIED = 'VERIFIED',
}

export enum CleaningType {
    STANDARD = 'STANDARD',
    DEEP = 'DEEP',
    TURNOVER = 'TURNOVER',
    MAINTENANCE = 'MAINTENANCE',
}

@Entity('cleaning_requests')
export class CleaningRequest extends BaseAuditEntity {
    @ManyToOne(() => Room)
    room: Room;

    @Column({ nullable: true })
    roomId: string;

    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;

    @Column({ type: 'date' })
    scheduledDate: Date;

    @Column({ type: 'time', nullable: true })
    scheduledTime: string;

    @Column({ type: 'date', nullable: true })
    completedDate: Date;

    @Column({ type: 'time', nullable: true })
    completedTime: string;

    @Column({
        type: 'enum',
        enum: CleaningStatus,
        default: CleaningStatus.PENDING
    })
    status: CleaningStatus;

    @Column({
        type: 'enum',
        enum: CleaningType,
        default: CleaningType.STANDARD
    })
    type: CleaningType;

    @Column({ nullable: true })
    assignedTo: string;

    @Column({ nullable: true })
    assignedToId: string;

    @Column({ nullable: true })
    supervisorId: string;

    @Column({ nullable: true })
    notes: string;

    @Column({ default: false })
    isUrgent: boolean;

    @Column({ nullable: true })
    verifiedBy: string;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    checklist: any;

    @Column({ type: 'jsonb', nullable: true })
    minibarConsumptions: any;
}