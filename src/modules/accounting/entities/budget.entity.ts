import { Entity, Column, ManyToOne } from 'typeorm';
import { Company } from './company.entity';
import { Account } from './account.entity';
import { CostCenter } from './cost-center.entity';
import { AccountingPeriod } from './accounting-period.entity';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

@Entity('budgets')
export class Budget extends BaseAuditEntity {
  @ManyToOne(() => CostCenter)
  costCenter: CostCenter;

  @ManyToOne(() => AccountingPeriod)
  period: AccountingPeriod;

  @ManyToOne(() => Account)
  account: Account;

  @Column({ type: 'integer' })
  year: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @ManyToOne(() => Company)
  company: Company;
}
