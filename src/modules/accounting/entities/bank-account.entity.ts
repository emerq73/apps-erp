import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from './company.entity';
import { Account } from './account.entity';

@Entity('bank_accounts')
export class BankAccount extends BaseAuditEntity {
  @Column()
  bankName: string;

  @Column()
  accountNumber: string;

  @Column({ type: 'enum', enum: ['SAVINGS', 'CHECKING'] })
  type: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Account)
  account: Account;

  @ManyToOne(() => Company)
  company: Company;
}
