import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_name', type: 'varchar', length: 150 })
  userName!: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255, unique: true })
  userEmail!: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
