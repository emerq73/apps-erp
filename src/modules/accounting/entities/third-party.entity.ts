import { Entity, Column, ManyToOne } from 'typeorm';
import { Company } from './company.entity';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

export enum ThirdPartyType {
  PERSONA_NATURAL = 'PN',
  PERSONA_JURIDICA = 'PJ',
}

@Entity('third_parties')
export class ThirdParty extends BaseAuditEntity {
  @Column({ unique: true })
  identification: string; // NIT o Cédula

  @Column({ nullable: true })
  dv: string; // Dígito de Verificación (para NIT)

  @Column()
  name: string; // Razón Social o Nombre Completo

  @Column({
    type: 'enum',
    enum: ThirdPartyType,
    default: ThirdPartyType.PERSONA_JURIDICA,
  })
  type: ThirdPartyType;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Company, (company) => company.thirdParties)
  company: Company;
}
