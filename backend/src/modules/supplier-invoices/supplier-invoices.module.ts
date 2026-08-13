import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierInvoice } from './entities/supplier-invoice.entity';
import { SupplierInvoiceItem } from './entities/supplier-invoice-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierInvoice, SupplierInvoiceItem])],
  exports: [TypeOrmModule],
})
export class SupplierInvoicesModule {}
