import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerOrder } from './customer-order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('customer_order_items')
export class CustomerOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_order_id', type: 'uuid' })
  customerOrderId!: string;

  @ManyToOne(() => CustomerOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_order_id' })
  customerOrder!: CustomerOrder;

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
