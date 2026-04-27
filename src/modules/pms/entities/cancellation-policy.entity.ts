import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum PenaltyType {
    PERCENTAGE = 'PERCENTAGE',
    NIGHTS = 'NIGHTS',
    FIXED = 'FIXED',
}

export enum GuestIs {
    NO_SHOW = 'NO_SHOW',
    DIFFERENT_DATE = 'DIFFERENT_DATE',
}

@Entity('cancellation_policies')
export class CancellationPolicy extends BaseAuditEntity {
    @Column()
    name: string;

    @Column({ type: 'varchar', length: 50 })
    policyCode: string;

    @Column({ type: 'int', default: 0 })
    daysBeforeCheckIn: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    penaltyPercentage: number;

    @Column({ type: 'int', default: 0 })
    penaltyNights: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    penaltyFixed: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    description: string;

    @ManyToOne(() => Company)
    company: Company;
}