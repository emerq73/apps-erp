import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { Product } from './product.entity';

@Entity('inventory_movement_items')
export class InventoryMovementItem extends BaseAuditEntity {
    @Column({ type: 'decimal', precision: 18, scale: 2 })
    quantity: number;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    unitCost: number;

    @ManyToOne(() => Product)
    product: Product;

    @ManyToOne(() => InventoryMovement, movement => movement.items)
    movement: InventoryMovement;
}
