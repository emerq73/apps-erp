import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Company } from './company.entity';
import { Account } from './account.entity';

@Entity('taxes')
export class Tax {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    type: string; // 'IVA', 'Retención Fuente', 'Retención IVA', 'ICA', etc.

    @Column('decimal', { precision: 10, scale: 2 })
    rate: number; // Porcentaje (ej: 19.00)

    @Column('decimal', { precision: 18, scale: 2, default: 0 })
    baseAmount: number; // Base mínima para aplicar

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Account, { nullable: true })
    account: Account; // Cuenta contable asociada

    @ManyToOne(() => Company, { nullable: false })
    company: Company;
}
