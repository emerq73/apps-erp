import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';
import { Warehouse } from './warehouse.entity';
import { InventoryMovementItem } from './inventory-movement-item.entity';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
}

@Entity('inventory_movements')
export class InventoryMovement extends BaseAuditEntity {
  @Column()
  number: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Warehouse, { nullable: true })
  sourceWarehouse: Warehouse;

  @ManyToOne(() => Warehouse, { nullable: true })
  destinationWarehouse: Warehouse;

  @ManyToOne(() => Company)
  company: Company;

  @OneToMany(() => InventoryMovementItem, (item) => item.movement, {
    cascade: true,
  })
  items: InventoryMovementItem[];
}
