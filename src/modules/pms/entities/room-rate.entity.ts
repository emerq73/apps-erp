import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { RoomType } from './room-type.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum RateType {
    STANDARD = 'STANDARD',
    WEEKEND = 'WEEKEND',
    PROMOTIONAL = 'PROMOTIONAL',
    EARLY_BIRD = 'EARLY_BIRD',
    LAST_MINUTE = 'LAST_MINUTE',
}

@Entity('room_rates')
export class RoomRate extends BaseAuditEntity {
    @ManyToOne(() => RoomType)
    roomType: RoomType;

    @Column({ nullable: true })
    roomTypeId: string;

    @Column({ type: 'varchar', length: 20 })
    rateCode: string;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    price: number;

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date' })
    endDate: Date;

    @Column({ type: 'int', default: 1 })
    minNights: number;

    @Column({ type: 'int', default: 0 })
    maxNights: number;

    @Column({ type: 'int', default: 0 })
    minAdults: number;

    @Column({ type: 'int', default: 0 })
    maxAdults: number;

    @Column({ type: 'int', default: 0 })
    extraAdultPrice: number;

    @Column({ type: 'int', default: 0 })
    childPrice: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    description: string;

    @ManyToOne(() => Company)
    company: Company;
}