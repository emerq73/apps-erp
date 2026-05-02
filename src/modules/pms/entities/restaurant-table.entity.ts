import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

@Entity('restaurant_tables')
export class RestaurantTable extends BaseAuditEntity {
  @Column()
  tableNumber: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'int', default: 4 })
  capacity: number;

  @Column({ type: 'int', default: 2 })
  minCapacity: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.AVAILABLE })
  status: TableStatus;

  @Column({ nullable: true })
  location: string;

  @Column({ default: false })
  isActive: boolean;

  @ManyToOne(() => Company)
  company: Company;

  @Column({ nullable: true })
  companyId: string;
}
