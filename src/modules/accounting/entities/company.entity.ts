import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Account } from './account.entity';
import { Voucher } from './voucher.entity';
import { ThirdParty } from './third-party.entity';
import { CostCenter } from './cost-center.entity';

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    nit: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    website: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    logoUrl: string;

    @OneToMany(() => Account, (account) => account.company)
    accounts: Account[];

    @OneToMany(() => Voucher, (voucher) => voucher.company)
    vouchers: Voucher[];

    @OneToMany(() => ThirdParty, (tp) => tp.company)
    thirdParties: ThirdParty[];

    @OneToMany(() => CostCenter, (cc) => cc.company)
    costCenters: CostCenter[];

    @Column({ default: 'COP' })
    currency: string;

    @Column({ default: 'America/Bogota' })
    timezone: string;

    @Column({ default: 'es' })
    language: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
