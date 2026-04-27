import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { MenuCategory } from './menu-category.entity';
import { Company } from '../../accounting/entities/company.entity';

@Entity('menu_items')
export class MenuItem extends BaseAuditEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    price: number;

    @ManyToOne(() => MenuCategory)
    category: MenuCategory;

    @Column({ nullable: true })
    categoryId: string;

    @Column({ default: true })
    isAvailable: boolean;

    @Column({ default: false })
    isActive: boolean;

    @Column({ nullable: true })
    imageUrl: string;

    @ManyToOne(() => Company)
    company: Company;

    @Column({ nullable: true })
    companyId: string;
}