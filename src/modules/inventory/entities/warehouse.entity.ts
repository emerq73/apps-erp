import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';

@Entity('warehouses')
export class Warehouse extends BaseAuditEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    location: string;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Company)
    company: Company;
}
