import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Account } from './account.entity';
import { User } from '../../auth/entities/user.entity';
import { ThirdParty } from './third-party.entity';
import { CostCenter } from './cost-center.entity';
import { Company } from './company.entity';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Account)
    debitAccount: Account;

    @ManyToOne(() => Account)
    creditAccount: Account;

    @ManyToOne(() => ThirdParty, { nullable: true })
    thirdParty: ThirdParty;

    @ManyToOne(() => CostCenter, { nullable: true })
    costCenter: CostCenter;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount: number;

    @Column()
    description: string;

    @Column({ nullable: true })
    reference: string; // Factura ID, Reserva ID, etc.

    @ManyToOne(() => User)
    createdBy: User;

    @ManyToOne(() => Company)
    company: Company;

    @CreateDateColumn()
    date: Date;
}
