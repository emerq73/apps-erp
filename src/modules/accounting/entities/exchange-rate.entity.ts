import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Currency } from './currency.entity';
import { Company } from './company.entity';

@Entity('exchange_rates')
export class ExchangeRate extends BaseAuditEntity {
    @ManyToOne(() => Currency)
    baseCurrency: Currency;

    @ManyToOne(() => Currency)
    targetCurrency: Currency;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'decimal', precision: 18, scale: 6 })
    rate: number;

    @ManyToOne(() => Company)
    company: Company;
}
