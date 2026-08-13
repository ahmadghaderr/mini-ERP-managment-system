import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseProduct } from './entities/warehouse-prouct.entity';
import { StockMovement } from './entities/stock-movement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseProduct, StockMovement])],
  exports: [TypeOrmModule],
})
export class StockModule {}
