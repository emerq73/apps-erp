import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from './company.entity';
import { Account } from './account.entity';

@Entity('cash_boxes')
export class CashBox extends BaseAuditEntity {
  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Account)
  account: Account;

  @ManyToOne(() => Company)
  company: Company;
}
