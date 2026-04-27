import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum TierName {
    BRONZE = 'BRONZE',
    SILVER = 'SILVER',
    GOLD = 'GOLD',
    PLATINUM = 'PLATINUM'
}

@Entity('loyalty_tiers')
export class LoyaltyTier extends BaseAuditEntity {
    @Column({ type: 'enum', enum: TierName, unique: true })
    name: TierName;

    @Column({ type: 'int', default: 0 })
    minPoints: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    discountPercentage: number;

    @Column({ type: 'text', nullable: true })
    benefits: string;

    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;
}

@Entity('loyalty_points')
export class LoyaltyPoints extends BaseAuditEntity {
    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;

    @Column({ nullable: true })
    guestId: string;

    @Column({ type: 'int', default: 0 })
    availablePoints: number;

    @Column({ type: 'int', default: 0 })
    lifetimePoints: number;

    @Column({ type: 'enum', enum: TierName, default: TierName.BRONZE })
    currentTier: TierName;

    @Column({ type: 'timestamp', nullable: true })
    lastEarnedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    tierChangedAt: Date;
}

@Entity('loyalty_transactions')
export class LoyaltyTransaction extends BaseAuditEntity {
    @ManyToOne(() => LoyaltyPoints)
    loyaltyPoints: LoyaltyPoints;

    @Column({ nullable: true })
    loyaltyPointsId: string;

    @Column({ type: 'enum', enum: ['EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTMENT'], default: 'EARNED' })
    type: string;

    @Column({ type: 'int' })
    points: number;

    @Column({ nullable: true })
    reservationId: string;

    @Column({ type: 'text', nullable: true })
    notes: string;
}

@Entity('loyalty_redemptions')
export class LoyaltyRedemption extends BaseAuditEntity {
    @ManyToOne(() => LoyaltyPoints)
    loyaltyPoints: LoyaltyPoints;

    @Column({ nullable: true })
    loyaltyPointsId: string;

    @Column({ type: 'int' })
    pointsUsed: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    discountAmount: number;

    @Column({ nullable: true })
    reservationId: string;

    @Column({ default: false })
    used: boolean;

    @Column({ type: 'timestamp', nullable: true })
    usedAt: Date;
}