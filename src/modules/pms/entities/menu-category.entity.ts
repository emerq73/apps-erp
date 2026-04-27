import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';

@Entity('menu_categories')
export class MenuCategory extends BaseAuditEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'int', default: 1 })
    order: number;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;
}