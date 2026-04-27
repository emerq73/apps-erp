import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from './company.entity';
import { Account } from './account.entity';

@Entity('fixed_assets')
export class FixedAsset extends BaseAuditEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'date', nullable: true })
    acquisitionDate: Date;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    acquisitionValue: number;

    @Column({ type: 'int', default: 0, comment: 'Useful life in months' })
    usefulLifeMonths: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    accumulatedDepreciation: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    salvageValue: number;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Account, { nullable: true })
    assetAccount: Account;

    @ManyToOne(() => Account, { nullable: true })
    depreciationAccount: Account;

    @ManyToOne(() => Account, { nullable: true })
    expenseAccount: Account;

    @ManyToOne(() => Company)
    company: Company;
}
