import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessage, User])],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}