import { Entity, Column, ManyToOne } from 'typeorm';
import { Company } from './company.entity';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

export enum PeriodStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
}

@Entity('accounting_periods')
export class AccountingPeriod extends BaseAuditEntity {
    @Column()
    year: number;

    @Column()
    month: number;

    @Column({
        type: 'enum',
        enum: PeriodStatus,
        default: PeriodStatus.OPEN,
    })
    status: PeriodStatus;

    @ManyToOne(() => Company)
    company: Company;
}
