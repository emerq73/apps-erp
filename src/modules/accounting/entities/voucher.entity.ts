import { Entity, Column, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { Company } from './company.entity';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

export enum VoucherType {
    EGRESO = 'EGRESO',
    INGRESO = 'INGRESO',
    DIARIO = 'DIARIO',
}

@Entity('vouchers')
export class Voucher extends BaseAuditEntity {
    @Column({ unique: true })
    number: string; // Consecutivo: CE-001, RC-001, etc.

    @Column({ type: 'date' })
    date: Date;

    @Column()
    description: string;

    @Column({
        type: 'enum',
        enum: VoucherType,
        default: VoucherType.DIARIO,
    })
    type: VoucherType;

    @OneToMany(() => JournalEntry, (entry) => entry.voucher, { cascade: true })
    entries: JournalEntry[];

    @ManyToOne(() => Company, (company) => company.vouchers)
    company: Company;
}
