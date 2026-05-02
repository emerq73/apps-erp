import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './company.entity';
import { ThirdParty } from './third-party.entity';

export enum RetentionType {
    RETENTION_SOURCE = 'RETENTION_SOURCE',    // Retención en la fuente
    RETENTION_IVA = 'RETENTION_IVA',      // Retención de IVA
    RETENTION_ICA = 'RETENTION_ICA',      // Retención de ICA/ICB
    SELF_RETENTION = 'SELF_RETENTION'     // Autoreretención
}

export enum RetentionRateType {
    FIXED = 'FIXED',      // Tarifa fija
    PERCENTAGE = 'PERCENTAGE',  // Porcentaje
    SCALE = 'SCALE'      // Escala
}

@Entity('retention_rates')
export class RetentionRate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: RetentionType })
    type: RetentionType;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    rate: number;

    @Column({ type: 'enum', enum: RetentionRateType, default: RetentionRateType.PERCENTAGE })
    rateType: RetentionRateType;

    @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
    minValue: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
    maxValue: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    accountCode: string;

    @ManyToOne(() => Company)
    company: Company;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('retention_certificates')
export class RetentionCertificate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    certificateNumber: string;

    @Column({ type: 'date' })
    issueDate: string;

    @Column({ type: 'date' })
    periodStart: string;

    @Column({ type: 'date' })
    periodEnd: string;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    baseIncome: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    retentionApplied: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    ivaRetention: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    icaRetention: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    totalRetention: number;

    @Column()
    status: string;

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => ThirdParty)
    thirdParty: ThirdParty;

    @ManyToOne(() => Company)
    company: Company;

    @CreateDateColumn()
    createdAt: Date;
}