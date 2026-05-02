import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomType } from './entities/room-type.entity';
import { Room } from './entities/room.entity';
import { Guest } from './entities/guest.entity';
import { Reservation } from './entities/reservation.entity';
import { RoomRate } from './entities/room-rate.entity';
import { CancellationPolicy } from './entities/cancellation-policy.entity';
import { Invoice } from './entities/invoice.entity';
import { CleaningRequest } from './entities/cleaning-request.entity';
import { HousekeepingStaff } from './entities/housekeeping-staff.entity';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { MaintenanceStaff } from './entities/maintenance-staff.entity';
import { RestaurantTable } from './entities/restaurant-table.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { RestaurantOrder } from './entities/restaurant-order.entity';
import { LoyaltyTier, LoyaltyPoints, LoyaltyTransaction, LoyaltyRedemption } from './entities/loyalty.entity';
import { CashDrawer, CashDrawerTransaction } from './entities/cash-drawer.entity';
import { ReservationAlert, PaymentSplit, DepositTransfer, SharedInventoryLink } from './entities/pms-extensions.entity';
import { PmsService } from './pms.service';
import { PmsController } from './pms.controller';
import { PmsPublicController } from './pms-public.controller';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
    imports: [TypeOrmModule.forFeature([
        RoomType, Room, Guest, Reservation, RoomRate, CancellationPolicy, Invoice, 
        CleaningRequest, HousekeepingStaff, MaintenanceRequest, MaintenanceStaff,
        RestaurantTable, MenuCategory, MenuItem, RestaurantOrder,
        LoyaltyTier, LoyaltyPoints, LoyaltyTransaction, LoyaltyRedemption,
        CashDrawer, CashDrawerTransaction, ReservationAlert, PaymentSplit, DepositTransfer, SharedInventoryLink
    ]), AccountingModule],
    providers: [PmsService],
    controllers: [PmsController, PmsPublicController],
    exports: [TypeOrmModule, PmsService]
})
export class PmsModule {}
