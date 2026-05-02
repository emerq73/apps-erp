import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum GuestDocType {
  CC = 'CC', // Cédula de Ciudadanía
  CE = 'CE', // Cédula de Extranjería
  PASSPORT = 'PASSPORT',
  NIT = 'NIT',
}

@Entity('guests')
export class Guest extends BaseAuditEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: GuestDocType, default: GuestDocType.CC })
  docType: GuestDocType;

  @Column({ unique: false, nullable: true, default: '' })
  docNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true, default: 'DIRECT' })
  source: string;

  @ManyToOne(() => Company)
  company: Company;
}
