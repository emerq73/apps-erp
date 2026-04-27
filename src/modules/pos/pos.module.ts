import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale, SaleItem, PosProduct } from './entities/sale.entity';
import { AccountingModule } from '../accounting/accounting.module';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Sale, SaleItem, PosProduct]),
        AccountingModule,
    ],
    controllers: [PosController],
    providers: [PosService],
    exports: [TypeOrmModule, PosService]
})
export class PosModule { }