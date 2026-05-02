import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import {
  InventoryMovement,
  MovementType,
} from './entities/inventory-movement.entity';
import { InventoryMovementItem } from './entities/inventory-movement-item.entity';
import { AccountingService } from '../accounting/accounting.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(InventoryMovement)
    private movementRepo: Repository<InventoryMovement>,
    @InjectRepository(InventoryMovementItem)
    private itemRepo: Repository<InventoryMovementItem>,
    private accountingService: AccountingService,
  ) {}

  @Get('products')
  async getProducts() {
    return this.productRepo.find();
  }

  @Get('warehouses')
  async getWarehouses() {
    return this.warehouseRepo.find();
  }

  @Post('movements')
  async createMovement(
    @Body()
    body: {
      type: MovementType;
      sourceWarehouseId?: string;
      destinationWarehouseId?: string;
      items: { productId: string; quantity: number; unitCost: number }[];
      description?: string;
    },
  ) {
    const movement = this.movementRepo.create({
      number: `INV-${Date.now()}`,
      date: new Date(),
      type: body.type,
      description: body.description,
    });
    await this.movementRepo.save(movement);

    for (const item of body.items) {
      const movementItem = this.itemRepo.create({
        movement,
        product: { id: item.productId } as Product,
        quantity: item.quantity,
        unitCost: item.unitCost,
      });
      await this.itemRepo.save(movementItem);

      await this.createAccountingEntry(movement, item);
    }

    return movement;
  }

  private async createAccountingEntry(movement: InventoryMovement, item: any) {
    try {
      const accounts = await this.accountingService.getAllAccounts();
      const inventoryAccount = accounts.find((a) => a.code === '1435');
      const cogsAccount = accounts.find((a) => a.code === '6135');
      const totalCost = item.quantity * item.unitCost;

      if (movement.type === MovementType.IN && inventoryAccount) {
        await this.accountingService.createEntry(
          inventoryAccount.id,
          cogsAccount?.id || inventoryAccount.id,
          totalCost,
          `Compra inventario: ${movement.number}`,
          undefined,
          undefined,
          movement.number,
        );
      } else if (
        movement.type === MovementType.OUT &&
        inventoryAccount &&
        cogsAccount
      ) {
        await this.accountingService.createEntry(
          cogsAccount.id,
          inventoryAccount.id,
          totalCost,
          `Venta inventario: ${movement.number}`,
          undefined,
          undefined,
          movement.number,
        );
      }
    } catch (e) {
      console.error('Error creating accounting entry:', e);
    }
  }
}
