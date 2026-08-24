import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseProduct } from './entities/warehouse-prouct.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WarehouseProduct, StockMovement]),
    NotificationsModule,
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService, TypeOrmModule],
})
export class StockModule {}