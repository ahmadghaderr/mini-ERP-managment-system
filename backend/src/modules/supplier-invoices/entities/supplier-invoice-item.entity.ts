import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupplierInvoice } from './supplier-invoice.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('supplier_invoice_items')
export class SupplierInvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'supplier_invoice_id', type: 'uuid' })
  supplierInvoiceId!: string;

  @ManyToOne(() => SupplierInvoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'supplier_invoice_id' })
  supplierInvoice!: SupplierInvoice;

  @Column({ name: 'extracted_product_name', length: 255 })
  extractedProductName!: string;

  @Column({ name: 'matched_product_id', type: 'uuid', nullable: true })
  matchedProductId?: string;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'matched_product_id' })
  matchedProduct?: Product;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  unitPrice?: number;
}
