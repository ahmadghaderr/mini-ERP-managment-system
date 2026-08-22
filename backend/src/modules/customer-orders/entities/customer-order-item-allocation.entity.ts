import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerOrderItem } from './customer-order-item.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';

@Entity('customer_order_item_allocations')
export class CustomerOrderItemAllocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_order_item_id' })
  customerOrderItemId!: string;

  @ManyToOne(() => CustomerOrderItem)
  @JoinColumn({ name: 'customer_order_item_id' })
  customerOrderItem!: CustomerOrderItem;

  @Column({ name: 'warehouse_id' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column('int')
  quantity!: number;
}