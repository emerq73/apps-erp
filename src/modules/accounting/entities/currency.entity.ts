import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

@Entity('currencies')
export class Currency extends BaseAuditEntity {
  @Column({ unique: true })
  code: string; // Ej: USD, COP, EUR

  @Column()
  name: string; // Ej: US Dollar, Peso Colombiano

  @Column({ nullable: true })
  symbol: string; // Ej: $, €, £

  @Column({ default: true })
  isActive: boolean;
}
