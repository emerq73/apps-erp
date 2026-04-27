import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Room } from './room.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum MaintenanceStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    VERIFIED = 'VERIFIED',
    CANCELLED = 'CANCELLED',
}

export enum MaintenancePriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

@Entity('maintenance_requests')
export class MaintenanceRequest extends BaseAuditEntity {
    @ManyToOne(() => Room)
    room: Room;

    @Column({ nullable: true })
    roomId: string;

    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;

    @Column({ type: 'date' })
    requestedDate: Date;

    @Column({ type: 'date', nullable: true })
    completedDate: Date;

    @Column({
        type: 'enum',
        enum: MaintenanceStatus,
        default: MaintenanceStatus.PENDING
    })
    status: MaintenanceStatus;

    @Column({
        type: 'enum',
        enum: MaintenancePriority,
        default: MaintenancePriority.MEDIUM
    })
    priority: MaintenancePriority;

    @Column({ nullable: true })
    assignedToId: string;

    @Column({ nullable: true })
    assignedTo: string;

    @Column({ nullable: true })
    supervisorId: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    issue: string;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    cost: number;

    @Column({ nullable: true })
    completedBy: string;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    @Column({ nullable: true })
    verifiedBy: string;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt: Date;
}