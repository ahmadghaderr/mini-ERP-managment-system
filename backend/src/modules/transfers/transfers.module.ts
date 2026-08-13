import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseTransfer])],
  exports: [TypeOrmModule],
})
export class TransfersModule {}
