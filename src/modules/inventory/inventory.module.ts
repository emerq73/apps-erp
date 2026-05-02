import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryMovementItem } from './entities/inventory-movement-item.entity';
import { InventoryController } from './inventory.controller';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Warehouse,
      InventoryMovement,
      InventoryMovementItem,
    ]),
    forwardRef(() => AccountingModule),
  ],
  controllers: [InventoryController],
  providers: [],
  exports: [TypeOrmModule, AccountingModule],
})
export class InventoryModule {}
