import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderItem } from './entities/customer-order-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrder, CustomerOrderItem])],
  exports: [TypeOrmModule],
})
export class CustomerOrdersModule {}
