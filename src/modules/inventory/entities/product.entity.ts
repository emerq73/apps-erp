import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';
import { Account } from '../../accounting/entities/account.entity';

export enum ProductType {
    GOODS = 'GOODS',
    SERVICE = 'SERVICE'
}

@Entity('products')
export class Product extends BaseAuditEntity {
    @Column()
    code: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'enum', enum: ProductType, default: ProductType.GOODS })
    type: ProductType;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    cost: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    price: number;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Account, { nullable: true })
    inventoryAccount: Account;

    @ManyToOne(() => Account, { nullable: true })
    cogsAccount: Account; // Cost of Goods Sold

    @ManyToOne(() => Account, { nullable: true })
    incomeAccount: Account;

    @ManyToOne(() => Company)
    company: Company;
}
