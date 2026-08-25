import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderItem } from './entities/customer-order-item.entity';
import { CustomerOrderItemAllocation } from './entities/customer-order-item-allocation.entity';
import { CustomerOrdersService } from './customer-orders.service';
import { CustomerOrdersController } from './customer-orders.controller';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOrder,
      CustomerOrderItem,
      CustomerOrderItemAllocation,
      WarehouseProduct,
      StockMovement,
      User,
      Product,
      NotificationsModule
    ]),
  ],
  controllers: [CustomerOrdersController],
  providers: [CustomerOrdersService],
  exports: [CustomerOrdersService, TypeOrmModule],
})
export class CustomerOrdersModule {}