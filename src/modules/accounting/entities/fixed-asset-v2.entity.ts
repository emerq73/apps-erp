import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Account } from './account.entity';
import { Company } from './company.entity';

export enum AssetStatus {
    IN_USE = 'IN_USE',
    IN_REPAIR = 'IN_REPAIR',
    DISPOSED = 'DISPOSED',
    WRITE_OFF = 'WRITE_OFF'
}

export enum DepreciationMethod {
    LINEAL = 'LINEAL',
    SUMA_DIGITOS = 'SUMA_DIGITOS',
    UNIDADES_PRODUCIDAS = 'UNIDADES_PRODUCIDAS',
    DECLINING = 'DECLINING'
}

export enum AssetClassification {
    EDIFICACIONES = 'EDIFICACIONES',
    MAQUINARIA = 'MAQUINARIA',
    EQUIPO_TRANSPORTE = 'EQUIPO_TRANSPORTE',
    EQUIPO_OFICINA = 'EQUIPO_OFICINA',
    EQUIPO_COMPUTO = 'EQUIPO_COMPUTO',
    MUEBLES_ENSERES = 'MUEBLES_ENSERES',
    VEHICULOS = 'VEHICULOS',
    INTANGIBLES = 'INTANGIBLES',
    OTROS = 'OTROS'
}

@Entity('fixed_assets')
export class FixedAsset {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    code: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;

    @ManyToOne(() => Account)
    assetAccount: Account;

    @Column({ nullable: true })
    assetAccountId: string;

    @ManyToOne(() => Account)
    depreciationAccount: Account;

    @Column({ nullable: true })
    depreciationAccountId: string;

    @ManyToOne(() => Account)
    accumulatedDepreciationAccount: Account;

    @Column({ nullable: true })
    accumulatedDepreciationAccountId: string;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    originalValue: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    residualValue: number;

    @Column({ type: 'int' })
    usefulLifeYears: number;

    @Column({ type: 'int', default: 0 })
    usefulLifeUnits: number; // Para método de unidades producidas

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    unitsProduced: number; // Total unidades a producir

    @Column({ type: 'enum', enum: AssetClassification })
    classification: AssetClassification;

    @Column({ type: 'enum', enum: DepreciationMethod, default: DepreciationMethod.LINEAL })
    depreciationMethod: DepreciationMethod;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    depreciationRate: number; // Porcentaje anual (ej: 20% = 20)

    @Column({ type: 'date' })
    acquisitionDate: Date;

    @Column({ type: 'date', nullable: true })
    startDepreciationDate: Date;

    @Column({ type: 'date', nullable: true })
    endDepreciationDate: Date;

    @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.IN_USE })
    status: AssetStatus;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    accumulatedDepreciation: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    currentValue: number;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    responsible: string;

    @Column({ nullable: true })
    serialNumber: string;

    @Column({ nullable: true })
    brand: string;

    @Column({ nullable: true })
    model: string;

    @Column({ default: false })
    isFullyDepreciated: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('asset_depreciation_log')
export class AssetDepreciationLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    assetId: string;

    @Column({ type: 'date' })
    periodDate: Date; // Fecha del período (normalmente fin de mes)

    @Column({ type: 'int' })
    periodYear: number;

    @Column({ type: 'int' })
    periodMonth: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    depreciationAmount: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    accumulatedDepreciation: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    bookValue: number;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    unitsDepreciated: number;

    @Column({ default: false })
    isPosted: boolean;

    @Column({ nullable: true })
    journalEntryId: string;

    @CreateDateColumn()
    createdAt: Date;
}