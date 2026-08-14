import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductCategory } from '../../../common/enums';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_name', length: 255 })
  productName!: string;

  @Column({ type: 'enum', enum: ProductCategory })
  category!: ProductCategory;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
