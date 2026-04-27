import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Voucher } from './voucher.entity';
import { Account } from './account.entity';
import { ThirdParty } from './third-party.entity';
import { CostCenter } from './cost-center.entity';
import { Currency } from './currency.entity';
@Entity('journal_entries')
export class JournalEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Voucher, (voucher) => voucher.entries, { onDelete: 'CASCADE' })
    voucher: Voucher;

    @ManyToOne(() => Account)
    account: Account;

    @ManyToOne(() => ThirdParty, { nullable: true })
    thirdParty: ThirdParty;

    @ManyToOne(() => CostCenter, { nullable: true })
    costCenter: CostCenter;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    debit: number; // En moneda base (local)

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    credit: number; // En moneda base (local)

    // Soporté Multi-Moneda
    @ManyToOne(() => Currency, { nullable: true })
    currency: Currency;

    @Column({ type: 'decimal', precision: 18, scale: 6, default: 1 })
    exchangeRate: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    foreignDebit: number; // En la moneda de la transacción

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    foreignCredit: number; // En la moneda de la transacción

    // Soporte Fiscal
    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    taxBaseAmount: number; // Base sobre la cual se calculó un impuesto

    @Column()
    description: string;
}
