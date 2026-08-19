import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderItem } from './entities/customer-order-item.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { CustomerOrdersService } from './customer-orders.service';
import { CustomerOrdersController } from './customer-orders.controller';
import { CustomerOrderItemAllocation } from './entities/customer-order-item-allocation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOrder,
      CustomerOrderItem,
      CustomerOrderItemAllocation,
      WarehouseProduct,
      StockMovement,
    ]),
  ],
  controllers: [CustomerOrdersController],
  providers: [CustomerOrdersService],
  exports: [CustomerOrdersService],
})
export class CustomerOrdersModule {}