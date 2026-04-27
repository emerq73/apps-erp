import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Company } from './company.entity';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

@Entity('accounts')
export class Account extends BaseAuditEntity {
    @Column()
    code: string; // Ej: 110505

    @Column()
    name: string; // Ej: Caja General

    @Column({
        type: 'enum',
        enum: ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'costo'],
        default: 'activo'
    })
    type: string;

    @Column({
        type: 'enum',
        enum: ['débito', 'crédito'],
        default: 'débito'
    })
    nature: string;

    @Column({
        type: 'enum',
        enum: ['grupo1', 'grupo2', 'grupo3'],
        default: 'grupo2',
        nullable: true
    })
    niifGroup: string;

    @Column({ nullable: true })
    niifClassification: string; // Ej: Efectivo y equivalentes

    @Column({ default: false })
    requiresThirdParty: boolean;

    @Column({ default: false })
    requiresCostCenter: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isTaxAccount: boolean;

    @Column({ nullable: true })
    taxCode: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    taxRate: number;

    @Column({ default: false })
    isRetentionAccount: boolean;

    @Column({ nullable: true })
    retentionCode: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    retentionRate: number;

    @Column({ default: 0, type: 'decimal', precision: 18, scale: 2 })
    balance: number;

    @ManyToOne(() => Account, (account) => account.children)
    parent: Account;

    @OneToMany(() => Account, (account) => account.parent)
    children: Account[];

    @ManyToOne(() => Company, (company) => company.accounts)
    company: Company;
}
