import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_name', length: 150 })
  userName!: string;

  @Column({ name: 'user_email', length: 255, unique: true })
  userEmail!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
