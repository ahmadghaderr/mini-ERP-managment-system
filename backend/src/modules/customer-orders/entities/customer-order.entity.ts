import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
import { CustomerOrderItem } from './customer-order-item.entity';
import { CustomerOrderStatus } from '../../../common/enums';

@Entity('customer_order')
export class CustomerOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({ name: 'extracted_customer_name', length: 200, nullable: true })
  extractedCustomerName?: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column({
    type: 'enum',
    enum: CustomerOrderStatus,
    default: CustomerOrderStatus.PENDING,
  })
  status!: CustomerOrderStatus;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt?: Date;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: User;

  @OneToMany(() => CustomerOrderItem, (item) => item.customerOrder, {
    cascade: true,
  })
  items!: CustomerOrderItem[];
}
