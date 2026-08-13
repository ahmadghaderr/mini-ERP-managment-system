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
import { SupplierInvoiceItem } from './supplier-invoice-item.entity';
import { SupplierInvoiceStatus } from '../../../common/enums';

@Entity('supplier_invoice')
export class SupplierInvoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({ name: 'extracted_supplier_name', length: 200, nullable: true })
  extractedSupplierName?: string;

  @Column({ name: 'invoice_date_extracted', type: 'date', nullable: true })
  invoiceDateExtracted?: Date;

  @Column({ name: 'extracted_delivery_date', type: 'date', nullable: true })
  extractedDeliveryDate?: Date;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column({
    type: 'enum',
    enum: SupplierInvoiceStatus,
    default: SupplierInvoiceStatus.PENDING_EXTRACTION,
  })
  status!: SupplierInvoiceStatus;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: User;

  @OneToMany(() => SupplierInvoiceItem, (item) => item.supplierInvoice, {
    cascade: true,
  })
  items!: SupplierInvoiceItem[];
}
