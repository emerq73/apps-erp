import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Company } from './company.entity';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

@Entity('cost_centers')
export class CostCenter extends BaseAuditEntity {
    @Column({ unique: true })
    code: string; // Ej: 100, 110, 111

    @Column()
    name: string; // Ej: Administración, Recepción, Restaurante

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => CostCenter, (cc) => cc.children, { nullable: true })
    parent: CostCenter | null;

    @OneToMany(() => CostCenter, (cc) => cc.parent)
    children: CostCenter[];

    @ManyToOne(() => Company, (company) => company.costCenters)
    company: Company;
}
