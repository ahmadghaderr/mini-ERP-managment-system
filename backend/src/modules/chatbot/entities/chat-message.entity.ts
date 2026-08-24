import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('chat_message')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'chat_session_id', type: 'uuid' })
  chatSessionId!: string;

  @ManyToOne(() => ChatSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_session_id' })
  chatSession!: ChatSession;

  @Column({ type: 'varchar', length: 20 })
  role!: 'user' | 'assistant';

  @Column({ type: 'text' })
  text!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}