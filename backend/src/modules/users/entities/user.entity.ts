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

  @Column({ name: 'user_name', type: 'varchar', length: 150 })
  userName!: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255, unique: true })
  userEmail!: string;

  @Column({ name: 'cognito_sub', type: 'varchar', length: 255, unique: true })
  cognitoSub!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
